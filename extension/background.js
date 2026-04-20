// background.js — v5
// Features:
//  • Hidden background tab for bulk scraping (tab-switch-safe)
//  • Auto-saves extract history to storage on every completion
//  • Finds matching Chrome bookmarks for the novel and updates their title
//    to reflect the latest chapter read
//  • Logs every bookmark update to novelbin_bookmark_log in storage

// ── Storage keys ─────────────────────────────────────────────────────────────
const BULK_STATE_KEY   = "novelbin_bulk_state";
const BULK_TEXT_KEY    = "novelbin_bulk_text";
const HISTORY_KEY      = "novelbin_history";
const BOOKMARK_LOG_KEY = "novelbin_bookmark_log";
const MAX_HISTORY      = 20;
const MAX_BM_LOG       = 50;

// ── Session refs ─────────────────────────────────────────────────────────────
let scrapeTabId = null;
let stopped     = false;

// ── Generic storage helpers ──────────────────────────────────────────────────
function storageGet(keys) {
  return new Promise(r => chrome.storage.local.get(keys, r));
}
function storageSet(obj) {
  return new Promise(r => chrome.storage.local.set(obj, r));
}
function storageRemove(keys) {
  return new Promise(r => chrome.storage.local.remove(keys, r));
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Auto-save extract history ─────────────────────────────────────────────────
async function autoSaveHistory(entry) {
  const data = await storageGet(HISTORY_KEY);
  let history = data[HISTORY_KEY] || [];
  history.unshift(entry);
  if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
  await storageSet({ [HISTORY_KEY]: history });
}

function buildHistoryEntry({ type, firstChapter, lastChapter, chaptersCount, text, novelUrl }) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    timestamp: Date.now(),
    type, firstChapter, lastChapter, chaptersCount,
    words, chars: text.length,
    novelUrl: novelUrl || "",
    text
  };
}

// ── Bookmark update helpers ───────────────────────────────────────────────────
// Extract novel base URL from a chapter URL
// e.g. "https://novelbin.com/b/novel-slug/chapter-123" → "https://novelbin.com/b/novel-slug"
function novelBaseUrl(chapterUrl) {
  try {
    const url = new URL(chapterUrl);
    const parts = url.pathname.split("/").filter(Boolean); // ["b","novel-slug","chapter-xxx"]
    if (parts.length >= 2) {
      return `${url.origin}/${parts[0]}/${parts[1]}`;
    }
  } catch {}
  return null;
}

// Search bookmarks whose URL starts with the novel base URL
async function findNovelBookmarks(baseUrl) {
  return new Promise(resolve => {
    chrome.bookmarks.search({ url: baseUrl }, results => {
      // search by url prefix isn't supported — search by url exactly first
      // then fall back to getTree scan for prefix matches
      resolve(results || []);
    });
  });
}

async function findBookmarksByUrlPrefix(prefix) {
  // Chrome bookmarks.search doesn't support prefix — walk the tree
  return new Promise(resolve => {
    chrome.bookmarks.getTree(tree => {
      const matches = [];
      function walk(nodes) {
        for (const node of nodes) {
          if (node.url && node.url.startsWith(prefix)) matches.push(node);
          if (node.children) walk(node.children);
        }
      }
      walk(tree);
      resolve(matches);
    });
  });
}

// Update bookmark title and URL, log the change
async function updateNovelBookmark({ bookmarkId, oldTitle, newTitle, newUrl, chapterTitle, novelUrl }) {
  await new Promise(resolve => {
    chrome.bookmarks.update(bookmarkId, { title: newTitle, url: newUrl }, resolve);
  });

  // Append to bookmark log
  const data = await storageGet(BOOKMARK_LOG_KEY);
  let log = data[BOOKMARK_LOG_KEY] || [];
  log.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    timestamp: Date.now(),
    bookmarkId,
    oldTitle,
    newTitle,
    newUrl,
    chapterTitle,
    novelUrl
  });
  if (log.length > MAX_BM_LOG) log = log.slice(0, MAX_BM_LOG);
  await storageSet({ [BOOKMARK_LOG_KEY]: log });
}

// Main bookmark update logic: find bookmark for this novel, update to latest chapter
async function tryUpdateBookmark(chapterUrl, chapterTitle) {
  const base = novelBaseUrl(chapterUrl);
  if (!base) return { updated: false, reason: "Could not parse novel URL" };

  // Find any bookmark that points to this novel (any chapter or the novel page itself)
  const matches = await findBookmarksByUrlPrefix(base);
  if (matches.length === 0) return { updated: false, reason: "No bookmark found for this novel" };

  // Use the chapter URL as new bookmark URL, chapter title as new title
  const newTitle = chapterTitle || "NovelBin Chapter";
  const updated = [];

  for (const bm of matches) {
    await updateNovelBookmark({
      bookmarkId: bm.id,
      oldTitle:   bm.title,
      newTitle,
      newUrl:     chapterUrl,
      chapterTitle,
      novelUrl:   base
    });
    updated.push({ id: bm.id, oldTitle: bm.title });
  }

  return { updated: true, count: updated.length, bookmarks: updated };
}

// ── Tab helpers ───────────────────────────────────────────────────────────────
function waitForTabLoad(tabId, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error("Page load timeout"));
    }, timeoutMs);
    function listener(id, info) {
      if (id === tabId && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);
        clearTimeout(timer);
        resolve();
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
  });
}

async function injectAndExtract(tabId) {
  await chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] }).catch(() => {});
  await sleep(400);
  return new Promise(resolve => {
    chrome.tabs.sendMessage(tabId, { action: "extractChapter" }, resp => {
      if (chrome.runtime.lastError)
        resolve({ error: chrome.runtime.lastError.message, content: "", title: "" });
      else
        resolve(resp || { error: "No response", content: "", title: "" });
    });
  });
}

async function getNextUrl(tabId) {
  return new Promise(resolve => {
    chrome.tabs.sendMessage(tabId, { action: "getNextUrl" }, resp => {
      if (chrome.runtime.lastError) resolve({ nextUrl: null, isLast: true });
      else resolve(resp || { nextUrl: null, isLast: true });
    });
  });
}

function broadcast(payload) {
  chrome.runtime.sendMessage(payload).catch(() => {});
}

// ── Bulk scrape loop ──────────────────────────────────────────────────────────
async function runBulk(startUrl) {
  stopped = false;
  const allChunks   = [];
  let chaptersCount = 0;
  let firstTitle    = "";
  let lastTitle     = "";
  let lastUrl       = startUrl;
  let currentUrl    = startUrl;

  const tab = await chrome.tabs.create({ url: startUrl, active: false });
  scrapeTabId = tab.id;

  await storageSet({
    [BULK_STATE_KEY]: { running: true, chaptersCount: 0, firstTitle: "", lastTitle: "", startUrl, startedAt: Date.now() },
    [BULK_TEXT_KEY]: ""
  });

  try {
    while (!stopped) {
      await chrome.tabs.update(scrapeTabId, { url: currentUrl });
      await waitForTabLoad(scrapeTabId);
      await sleep(700);

      const result = await injectAndExtract(scrapeTabId);

      if (result.error && !result.content) {
        broadcast({ action: "bulkProgress", error: result.error, chaptersCount, done: true });
        await storageSet({ [BULK_STATE_KEY]: { running: false, chaptersCount, firstTitle, lastTitle, error: result.error } });
        break;
      }

      chaptersCount++;
      lastTitle = result.title;
      lastUrl   = currentUrl;
      if (!firstTitle) firstTitle = result.title;

      allChunks.push(`\n\n${"─".repeat(60)}\n${result.title}\n${"─".repeat(60)}\n\n${result.content}`);
      const fullText = allChunks.join("");

      await storageSet({
        [BULK_STATE_KEY]: { running: true, chaptersCount, firstTitle, lastTitle, lastUrl, startUrl },
        [BULK_TEXT_KEY]: fullText
      });

      const nav = await getNextUrl(scrapeTabId);
      const isDone = nav.isLast || !nav.nextUrl;

      broadcast({ action: "bulkProgress", chaptersCount, currentTitle: result.title, firstTitle, lastTitle, lastUrl, fullText, done: isDone });

      if (isDone) {
        // ── Auto-save history ────────────────────────────────────────────────
        const entry = buildHistoryEntry({
          type: "bulk", firstChapter: firstTitle, lastChapter: lastTitle,
          chaptersCount, text: fullText, novelUrl: novelBaseUrl(startUrl)
        });
        await autoSaveHistory(entry);
        broadcast({ action: "historyUpdated" });

        // ── Auto-update bookmark ─────────────────────────────────────────────
        const bmResult = await tryUpdateBookmark(lastUrl, lastTitle);
        broadcast({ action: "bookmarkUpdated", result: bmResult, chapterTitle: lastTitle });

        await storageSet({ [BULK_STATE_KEY]: { running: false, chaptersCount, firstTitle, lastTitle, done: true } });
        break;
      }

      currentUrl = nav.nextUrl;
      await sleep(900);
    }

    if (stopped) {
      const fullText = allChunks.join("");
      await storageSet({
        [BULK_STATE_KEY]: { running: false, chaptersCount, firstTitle, lastTitle, stopped: true },
        [BULK_TEXT_KEY]: fullText
      });

      if (fullText) {
        const entry = buildHistoryEntry({
          type: "bulk", firstChapter: firstTitle, lastChapter: lastTitle,
          chaptersCount, text: fullText, novelUrl: novelBaseUrl(startUrl)
        });
        await autoSaveHistory(entry);
        broadcast({ action: "historyUpdated" });

        // Update bookmark to last successfully scraped chapter
        if (lastUrl !== startUrl) {
          const bmResult = await tryUpdateBookmark(lastUrl, lastTitle);
          broadcast({ action: "bookmarkUpdated", result: bmResult, chapterTitle: lastTitle });
        }
      }

      broadcast({ action: "bulkProgress", chaptersCount, firstTitle, lastTitle, fullText, done: true, stopped: true });
    }

  } catch (err) {
    broadcast({ action: "bulkProgress", error: err.message, chaptersCount, done: true });
    await storageSet({ [BULK_STATE_KEY]: { running: false, chaptersCount, firstTitle, lastTitle, error: err.message } });
  } finally {
    if (scrapeTabId !== null) {
      chrome.tabs.remove(scrapeTabId).catch(() => {});
      scrapeTabId = null;
    }
  }
}

// ── Message handler ───────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request.action === "startBulk") {
    runBulk(request.startUrl);
    sendResponse({ ok: true });
    return true;
  }

  if (request.action === "stopBulk") {
    stopped = true;
    if (scrapeTabId !== null) chrome.tabs.update(scrapeTabId, { url: "about:blank" }).catch(() => {});
    sendResponse({ ok: true });
    return true;
  }

  if (request.action === "getBulkState") {
    storageGet([BULK_STATE_KEY, BULK_TEXT_KEY]).then(r => {
      sendResponse({ state: r[BULK_STATE_KEY] || null, text: r[BULK_TEXT_KEY] || "" });
    });
    return true;
  }

  if (request.action === "clearBulkState") {
    storageRemove([BULK_STATE_KEY, BULK_TEXT_KEY]).then(() => sendResponse({ ok: true }));
    return true;
  }

  // ── Single chapter: auto-save history + update bookmark ───────────────────
  if (request.action === "autoSaveSingle") {
    (async () => {
      const { chapterUrl, chapterTitle, text } = request;
      const entry = buildHistoryEntry({
        type: "single", firstChapter: chapterTitle, lastChapter: chapterTitle,
        chaptersCount: 1, text, novelUrl: novelBaseUrl(chapterUrl)
      });
      await autoSaveHistory(entry);

      const bmResult = await tryUpdateBookmark(chapterUrl, chapterTitle);
      sendResponse({ ok: true, bookmarkResult: bmResult });
    })();
    return true;
  }

  // ── Get bookmark log ───────────────────────────────────────────────────────
  if (request.action === "getBookmarkLog") {
    storageGet(BOOKMARK_LOG_KEY).then(r => {
      sendResponse({ log: r[BOOKMARK_LOG_KEY] || [] });
    });
    return true;
  }

  // ── Clear bookmark log ─────────────────────────────────────────────────────
  if (request.action === "clearBookmarkLog") {
    storageRemove(BOOKMARK_LOG_KEY).then(() => sendResponse({ ok: true }));
    return true;
  }

  // ── Delete single bookmark log entry ──────────────────────────────────────
  if (request.action === "deleteBookmarkLogEntry") {
    storageGet(BOOKMARK_LOG_KEY).then(async r => {
      let log = r[BOOKMARK_LOG_KEY] || [];
      log = log.filter(e => e.id !== request.id);
      await storageSet({ [BOOKMARK_LOG_KEY]: log });
      sendResponse({ ok: true });
    });
    return true;
  }
});
