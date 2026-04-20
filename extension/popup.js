// popup.js — v5

const MAX_HISTORY = 20;

// ── DOM refs ──────────────────────────────────────────────────────────────────
const tabSingle      = document.getElementById("tabSingle");
const tabBulk        = document.getElementById("tabBulk");
const tabHistory     = document.getElementById("tabHistory");
const panelSingle    = document.getElementById("panelSingle");
const panelBulk      = document.getElementById("panelBulk");
const panelHistory   = document.getElementById("panelHistory");

const extractBtn     = document.getElementById("extractBtn");
const loader         = document.getElementById("loader");
const output         = document.getElementById("output");
const statusSingle   = document.getElementById("statusSingle");
const chapterTitle   = document.getElementById("chapterTitle");
const wordCount      = document.getElementById("wordCount");
const charCount      = document.getElementById("charCount");
const copyBtn        = document.getElementById("copyBtn");
const clearBtn       = document.getElementById("clearBtn");

const bulkStartBtn    = document.getElementById("bulkStartBtn");
const bulkStopBtn     = document.getElementById("bulkStopBtn");
const progressWrap    = document.getElementById("progressWrap");
const progressLabel   = document.getElementById("progressLabel");
const chapterCounter  = document.getElementById("chapterCounter");
const progressCurrent = document.getElementById("progressCurrent");
const bulkOutput      = document.getElementById("bulkOutput");
const statusBulk      = document.getElementById("statusBulk");
const bulkChapterTitle= document.getElementById("bulkChapterTitle");
const bulkWordCount   = document.getElementById("bulkWordCount");
const bulkCharCount   = document.getElementById("bulkCharCount");
const bulkCopyBtn     = document.getElementById("bulkCopyBtn");
const bulkClearBtn    = document.getElementById("bulkClearBtn");
const bgIndicator     = document.getElementById("bgIndicator");
const bgIndicatorText = document.getElementById("bgIndicatorText");

const histCountBadge  = document.getElementById("histCountBadge");
const histClearAll    = document.getElementById("histClearAll");
const extractsList    = document.getElementById("extractsList");
const bookmarksList   = document.getElementById("bookmarksList");
const statusHistory   = document.getElementById("statusHistory");
const subTabExtracts  = document.getElementById("subTabExtracts");
const subTabBookmarks = document.getElementById("subTabBookmarks");

// ── State ─────────────────────────────────────────────────────────────────────
let singleText        = "";
let singleUrl         = "";
let bulkText          = "";
let bulkRunning       = false;
let bulkFirstTitle    = "";
let bulkLastTitle     = "";
let bulkChaptersCount = 0;
let activeHistSub     = "extracts"; // "extracts" | "bookmarks"

// ── Utils ─────────────────────────────────────────────────────────────────────
function showStatus(el, msg, type = "info", persist = false) {
  el.textContent = msg;
  el.className = "status " + type;
  el.style.display = "block";
  if (!persist) setTimeout(() => { el.style.display = "none"; }, 4000);
}

function calcStats(text) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return { words, chars: text.length };
}

function fmtTimestamp(ts) {
  const d = new Date(ts), pad = n => String(n).padStart(2, "0");
  const mo = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d.getDate()} ${mo[d.getMonth()]} ${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function timeAgo(ts) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function esc(s) {
  return (s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function trunc(s, n) { return s && s.length > n ? s.slice(0, n) + "…" : (s || "—"); }

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function ensureContentScript(tabId) {
  await chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] }).catch(() => {});
  await new Promise(r => setTimeout(r, 300));
}

// ── Storage helpers (popup-side reads only) ───────────────────────────────────
async function loadExtracts() {
  return new Promise(r => chrome.storage.local.get("novelbin_history", d => r(d.novelbin_history || [])));
}

// ── Top-level tab switching ────────────────────────────────────────────────────
function switchTab(at, ap) {
  [tabSingle, tabBulk, tabHistory].forEach(t => t.classList.remove("active"));
  [panelSingle, panelBulk, panelHistory].forEach(p => p.classList.remove("active"));
  at.classList.add("active");
  ap.classList.add("active");
}

tabSingle.addEventListener("click",  () => switchTab(tabSingle, panelSingle));
tabBulk.addEventListener("click",    () => { switchTab(tabBulk, panelBulk); reconnectBulkUI(); });
tabHistory.addEventListener("click", () => { switchTab(tabHistory, panelHistory); renderHistory(); });

// ── History sub-tabs ──────────────────────────────────────────────────────────
subTabExtracts.addEventListener("click", () => {
  activeHistSub = "extracts";
  subTabExtracts.classList.add("active");
  subTabBookmarks.classList.remove("active");
  extractsList.style.display  = "";
  bookmarksList.style.display = "none";
  renderExtracts();
});

subTabBookmarks.addEventListener("click", () => {
  activeHistSub = "bookmarks";
  subTabBookmarks.classList.add("active");
  subTabExtracts.classList.remove("active");
  bookmarksList.style.display = "";
  extractsList.style.display  = "none";
  renderBookmarkLog();
});

// ── RENDER: Extracts list ─────────────────────────────────────────────────────
async function renderExtracts() {
  const history = await loadExtracts();
  histCountBadge.textContent = history.length;

  if (history.length === 0) {
    extractsList.innerHTML = `<div class="hist-empty"><div class="icon">📭</div><div class="msg">No extracts yet.<br>Extract a chapter to auto-save here.</div></div>`;
    return;
  }

  extractsList.innerHTML = history.map(e => {
    const isBulk = e.type === "bulk";
    const typeClass = isBulk ? "bulk" : "single";
    const rangeText = isBulk && e.chaptersCount > 1 ? `${e.chaptersCount} chapters` : "1 chapter";
    const rangeDisplay = isBulk && e.firstChapter !== e.lastChapter
      ? `${trunc(e.firstChapter, 24)} → ${trunc(e.lastChapter, 24)}`
      : trunc(e.firstChapter, 48);

    return `
    <div class="hc" data-id="${e.id}">
      <div class="hc-top">
        <div class="hc-title">${esc(rangeDisplay)}</div>
        <div class="hc-ts" title="${fmtTimestamp(e.timestamp)}">${timeAgo(e.timestamp)}</div>
      </div>
      <div class="hc-meta">
        <span class="hc-badge ${typeClass}">${isBulk ? "BULK" : "SINGLE"}</span>
        <span class="hc-badge auto">AUTO-SAVED</span>
        <span class="hc-badge range">📑 ${rangeText}</span>
        <span class="hc-badge words">✏ ${e.words.toLocaleString()} words</span>
      </div>
      <div class="hc-actions">
        <button class="hc-btn load"   data-id="${e.id}">📂 Load</button>
        <button class="hc-btn recopy" data-id="${e.id}">📋 Copy</button>
        <button class="hc-btn del"    data-id="${e.id}">🗑 Delete</button>
      </div>
    </div>`;
  }).join("");
}

extractsList.addEventListener("click", async (e) => {
  const btn = e.target.closest(".hc-btn");
  if (!btn) return;
  const id = btn.dataset.id;
  const history = await loadExtracts();
  const entry = history.find(h => h.id === id);
  if (!entry) return;

  if (btn.classList.contains("load")) {
    singleText = entry.text;
    output.value = entry.text;
    chapterTitle.textContent = entry.firstChapter || "";
    const s = calcStats(entry.text);
    wordCount.textContent = s.words.toLocaleString() + " words";
    charCount.textContent = s.chars.toLocaleString() + " chars";
    copyBtn.disabled = false;
    clearBtn.disabled = false;
    switchTab(tabSingle, panelSingle);
    showStatus(statusSingle, `✓ Loaded: ${trunc(entry.firstChapter, 40)}`, "info");
  }

  if (btn.classList.contains("recopy")) {
    try {
      await navigator.clipboard.writeText(entry.text);
      showStatus(statusHistory, "✓ Copied to clipboard!", "success");
      btn.textContent = "✓ Done";
      setTimeout(() => { btn.textContent = "📋 Copy"; }, 2000);
    } catch { showStatus(statusHistory, "✗ Clipboard failed.", "error"); }
  }

  if (btn.classList.contains("del")) {
    const updated = history.filter(h => h.id !== id);
    await new Promise(r => chrome.storage.local.set({ novelbin_history: updated }, r));
    renderExtracts();
    showStatus(statusHistory, "✓ Deleted.", "info");
  }
});

// ── RENDER: Bookmark log ──────────────────────────────────────────────────────
async function renderBookmarkLog() {
  const { log } = await new Promise(r => chrome.runtime.sendMessage({ action: "getBookmarkLog" }, r));
  histCountBadge.textContent = log.length;

  if (log.length === 0) {
    bookmarksList.innerHTML = `<div class="hist-empty"><div class="icon">🔖</div><div class="msg">No bookmark updates yet.<br>Bookmarks update automatically after<br>each extraction.</div></div>`;
    return;
  }

  bookmarksList.innerHTML = log.map(e => `
    <div class="hc bm-card" data-id="${e.id}">
      <div class="hc-top">
        <div class="hc-title">${esc(trunc(e.chapterTitle || e.newTitle, 46))}</div>
        <div class="hc-ts" title="${fmtTimestamp(e.timestamp)}">${timeAgo(e.timestamp)}</div>
      </div>
      <div class="hc-meta">
        <span class="hc-badge bm">🔖 BOOKMARK</span>
        <span class="hc-badge auto">AUTO-UPDATED</span>
      </div>
      <div class="bm-detail">
        <span style="color:var(--muted)">Was:</span> ${esc(trunc(e.oldTitle, 36))}<br>
        <span style="color:var(--muted)">Now:</span> <span style="color:var(--bookmark)">${esc(trunc(e.newTitle, 36))}</span>
      </div>
      <div class="hc-actions">
        <button class="hc-btn del" data-id="${e.id}">🗑 Delete</button>
      </div>
    </div>`
  ).join("");
}

bookmarksList.addEventListener("click", async (e) => {
  const btn = e.target.closest(".hc-btn.del");
  if (!btn) return;
  await new Promise(r => chrome.runtime.sendMessage({ action: "deleteBookmarkLogEntry", id: btn.dataset.id }, r));
  renderBookmarkLog();
  showStatus(statusHistory, "✓ Log entry deleted.", "info");
});

// ── RENDER: combined count for header badge ───────────────────────────────────
async function renderHistory() {
  if (activeHistSub === "extracts") {
    extractsList.style.display  = "";
    bookmarksList.style.display = "none";
    await renderExtracts();
  } else {
    bookmarksList.style.display = "";
    extractsList.style.display  = "none";
    await renderBookmarkLog();
  }
}

// Clear all (both) or just active sub-tab
histClearAll.addEventListener("click", async () => {
  if (activeHistSub === "extracts") {
    if (!confirm("Clear all extract history?")) return;
    await new Promise(r => chrome.storage.local.set({ novelbin_history: [] }, r));
    renderExtracts();
  } else {
    if (!confirm("Clear all bookmark update logs?")) return;
    await new Promise(r => chrome.runtime.sendMessage({ action: "clearBookmarkLog" }, r));
    renderBookmarkLog();
  }
  showStatus(statusHistory, "✓ Cleared.", "warn");
});

// ── SINGLE extract ────────────────────────────────────────────────────────────
extractBtn.addEventListener("click", async () => {
  statusSingle.style.display = "none";
  loader.style.display = "flex";
  extractBtn.disabled = true;

  try {
    const tab = await getActiveTab();
    if (!tab.url || !tab.url.includes("novelbin.com")) {
      loader.style.display = "none";
      extractBtn.disabled = false;
      showStatus(statusSingle, "⚠ Navigate to a NovelBin chapter page first.", "error", true);
      return;
    }

    await ensureContentScript(tab.id);

    const resp = await new Promise(r =>
      chrome.tabs.sendMessage(tab.id, { action: "extractChapter" }, res => r(res || { error: "No response." }))
    );

    loader.style.display = "none";
    extractBtn.disabled  = false;

    if (resp.error) { showStatus(statusSingle, "✗ " + resp.error, "error", true); return; }

    singleText = resp.content;
    singleUrl  = tab.url;
    output.value = resp.content;
    chapterTitle.textContent = resp.title || "";
    const s = calcStats(resp.content);
    wordCount.textContent = s.words.toLocaleString() + " words";
    charCount.textContent = s.chars.toLocaleString() + " chars";
    copyBtn.disabled  = false;
    clearBtn.disabled = false;

    // ── Auto-save history + update bookmark ──────────────────────────────────
    const saveResp = await new Promise(r =>
      chrome.runtime.sendMessage({
        action: "autoSaveSingle",
        chapterUrl: tab.url,
        chapterTitle: resp.title,
        text: resp.content
      }, r)
    );

    let statusMsg = "✓ Extracted & saved to history!";
    if (saveResp?.bookmarkResult?.updated) {
      statusMsg += ` 🔖 Bookmark updated (${saveResp.bookmarkResult.count}).`;
    }
    showStatus(statusSingle, statusMsg, "success");

  } catch (err) {
    loader.style.display = "none";
    extractBtn.disabled = false;
    showStatus(statusSingle, "✗ " + (err.message || "Unknown error."), "error", true);
  }
});

copyBtn.addEventListener("click", async () => {
  if (!singleText) return;
  try {
    await navigator.clipboard.writeText(singleText);
    showStatus(statusSingle, "✓ Copied to clipboard!", "success");
    copyBtn.textContent = "✓ Copied!";
    setTimeout(() => { copyBtn.textContent = "📋 Copy"; }, 2000);
  } catch { output.select(); document.execCommand("copy"); }
});

clearBtn.addEventListener("click", () => {
  singleText = ""; singleUrl = "";
  output.value = "";
  chapterTitle.textContent = "";
  wordCount.textContent = "0 words";
  charCount.textContent = "0 chars";
  copyBtn.disabled = clearBtn.disabled = true;
  statusSingle.style.display = "none";
});

// ── BULK ──────────────────────────────────────────────────────────────────────
function setBulkUI(running) {
  bulkRunning = running;
  bulkStartBtn.disabled = running;
  bulkStopBtn.disabled  = !running;
  if (running) {
    progressWrap.classList.add("show");
    progressLabel.textContent = "SCRAPING...";
    bgIndicator.style.display = "flex";
  } else {
    progressWrap.classList.remove("show");
    bgIndicator.style.display = "none";
  }
}

function applyBulkProgress({ chaptersCount, currentTitle, firstTitle, lastTitle, fullText }) {
  if (chaptersCount !== undefined) {
    bulkChaptersCount = chaptersCount;
    chapterCounter.textContent = chaptersCount + " chapter" + (chaptersCount === 1 ? "" : "s");
  }
  if (currentTitle) {
    progressCurrent.textContent = currentTitle;
    bulkChapterTitle.textContent = currentTitle;
  }
  if (firstTitle) bulkFirstTitle = firstTitle;
  if (lastTitle)  bulkLastTitle  = lastTitle;
  if (fullText) {
    bulkText = fullText;
    bulkOutput.value = fullText;
    const s = calcStats(fullText);
    bulkWordCount.textContent = s.words.toLocaleString() + " words";
    bulkCharCount.textContent = s.chars.toLocaleString() + " chars";
    bulkCopyBtn.disabled  = false;
    bulkClearBtn.disabled = false;
  }
  bgIndicatorText.textContent = `${bulkChaptersCount || 0} chapter${bulkChaptersCount === 1 ? "" : "s"} scraped`;
}

async function reconnectBulkUI() {
  const { state, text } = await new Promise(r => chrome.runtime.sendMessage({ action: "getBulkState" }, r));
  if (!state) return;

  if (state.running) {
    setBulkUI(true);
    applyBulkProgress({ chaptersCount: state.chaptersCount, firstTitle: state.firstTitle, lastTitle: state.lastTitle, currentTitle: state.lastTitle, fullText: text || "" });
    showStatus(statusBulk, `↺ Reconnected — ${state.chaptersCount} chapters scraped so far`, "info", true);

  } else if (state.done || state.stopped) {
    if (text) applyBulkProgress({ chaptersCount: state.chaptersCount, firstTitle: state.firstTitle, lastTitle: state.lastTitle, fullText: text });
    bulkChapterTitle.textContent = (state.stopped ? "Stopped" : "Done") + ` — ${state.chaptersCount} chapters`;
    showStatus(statusBulk,
      `${state.stopped ? "⏹ Stopped" : "✓ Completed"} while away — ${state.chaptersCount} chapters ready. History auto-saved.`,
      state.stopped ? "warn" : "success", true
    );
    chrome.runtime.sendMessage({ action: "clearBulkState" });
  }
}

bulkStartBtn.addEventListener("click", async () => {
  if (bulkRunning) return;
  const tab = await getActiveTab();
  if (!tab.url || !tab.url.includes("novelbin.com")) {
    showStatus(statusBulk, "⚠ Navigate to a NovelBin chapter page first.", "error", true);
    return;
  }
  bulkText = ""; bulkFirstTitle = ""; bulkLastTitle = ""; bulkChaptersCount = 0;
  bulkOutput.value = "";
  bulkWordCount.textContent = "0 words";
  bulkCharCount.textContent = "0 chars";
  bulkCopyBtn.disabled = bulkClearBtn.disabled = true;
  statusBulk.style.display = "none";
  bulkChapterTitle.textContent = "Starting…";
  progressCurrent.textContent  = "Opening background tab…";
  bgIndicatorText.textContent  = "0 chapters scraped";

  setBulkUI(true);
  showStatus(statusBulk, "🚀 Scraping in background tab — switch tabs freely!", "warn", true);
  chrome.runtime.sendMessage({ action: "startBulk", startUrl: tab.url });
});

bulkStopBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "stopBulk" });
  setBulkUI(false);
  progressLabel.textContent = "STOPPING…";
  showStatus(statusBulk, "⏹ Stopping after current chapter. History will auto-save.", "warn", true);
});

// Bulk progress messages from background
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "bulkProgress") {
    applyBulkProgress(msg);
    if (msg.error) showStatus(statusBulk, "✗ " + msg.error, "error", true);
    if (msg.done) {
      setBulkUI(false);
      bulkChapterTitle.textContent = (msg.stopped ? "Stopped" : "Done") + ` — ${bulkChaptersCount} chapters`;
      let statusMsg = `${msg.stopped ? "⏹ Stopped" : "✓ Done"} — ${bulkChaptersCount} chapters. History auto-saved!`;
      showStatus(statusBulk, statusMsg, msg.stopped ? "warn" : "success", true);
      chrome.runtime.sendMessage({ action: "clearBulkState" });
    }
  }
  // Bookmark update notification
  if (msg.action === "bookmarkUpdated" && msg.result?.updated) {
    showStatus(statusBulk,
      `🔖 Bookmark updated to: ${trunc(msg.chapterTitle, 35)}`,
      "info"
    );
  }
  // Refresh history if open
  if (msg.action === "historyUpdated" && panelHistory.classList.contains("active")) {
    renderHistory();
  }
});

bulkCopyBtn.addEventListener("click", async () => {
  if (!bulkText) return;
  try {
    await navigator.clipboard.writeText(bulkText);
    showStatus(statusBulk, "✓ Copied to clipboard!", "success");
    bulkCopyBtn.textContent = "✓ Copied!";
    setTimeout(() => { bulkCopyBtn.textContent = "📋 Copy"; }, 2000);
  } catch { bulkOutput.select(); document.execCommand("copy"); }
});

bulkClearBtn.addEventListener("click", () => {
  bulkText = ""; bulkFirstTitle = ""; bulkLastTitle = ""; bulkChaptersCount = 0;
  bulkOutput.value = "";
  bulkChapterTitle.textContent = "Ready to start";
  bulkWordCount.textContent = "0 words";
  bulkCharCount.textContent = "0 chars";
  bulkCopyBtn.disabled = bulkClearBtn.disabled = true;
  statusBulk.style.display = "none";
  chrome.runtime.sendMessage({ action: "clearBulkState" });
});

// ── On popup open ─────────────────────────────────────────────────────────────
(async () => {
  const { state } = await new Promise(r => chrome.runtime.sendMessage({ action: "getBulkState" }, r));
  if (state && state.running) {
    switchTab(tabBulk, panelBulk);
    await reconnectBulkUI();
  }
})();
