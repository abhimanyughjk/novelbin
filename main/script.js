'use strict';

const HISTORY_KEY   = 'nb_history';
const BOOKMARK_LOG  = 'nb_bm_log';
const MAX_HISTORY   = 30;
const MAX_BM_LOG    = 50;
const PRINT_CFG_KEY = 'nb_print_cfg';

function storageGet(key, def) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; } }
function storageSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

/* ── DOM refs ── */
const urlInput          = document.getElementById('urlInput');
const urlGoBtn          = document.getElementById('urlGoBtn');
const tabSingle         = document.getElementById('tabSingle');
const tabBulk           = document.getElementById('tabBulk');
const tabUrlExtractor   = document.getElementById('tabUrlExtractor');
const tabHistory        = document.getElementById('tabHistory');
const tabPrint          = document.getElementById('tabPrint');
const panelSingle       = document.getElementById('panelSingle');
const panelBulk         = document.getElementById('panelBulk');
const panelUrlExtractor = document.getElementById('panelUrlExtractor');
const panelHistory      = document.getElementById('panelHistory');
const panelPrint        = document.getElementById('panelPrint');
const extractBtn        = document.getElementById('extractBtn');
const loaderSingle      = document.getElementById('loaderSingle');
const output            = document.getElementById('output');
const statusSingle      = document.getElementById('statusSingle');
const chapterTitle      = document.getElementById('chapterTitle');
const wordCount         = document.getElementById('wordCount');
const charCount         = document.getElementById('charCount');
const copyBtn           = document.getElementById('copyBtn');
const printBtn          = document.getElementById('printBtn');
const clearBtn          = document.getElementById('clearBtn');
const bulkStartBtn      = document.getElementById('bulkStartBtn');
const bulkStopBtn       = document.getElementById('bulkStopBtn');
const progressWrap      = document.getElementById('progressWrap');
const progressLabel     = document.getElementById('progressLabel');
const chapterCounter    = document.getElementById('chapterCounter');
const progressCurrent   = document.getElementById('progressCurrent');
const progressBarFill   = document.getElementById('progressBarFill');
const bulkOutput        = document.getElementById('bulkOutput');
const statusBulk        = document.getElementById('statusBulk');
const bulkChapterTitle  = document.getElementById('bulkChapterTitle');
const bulkWordCount     = document.getElementById('bulkWordCount');
const bulkCharCount     = document.getElementById('bulkCharCount');
const bulkCopyBtn       = document.getElementById('bulkCopyBtn');
const bulkPrintBtn      = document.getElementById('bulkPrintBtn');
const bulkClearBtn      = document.getElementById('bulkClearBtn');
const canvasIndicator   = document.getElementById('canvasIndicator');
const canvasIndicatorText= document.getElementById('canvasIndicatorText');
const histCountBadge    = document.getElementById('histCountBadge');
const histClearAll      = document.getElementById('histClearAll');
const extractsList      = document.getElementById('extractsList');
const bookmarksList     = document.getElementById('bookmarksList');
const statusHistory     = document.getElementById('statusHistory');
const subTabExtracts    = document.getElementById('subTabExtracts');
const subTabBookmarks   = document.getElementById('subTabBookmarks');
const subTabLog         = document.getElementById('subTabLog');
const sessionLogList    = document.getElementById('sessionLogList');
const printSourceInfo   = document.getElementById('printSourceInfo');
const printPreview      = document.getElementById('printPreview');
const fontSizeSlider    = document.getElementById('fontSizeSlider');
const fontSizeVal       = document.getElementById('fontSizeVal');
const lineHeightSlider  = document.getElementById('lineHeightSlider');
const lineHeightVal     = document.getElementById('lineHeightVal');
const fontFamilySelect  = document.getElementById('fontFamilySelect');
const pageBreakSelect   = document.getElementById('pageBreakSelect');
const twoColToggle      = document.getElementById('twoColToggle');
const titlesToggle      = document.getElementById('titlesToggle');
const dividersToggle    = document.getElementById('dividersToggle');
const doPrintBtn        = document.getElementById('doPrintBtn');
const statusPrint       = document.getElementById('statusPrint');
const footerText        = document.getElementById('footerText');
const modeContinuous    = document.getElementById('modeContinuous');
const modeCustomUrls    = document.getElementById('modeCustomUrls');
const urlListPanel      = document.getElementById('urlListPanel');
const urlListInput      = document.getElementById('urlListInput');
const urlListMeta       = document.getElementById('urlListMeta');
const validateUrlsBtn   = document.getElementById('validateUrlsBtn');
const clearUrlListBtn   = document.getElementById('clearUrlListBtn');
const urlListValidated  = document.getElementById('urlListValidated');

/* BUE refs */
const novelPageInput    = document.getElementById('novelPageInput');
const bueFetchBtn       = document.getElementById('bueFetchBtn');
const bueLoader         = document.getElementById('bueLoader');
const statusBue         = document.getElementById('statusBue');
const bueResults        = document.getElementById('bueResults');
const bueNovelTitle     = document.getElementById('bueNovelTitle');
const bueTotalBadge     = document.getElementById('bueTotalBadge');
const bueNovelBadge     = document.getElementById('bueNovelBadge');
const bueOrderSeg       = document.getElementById('bueOrderSeg');
const bueRangeFrom      = document.getElementById('bueRangeFrom');
const bueRangeTo        = document.getElementById('bueRangeTo');
const bueRangeApply     = document.getElementById('bueRangeApply');
const bueChapterList    = document.getElementById('bueChapterList');
const bueShownCount     = document.getElementById('bueShownCount');
const bueTotalCount     = document.getElementById('bueTotalCount');
const bueSelectedCount  = document.getElementById('bueSelectedCount');
const bueSelAll         = document.getElementById('bueSelAll');
const bueSelNone        = document.getElementById('bueSelNone');
const bueSelInvert      = document.getElementById('bueSelInvert');
const bueSendBtn        = document.getElementById('bueSendBtn');
const bueCopyUrlsBtn    = document.getElementById('bueCopyUrlsBtn');
const bueResetBtn       = document.getElementById('bueResetBtn');
const bueSentConfirm    = document.getElementById('bueSentConfirm');

/* ── STATE ── */
let singleText = '', singleTitle = '', singleUrl = '';
let bulkText = '', bulkRunning = false, bulkStopped = false;
let bulkChunks = [], bulkFirstTitle = '', bulkLastTitle = '', bulkCount = 0, bulkStartUrl = '';
let activeHistSub = 'extracts';

/* ── TIMING ENGINE ── */
const statElapsed = document.getElementById('statElapsed');
const statSpeed   = document.getElementById('statSpeed');
const statEta     = document.getElementById('statEta');
const statPct     = document.getElementById('statPct');

let _timerInterval = null;
let _timerStart    = 0;
let _timerTotal    = 0;   // 0 = unknown (continuous mode)
let _chapterTimes  = [];  // timestamps of each completed chapter (for rolling avg)

function fmtDur(sec) {
  sec = Math.max(0, Math.round(sec));
  if (sec < 60)  return sec + 's';
  if (sec < 3600) return Math.floor(sec/60) + 'm ' + (sec%60) + 's';
  const h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60);
  return h + 'h ' + m + 'm';
}

function startBulkTimer(totalChapters) {
  clearInterval(_timerInterval);
  _timerStart   = Date.now();
  _timerTotal   = totalChapters || 0;
  _chapterTimes = [];
  statEta.style.display = _timerTotal > 0 ? 'inline-block' : 'none';
  statPct.style.display = _timerTotal > 0 ? 'inline-block' : 'none';
  statElapsed.textContent = '⏱ 0s';
  statSpeed.textContent   = '⚡ —';
  statEta.textContent     = '🕐 ETA —';
  statPct.textContent     = '0%';
  _timerInterval = setInterval(_tickTimer, 1000);
}

function stopBulkTimer() {
  clearInterval(_timerInterval);
  _timerInterval = null;
  // freeze elapsed display
  const elapsed = (Date.now() - _timerStart) / 1000;
  statElapsed.textContent = '⏱ ' + fmtDur(elapsed);
  statEta.textContent     = '🕐 Done';
}

function recordChapterDone(doneCount) {
  _chapterTimes.push(Date.now());
  if (_chapterTimes.length > 10) _chapterTimes.shift(); // rolling window of last 10
  _tickTimer(doneCount);
}

function _tickTimer(doneCountHint) {
  const elapsed = (Date.now() - _timerStart) / 1000;
  statElapsed.textContent = '⏱ ' + fmtDur(elapsed);

  // Speed: rolling avg over last 10 chapters
  let speedTxt = '⚡ —';
  if (_chapterTimes.length >= 2) {
    const window = (_chapterTimes[_chapterTimes.length-1] - _chapterTimes[0]) / 1000;
    const rate   = window / (_chapterTimes.length - 1); // sec per chapter
    speedTxt = '⚡ ' + rate.toFixed(1) + 's/ch';
  } else if (_chapterTimes.length === 1 && elapsed > 0) {
    const done = doneCountHint || bulkCount;
    if (done > 0) speedTxt = '⚡ ' + (elapsed / done).toFixed(1) + 's/ch';
  }
  statSpeed.textContent = speedTxt;

  // ETA + % — only meaningful in custom/known-total mode
  if (_timerTotal > 0) {
    const done = doneCountHint || bulkCount;
    const pct  = Math.min(100, Math.round((done / _timerTotal) * 100));
    statPct.textContent = pct + '%';
    if (done > 0 && elapsed > 0) {
      const secPerCh = _chapterTimes.length >= 2
        ? (_chapterTimes[_chapterTimes.length-1] - _chapterTimes[0]) / 1000 / (_chapterTimes.length - 1)
        : elapsed / done;
      const remaining = (_timerTotal - done) * secPerCh;
      statEta.textContent = '🕐 ' + fmtDur(remaining) + ' left';
    } else {
      statEta.textContent = '🕐 ETA …';
    }
  }
}

/* ── SESSION LOG (sessionStorage, cleared on reload) ── */
const SESSION_LOG_KEY = 'nb_session_log';
function logEntry(msg, type = 'info') {
  const now = new Date();
  const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  let log = [];
  try { log = JSON.parse(sessionStorage.getItem(SESSION_LOG_KEY) || '[]'); } catch {}
  log.unshift({ time, msg: msg.replace(/^[✓✗⚠🖨📋🔖]\s*/, ''), type });
  if (log.length > 200) log = log.slice(0, 200);
  try { sessionStorage.setItem(SESSION_LOG_KEY, JSON.stringify(log)); } catch {}
  if (activeHistSub === 'log') renderSessionLog();
}
function renderSessionLog() {
  let log = [];
  try { log = JSON.parse(sessionStorage.getItem(SESSION_LOG_KEY) || '[]'); } catch {}
  histCountBadge.textContent = log.length;
  if (!log.length) { sessionLogList.innerHTML = '<div class="log-empty">No activity this session yet.</div>'; return; }
  sessionLogList.innerHTML = log.map(e => `
    <div class="log-entry ${e.type}">
      <span class="log-time">${e.time}</span>
      <span class="log-badge ${e.type}">${e.type}</span>
      <span class="log-msg">${esc(e.msg)}</span>
    </div>`).join('');
}
let printData = null;
let bulkMode = 'continuous';
let customUrlList = [];

/* BUE state */
let bueAllChapters   = []; // { title, url } master list (asc from page)
let bueFiltered      = []; // currently displayed (after order + range)
let bueSelected      = new Set(); // selected indices into bueFiltered
let bueOrder         = 'asc';
let bueRangeActive   = { from: 1, to: Infinity };

/* ── UTILS ── */
function showStatus(el, msg, type = 'info', persist = false) {
  el.textContent = msg; el.className = 'status ' + type; el.style.display = 'block';
  if (!persist) setTimeout(() => { el.style.display = 'none'; }, 4500);
  logEntry(msg, type);
  // Auto-log into active task if one is running
  if (window._taskLog && (type === 'success' || type === 'error')) {
    try { window._taskLog(msg.replace(/^[✓✗⚠🖨📋🔖⚡]\s*/, '')); } catch {}
  }
}
function calcStats(text) { const w = text.trim() ? text.trim().split(/\s+/).length : 0; return { words: w, chars: text.length }; }
function fmtTimestamp(ts) { const d = new Date(ts), p = n => String(n).padStart(2,'0'), mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; return `${d.getDate()} ${mo[d.getMonth()]} ${d.getFullYear()} · ${p(d.getHours())}:${p(d.getMinutes())}`; }
function timeAgo(ts) { const m = Math.floor((Date.now()-ts)/60000); if (m<1) return 'just now'; if (m<60) return m+'m ago'; const h=Math.floor(m/60); if (h<24) return h+'h ago'; return Math.floor(h/24)+'d ago'; }
function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function trunc(s, n) { return s && s.length>n ? s.slice(0,n)+'…' : (s||'—'); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/* ── RETRY HELPER ──
   Retries an async fn up to maxAttempts times with exponential backoff.
   onRetry(attempt, maxAttempts, err) is called before each retry so the UI
   can show progress.  Returns the resolved value or throws on final failure. */
async function withRetry(fn, { maxAttempts = 4, baseDelay = 1200, onRetry } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === maxAttempts) break;
      const delay = baseDelay * Math.pow(1.8, attempt - 1); // 1.2s, 2.16s, 3.9s
      if (onRetry) onRetry(attempt, maxAttempts, err, delay);
      await sleep(delay);
    }
  }
  throw lastErr;
}
function novelBaseUrl(url) { try { return toNovelPageUrl(url); } catch { return null; } }

/* ── SUPPORTED SOURCE DOMAINS ──
   NovelArrow.com is the rebrand of NovelBin.com, but it uses a DIFFERENT
   URL scheme, not just a different domain:
     novelbin.com   novel page: /b/<slug>          chapter: /b/<slug>/<chapter>
     novelarrow.com novel page: /novel/<slug>       chapter: /chapter/<slug>/<chapter>
   (novelbin.com chapter links now 301-redirect to the equivalent
   novelarrow.com /chapter/... URL.)
   Everywhere a chapter link or novel page is identified, both schemes
   are accepted side-by-side. */
const ALLOWED_DOMAINS = ['novelbin.com', 'novelarrow.com'];
function isAllowedUrl(url) { return !!url && ALLOWED_DOMAINS.some(d => url.includes(d)); }
function originOf(url, fallback = 'https://novelbin.com') { try { return new URL(url).origin; } catch { return fallback; } }

// Matches a chapter link in either scheme: /b/<slug>/<chapter-slug> or /chapter/<slug>/<chapter-slug>
const CHAPTER_HREF_RE = /\/(?:b|chapter)\/[^/?#]+\/[^/?#]+/;

// Given ANY novel or chapter URL on either site, return the canonical novel page URL.
function toNovelPageUrl(rawUrl) {
  let baseUrl = rawUrl.trim().replace(/#.*$/, '');
  if (!baseUrl.startsWith('http')) baseUrl = 'https://' + baseUrl;
  try {
    const u    = new URL(baseUrl);
    const segs = u.pathname.split('/').filter(Boolean); // e.g. ['b','slug',...] or ['chapter','slug',...]
    if (segs.length >= 2) {
      const slug = segs[1];
      // novelarrow.com chapter pages live under /chapter/, but the novel
      // page itself is under /novel/ — remap; everything else (novelbin's
      // /b/, novelarrow's own /novel/) already uses the same segment for
      // both the novel page and its chapters, so keep it as-is.
      const novelSeg = segs[0] === 'chapter' ? 'novel' : segs[0];
      u.pathname = '/' + novelSeg + '/' + slug;
      u.search   = '';
      baseUrl    = u.origin + u.pathname;
    }
  } catch { /* leave baseUrl as-is */ }
  return baseUrl;
}

/* ── TAB SWITCHING ── */
const allTabs   = [tabSingle, tabBulk, tabUrlExtractor, tabHistory, tabPrint];
const allPanels = [panelSingle, panelBulk, panelUrlExtractor, panelHistory, panelPrint];
function switchTab(tab, panel) {
  allTabs.forEach(t => t.classList.remove('active'));
  allPanels.forEach(p => p.classList.remove('active'));
  tab.classList.add('active'); panel.classList.add('active');
}
tabSingle.addEventListener('click',        () => switchTab(tabSingle, panelSingle));
tabBulk.addEventListener('click',          () => switchTab(tabBulk, panelBulk));
tabUrlExtractor.addEventListener('click',  () => switchTab(tabUrlExtractor, panelUrlExtractor));
tabHistory.addEventListener('click',       () => { switchTab(tabHistory, panelHistory); renderHistory(); });
tabPrint.addEventListener('click',         () => { switchTab(tabPrint, panelPrint); syncPrintPanel(); });

/* ── URL BAR ── */
urlGoBtn.addEventListener('click', loadUrl);
urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') loadUrl(); });
function loadUrl() {
  let url = urlInput.value.trim();
  if (!url) return;
  if (!url.startsWith('http')) { url = 'https://' + url; urlInput.value = url; }
  if (!isAllowedUrl(url)) { showStatus(statusSingle, '⚠ Must be a novelbin.com or novelarrow.com URL.', 'error', true); switchTab(tabSingle, panelSingle); return; }
  footerText.textContent = `Loaded: ${trunc(url, 55)}`;
  switchTab(tabSingle, panelSingle);
  showStatus(statusSingle, '✓ URL set — click Extract to scrape this chapter.', 'info', true);
}

/* ── BULK MODE SWITCHER ── */
modeContinuous.addEventListener('click', () => {
  bulkMode = 'continuous';
  modeContinuous.classList.add('active'); modeCustomUrls.classList.remove('active');
  urlListPanel.classList.remove('visible');
});
modeCustomUrls.addEventListener('click', () => {
  bulkMode = 'custom';
  modeCustomUrls.classList.add('active'); modeContinuous.classList.remove('active');
  urlListPanel.classList.add('visible');
});

/* ── CUSTOM URL LIST ── */
function parseUrlList(raw) {
  return raw.split('\n').map(l => l.trim()).filter(l => l.length > 0).filter((v, i, a) => a.indexOf(v) === i);
}
urlListInput.addEventListener('input', () => {
  const urls = parseUrlList(urlListInput.value);
  urlListMeta.textContent = urls.length + ' URL' + (urls.length === 1 ? '' : 's');
  urlListValidated.classList.remove('visible');
});
validateUrlsBtn.addEventListener('click', () => {
  const urls = parseUrlList(urlListInput.value);
  if (urls.length === 0) { urlListValidated.innerHTML = '<div style="font-family:var(--mono);font-size:10px;color:var(--muted);">No URLs to validate.</div>'; urlListValidated.classList.add('visible'); return; }
  const valid = [], invalid = [];
  const html = urls.map((url, i) => {
    const ok = isAllowedUrl(url);
    if (ok) valid.push(url); else invalid.push(url);
    return `<div class="url-validated-item"><span class="url-validated-num">#${i+1}</span><span class="url-validated-url ${ok?'':'url-validated-bad'}">${ok?'✓':'✗'} ${esc(trunc(url,55))}</span></div>`;
  }).join('');
  urlListValidated.innerHTML = html; urlListValidated.classList.add('visible');
  customUrlList = valid; urlListMeta.textContent = `${valid.length} valid, ${invalid.length} invalid`;
});
clearUrlListBtn.addEventListener('click', () => {
  urlListInput.value = ''; urlListMeta.textContent = '0 URLs'; urlListValidated.classList.remove('visible'); customUrlList = [];
});

/* ── FETCH + EXTRACT ── */
const CORS_PROXIES = [
  u => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  u => `https://thingproxy.freeboard.io/fetch/${u}`,
  u => `https://cors-anywhere.herokuapp.com/${u}`,
  u => `https://proxy.cors.sh/${u}`,
  u => `https://gobetween.oklabs.org/${u}`,
  u => `https://test.cors.workers.dev/?${encodeURIComponent(u)}`,
  u => `https://crossorigin.me/${u}`,
  u => `https://cors-proxy.htmldriven.com/?url=${encodeURIComponent(u)}`,
  u => `https://yacdn.org/serve/${u}`,
];

// Hard timeout wrapper — prevents a hanging proxy from stalling an entire batch
async function fetchWithTimeout(input, opts = {}, ms = 14000) {
  const ctrl = new AbortController();
  // If the caller already supplied a signal, chain it
  const parentSignal = opts.signal;
  if (parentSignal) {
    if (parentSignal.aborted) { ctrl.abort(); }
    else { parentSignal.addEventListener('abort', () => ctrl.abort(), { once: true }); }
  }
  const tid = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(input, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(tid);
  }
}

/**
 * Race multiple async producers in parallel.
 * Returns the result of the first one that resolves with a truthy value.
 * All losers are cancelled via their AbortSignal passed to each factory.
 * If all fail/reject, throws the last error.
 * factories: Array<(signal: AbortSignal) => Promise<T>>
 */
async function raceFirst(factories) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let pending = factories.length;
    let lastErr = new Error('All attempts failed');
    const ctrls = factories.map(() => new AbortController());
    function cancelAll() { ctrls.forEach(c => { try { c.abort(); } catch {} }); }
    factories.forEach((factory, i) => {
      factory(ctrls[i].signal).then(result => {
        if (settled) return;
        settled = true;
        cancelAll();
        resolve(result);
      }).catch(err => {
        if (!settled) lastErr = err;
        pending--;
        if (!settled && pending === 0) reject(lastErr);
      });
    });
  });
}

// Shuffle in-place (Fisher-Yates) so parallel requests spread across proxies
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function fetchPageHtml(url) {
  // Build one factory per proxy (plus direct), race them all in parallel.
  // The first to return a valid response wins; the rest are aborted.
  const PER_PROXY_MS = 20000; // generous per-slot timeout

  // Direct fetch factory
  const directFactory = signal => fetchWithTimeout(url,
    { credentials: 'omit', cache: 'no-store', signal }, PER_PROXY_MS)
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status);
                 return r.text(); })
    .then(t => { if (!t || t.length < 200) throw new Error('Empty response');
                 return t; });

  // One factory per proxy
  const proxyFactories = CORS_PROXIES.map(makeProxy => signal =>
    fetchWithTimeout(makeProxy(url), { cache: 'no-store', signal }, PER_PROXY_MS)
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status);
                   return r.text(); })
      .then(t => { if (!t || t.length < 200) throw new Error('Empty response');
                   return t; })
  );

  try {
    return await raceFirst([directFactory, ...proxyFactories]);
  } catch {
    throw new Error('All proxies failed');
  }
}
function extractFromHtml(html, url) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const titleEl = doc.querySelector('.chr-text');
  const title = titleEl ? titleEl.textContent.trim() : '';
  const contentEl = doc.querySelector('#chr-content');
  if (!contentEl) return { title, content: '', error: 'Chapter content not found.' };
  const clone = contentEl.cloneNode(true);
  clone.querySelectorAll('script,style,.pubfuture,[id^="pf-"],hr').forEach(el => el.remove());
  const lines = []; clone.querySelectorAll('h4, p').forEach(el => { const t = el.textContent.trim(); if (t) lines.push(t); });
  const content = lines.join('\n\n');
  if (!content) return { title, content: '', error: 'No text content found.' };
  return { title, content, error: null };
}
function getNextUrlFromHtml(html, baseUrl) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const btn = doc.getElementById('next_chap');
  if (!btn) return { nextUrl: null, isLast: true };
  const href = btn.getAttribute('href') || '';
  if (btn.hasAttribute('disabled') || href.endsWith('/null') || href === '') return { nextUrl: null, isLast: true };
  try { return { nextUrl: new URL(href, originOf(baseUrl)).href, isLast: false }; } catch { return { nextUrl: href, isLast: false }; }
}

/* ══════════════════════════════════════════════════════════
   BULK URL EXTRACTOR — core logic
══════════════════════════════════════════════════════════ */

/**
 * NovelBin novel pages embed chapter lists in the HTML.
 * Strategy:
 *  1. Direct fetch the novel page (or via corsproxy).
 *  2. Parse the DOM for the chapter list — NovelBin uses
 *     <ul id="ul-chapter-list"> or similar structures.
 *     We look for <a> tags whose href matches /b/<slug>/chapter-*
 *     OR anchors inside the #tab-chapters-title section.
 *  3. Also try the dedicated AJAX endpoint NovelBin uses to
 *     load chapter lists: /ajax/chapter-option?novelId=...
 *     which returns an <option> list or chapter list HTML.
 */

function bueExtractChaptersFromHtml(html, novelSlug, baseUrl) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const chapters = [];
  const seen = new Set();
  const origin = originOf(baseUrl);
 
  function addLink(a) {
    // Always strip the URL fragment (#...) before processing
    const href = (a.getAttribute('href') || '').split('#')[0].trim();
    if (!href || !CHAPTER_HREF_RE.test(href) || href.endsWith('/null')) return;
    let url;
    try { url = new URL(href, origin).href; } catch { return; }
    if (seen.has(url)) return;
    seen.add(url);
    // Prefer the title="" attribute; fall back to inner text of .nchr-text / .chapter-title spans
    const titleAttr  = (a.getAttribute('title') || '').trim();
    const innerSpan  = a.querySelector('.nchr-text, .chapter-title');
    const innerText  = (innerSpan ? innerSpan.textContent : a.textContent || '').trim().replace(/\s+/g, ' ');
    const title      = titleAttr || innerText || url.split('/').pop();
    chapters.push({ title, url });
  }
 
  // ── Method 1: primary NovelBin chapter-list selectors ─────────────
  // NovelBin renders chapters inside  ul.list-chapter > li > a
  // wrapped in .chapter-archive-grid > .chapter-archive-row > .chapter-archive-column
  // (or directly inside #list-chapter).  Try the most specific first.
  const PRIMARY_SELECTORS = [
    '.chapter-archive-column .list-chapter a',
    '.chapter-archive-grid  .list-chapter a',
    '#list-chapter          .list-chapter a',
    '.list-chapter a',
    '#ul-chapter-list a',
  ];
  for (const sel of PRIMARY_SELECTORS) {
    const els = doc.querySelectorAll(sel);
    if (els.length === 0) continue;
    els.forEach(addLink);
    if (chapters.length > 0) break; // stop at first selector that yields results
  }
 
  // ── Method 2: NovelBin duplicates the list inside a <template> tag ─
  //   (used by their JS to re-render rows — same data, different DOM node)
  //   Always run this — it may contain more chapters than the rendered grid.
  {
    const tmpl = doc.querySelector('[data-chapter-item-template], [data-first-chapter-template]');
    if (tmpl) {
      const host = document.createElement('ul');
      host.innerHTML = tmpl.innerHTML;
      host.querySelectorAll('a[href]').forEach(addLink);
    }
  }
 
  // ── Method 3: generic slug-pattern fallback ────────────────────────
  if (chapters.length === 0) {
    const slug = novelSlug || '';
    // Build a pattern that matches /b/<slug>/anything OR /chapter/<slug>/anything
    const escapedSlug = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = slug
      ? new RegExp('/(?:b|chapter)/' + escapedSlug + '/[^#"\'\\s]+')
      : /\/(?:b|chapter)\/[^/]+\/[^#"'\s]+/;
    doc.querySelectorAll('a[href]').forEach(a => {
      const href = (a.getAttribute('href') || '').split('#')[0].trim();
      if (!pattern.test(href)) return;
      addLink(a);
    });
  }
 
  // ── Method 4: <option value="..."> (some AJAX responses) ──────────
  if (chapters.length === 0) {
    doc.querySelectorAll('option[value]').forEach(opt => {
      const href = (opt.getAttribute('value') || '').split('#')[0].trim();
      if (!CHAPTER_HREF_RE.test(href)) return;
      const fakeA = document.createElement('a');
      fakeA.href = href;
      fakeA.textContent = opt.textContent.trim();
      addLink(fakeA);
    });
  }
 
  return chapters;
}

function bueGetNovelTitle(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const t = doc.querySelector('h3.title, h1.title, .book-name, h1, title');
  return t ? t.textContent.trim().split('|')[0].trim() : '';
}

function bueGetNovelId(html) {
  // NovelBin sometimes embeds the novelId in script tags or data attrs
  // Try numeric ID first
  const m = html.match(/novelId['":\s]+(\d+)/i) || html.match(/data-novel-id=['""](\d+)['""]/) || html.match(/"novel_id"\s*:\s*"?(\d+)"?/);
  if (m) return m[1];
  // Also try slug-based novel ID (e.g. data-novel-id="pioneer-lord-i-have-conquering-system")
  const ms = html.match(/data-novel-id=["']([\w-]+)["']/) || html.match(/novel_id["'\s:,]+["']([\w-]+)["']/);
  return ms ? ms[1] : null;
}

function bueSlugFromUrl(url) {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    return parts[1] || '';
  } catch { return ''; }
}

/* ── NovelArrow API helpers ────────────────────────────────────────────
   novelarrow.com exposes a clean JSON API:
     Novel page:  /novel/<slug>
     Chapter list: /api-web/novels/<slug>/chapters?sort=asc
     Chapter data: /api-web/novels/<slug>/chapters/<chapter-id>
   We use it directly instead of HTML-scraping to get a reliable,
   premium-filtered chapter list.
─────────────────────────────────────────────────────────────────────── */

function isNovelArrowUrl(url) {
  if (!url) return false;
  // Normalise: add https:// if missing so new URL() can parse it
  const u = url.trim();
  const full = u.startsWith('http') ? u : 'https://' + u;
  try { return new URL(full).hostname.includes('novelarrow.com'); } catch { return false; }
}

// Extract novel slug from any novelarrow.com URL:
//   /novel/<slug>  or  /chapter/<slug>/<chapter-id>
function novelArrowSlug(url) {
  try {
    const full = (url && !url.trim().startsWith('http')) ? 'https://' + url.trim() : url;
    const parts = new URL(full).pathname.split('/').filter(Boolean);
    // parts[0] = 'novel' | 'chapter', parts[1] = slug
    return parts[1] || '';
  } catch { return ''; }
}

/* ── JSON-aware proxy strategies ───────────────────────────────────────
   Each entry is { makeUrl(url), extract(text) } so we can handle the
   different response envelopes each proxy wraps around the raw content.
   allorigins wraps in {"contents":"…","status":{…}} — we unwrap it.
   The raw-mode proxies (corsproxy.io, etc.) return the body directly.
─────────────────────────────────────────────────────────────────────── */
const JSON_PROXY_STRATEGIES = [
  // allorigins /get — returns JSON envelope: { contents: "...", status: { ... } }
  {
    makeUrl: u => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
    extract: text => {
      const envelope = JSON.parse(text);
      const inner    = envelope.contents ?? envelope;
      return typeof inner === 'string' ? JSON.parse(inner) : inner;
    }
  },
  // allorigins /raw — returns raw body directly
  {
    makeUrl: u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    extract: text => JSON.parse(text)
  },
  // corsproxy.io — returns raw body
  {
    makeUrl: u => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    extract: text => JSON.parse(text)
  },
  // thingproxy — returns raw body (100KB limit, fine for chapter API)
  {
    makeUrl: u => `https://thingproxy.freeboard.io/fetch/${u}`,
    extract: text => JSON.parse(text)
  },
  // cors-anywhere — returns raw body
  {
    makeUrl: u => `https://cors-anywhere.herokuapp.com/${u}`,
    extract: text => JSON.parse(text)
  },
  // cors.sh — returns raw body
  {
    makeUrl: u => `https://proxy.cors.sh/${u}`,
    extract: text => JSON.parse(text)
  },
  // Cloudflare cors-anywhere worker — returns raw body
  {
    makeUrl: u => `https://test.cors.workers.dev/?${encodeURIComponent(u)}`,
    extract: text => JSON.parse(text)
  },
  // gobetween — returns raw body
  {
    makeUrl: u => `https://gobetween.oklabs.org/${u}`,
    extract: text => JSON.parse(text)
  },
  // HTMLDriven — returns raw body
  {
    makeUrl: u => `https://cors-proxy.htmldriven.com/?url=${encodeURIComponent(u)}`,
    extract: text => {
      // HTMLDriven sometimes wraps in { "header": "...", "body": "..." }
      try {
        const j = JSON.parse(text);
        if (j && typeof j.body === 'string') return JSON.parse(j.body);
        return j;
      } catch { return JSON.parse(text); }
    }
  },
  // yacdn — returns raw body
  {
    makeUrl: u => `https://yacdn.org/serve/${u}`,
    extract: text => JSON.parse(text)
  },
  // crossorigin.me — returns raw body
  {
    makeUrl: u => `https://crossorigin.me/${u}`,
    extract: text => JSON.parse(text)
  },
];

async function fetchJson(url) {
  // Race direct fetch + all proxy strategies in parallel.
  // First valid JSON object/array wins; losers are aborted immediately.
  const PER_SLOT_MS = 20000;

  function tryParseJson(text, extractFn) {
    if (!text || text.length < 2) throw new Error('Empty body');
    const t = text.trimStart();
    // Reject obvious HTML error pages
    if (t.startsWith('<!') || t.startsWith('<html')) throw new Error('Got HTML instead of JSON');
    try {
      const parsed = extractFn ? extractFn(text) : JSON.parse(text);
      if (parsed && typeof parsed === 'object') return parsed;
      throw new Error('Non-object result');
    } catch {
      // envelope parse failed — fall back to raw JSON parse
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object') return parsed;
      throw new Error('Could not parse JSON');
    }
  }

  // Direct fetch factory
  const directFactory = signal =>
    fetchWithTimeout(url, {
      credentials: 'omit', cache: 'no-store',
      headers: { 'Accept': 'application/json' }, signal
    }, PER_SLOT_MS)
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
    .then(text => tryParseJson(text, null));

  // One factory per proxy strategy
  const proxyFactories = JSON_PROXY_STRATEGIES.map(strategy => signal =>
    fetchWithTimeout(strategy.makeUrl(url), { cache: 'no-store', signal }, PER_SLOT_MS)
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
    .then(text => tryParseJson(text, strategy.extract))
  );

  try {
    return await raceFirst([directFactory, ...proxyFactories]);
  } catch {
    throw new Error('All proxies failed for JSON fetch');
  }
}

/**
 * Fetch ALL free chapters for a novelarrow.com novel via its JSON API.
 * Only returns chapters where premium_content=false, platinum_content=false, coin_price=0.
 * Returns { chapters: [{title, url}], novelTitle, slug }
 */
async function bueFetchNovelArrowChapters(rawUrl) {
  const origin = 'https://novelarrow.com';
  const slug   = novelArrowSlug(rawUrl) || bueSlugFromUrl(rawUrl);
  if (!slug) throw new Error('Could not extract novel slug from URL.');

  // 1. Fetch chapter list from API
  const listUrl = `${origin}/api-web/novels/${slug}/chapters?sort=asc`;
  const listData = await fetchJson(listUrl);
  const items = listData.items || listData.data || listData.chapters || [];
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('NovelArrow API returned no chapters.');
  }

  // 2. Filter to free chapters only
  const freeItems = items.filter(ch =>
    ch.premium_content === false &&
    ch.platinum_content === false &&
    (ch.coin_price === 0 || ch.coin_price === null || ch.coin_price === undefined)
  );

  if (freeItems.length === 0) {
    throw new Error('No free chapters found (all are premium/coin-locked).');
  }

  // 3. Build chapter URL list — chapter page URL: /chapter/<slug>/<chapter-id>
  const chapters = freeItems.map(ch => ({
    title: ch.chapter_name || ch.chapter_id,
    url:   `${origin}/chapter/${slug}/${ch.chapter_id}`,
    // Store API URL so single-extract can use JSON content instead of HTML parsing
    apiUrl: `${origin}/api-web/novels/${slug}/chapters/${ch.chapter_id}`,
  }));

  // 4. Try to get novel title from first page HTML (best effort)
  let novelTitle = slug;
  try {
    const pageHtml = await fetchPageHtml(`${origin}/novel/${slug}`);
    const parsed   = new DOMParser().parseFromString(pageHtml, 'text/html');
    const t = parsed.querySelector('h3.title, h1.title, .book-name, h1');
    if (t) novelTitle = t.textContent.trim().split('|')[0].trim();
  } catch { /* non-fatal */ }

  return { chapters, novelTitle, slug };
}

/**
 * Fetch a single NovelArrow chapter via its JSON API.
 * Returns { title, content, error }
 */
async function fetchNovelArrowChapter(chapterPageUrl) {
  // Derive the API URL from the chapter page URL:
  //   /chapter/<slug>/<chapter-id>  →  /api-web/novels/<slug>/chapters/<chapter-id>
  try {
    const u     = new URL(chapterPageUrl);
    const parts = u.pathname.split('/').filter(Boolean);
    // parts: ['chapter', slug, chapter-id]
    if (parts.length >= 3 && parts[0] === 'chapter') {
      const slug      = parts[1];
      const chapterId = parts.slice(2).join('/');
      const apiUrl    = `${u.origin}/api-web/novels/${slug}/chapters/${chapterId}`;
      const data      = await fetchJson(apiUrl);

      // Exhaustively search the response for chapter content.
      // We log the top-level keys so bugs are visible in the browser console.
      console.log('[NA] Chapter API response keys:', Object.keys(data || {}));

      // Walk every plausible nesting path NovelArrow might use
      const candidates = [
        data?.item?.chapterInfo,
        data?.chapterInfo,
        data?.item,
        data?.data?.chapterInfo,
        data?.data,
        data?.chapter,
        data?.result,
        data?.content,
        data,
      ];
      // Pick the first candidate that has chapter_content or chapter_name
      const info = candidates.find(c =>
        c && typeof c === 'object' && (c.chapter_content || c.chapter_name)
      ) || {};

      console.log('[NA] info keys:', Object.keys(info));

      // chapter_content may itself be nested or have alternate field names
      const rawHtml = info.chapter_content || info.content || info.text || info.body || '';
      const title   = info.chapter_name || info.title || info.name || chapterId;

      if (!rawHtml) {
        // Dump the full response to console so we can see what the API actually returns
        console.warn('[NA] No content found. Full response:', JSON.stringify(data).slice(0, 500));
        return { title, content: '', error: `Empty chapter content. API keys: ${Object.keys(data||{}).join(', ')}` };
      }
      // Strip all HTML tags → pure plain text, preserving paragraph breaks
      const doc  = new DOMParser().parseFromString(rawHtml, 'text/html');
      // Remove script/style noise first
      doc.querySelectorAll('script, style, noscript').forEach(el => el.remove());
      // Walk block-level elements: each <p>, <div>, <br>, <li> becomes a paragraph break
      // Strategy: replace block tags with newline sentinels before extracting text
      const BLOCK_TAGS = new Set(['P','DIV','BR','LI','TR','H1','H2','H3','H4','H5','H6','BLOCKQUOTE','HR']);
      function extractText(node) {
        let out = '';
        for (const child of node.childNodes) {
          if (child.nodeType === Node.TEXT_NODE) {
            out += child.textContent;
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            const inner = extractText(child);
            out += BLOCK_TAGS.has(child.tagName) ? '\n' + inner + '\n' : inner;
          }
        }
        return out;
      }
      const raw = extractText(doc.body)
        // Collapse 3+ consecutive newlines to exactly two (one blank line between paras)
        .replace(/\n{3,}/g, '\n\n')
        // Trim each line
        .split('\n').map(l => l.trim()).join('\n')
        // Remove blank lines that are now just whitespace
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      // Decode any remaining HTML entities (&amp; &lt; &gt; &quot; &#39; &#NNN;)
      const txtArea = document.createElement('textarea');
      txtArea.innerHTML = raw;
      const content = txtArea.value.trim();
      return { title, content, error: content ? null : 'No text extracted from chapter HTML.' };
    }
  } catch (e) {
    return { title: '', content: '', error: e.message };
  }
  return { title: '', content: '', error: 'Not a recognised NovelArrow chapter URL.' };
}

async function bueFetchChapterList(rawUrl) {
  // ── Fast path: NovelArrow has a clean JSON API — use it directly ──
  if (isNovelArrowUrl(rawUrl)) {
    return bueFetchNovelArrowChapters(rawUrl);
  }

  // 1. Normalise to the canonical novel page (handles both URL schemes,
  //    strips fragments/chapter segments — see toNovelPageUrl()).
  const baseUrl = toNovelPageUrl(rawUrl);
 
  const slug = bueSlugFromUrl(baseUrl);
  let results    = [];
  let novelTitle = '';
  let html       = '';
 
  // 3. Fetch the main novel page — chapters are fully server-rendered inline
  try {
    html       = await fetchPageHtml(baseUrl);
    novelTitle = bueGetNovelTitle(html) || slug;
    const fromPage = bueExtractChaptersFromHtml(html, slug, baseUrl);
    fromPage.forEach(c => results.push(c));
  } catch (e) {
    throw new Error('Failed to fetch novel page: ' + e.message);
  }
 
  // 4. AJAX endpoints for novels with very large chapter counts
  //    (NovelBin/NovelArrow lazy-load the full list via these endpoints —
  //     always try in case the inline HTML only has a partial chapter list)
  const novelId = bueGetNovelId(html);
  if (novelId) {
    const ajaxOrigin = originOf(baseUrl);
    const ajaxUrls = [
      `${ajaxOrigin}/ajax/chapter-option?novelId=${novelId}`,
      `${ajaxOrigin}/ajax/chapter-archive?novelId=${novelId}`,
    ];
    for (const aUrl of ajaxUrls) {
      try {
        const ajaxHtml = await fetchPageHtml(aUrl);
        const fromAjax = bueExtractChaptersFromHtml(ajaxHtml, slug, baseUrl);
        if (fromAjax.length > results.length) {
          results = fromAjax;
        }
        // If AJAX gave more chapters, we're done
        if (results.length > 0 && fromAjax.length >= results.length) break;
      } catch { /* ignore individual AJAX failures */ }
    }
  }
 
  return { chapters: results, novelTitle, slug };
}

/* BUE UI */
function bueRenderList() {
  bueChapterList.innerHTML = '';
  bueSelected.clear();
  applyBueFilters();
}

function applyBueFilters() {
  let list = [...bueAllChapters];
  // Order
  if (bueOrder === 'desc') list = list.reverse();
  // Range
  const from = Math.max(1, bueRangeActive.from || 1);
  const to   = bueRangeActive.to === Infinity ? list.length : Math.min(list.length, bueRangeActive.to);
  bueFiltered = list.slice(from - 1, to);
  renderBueItems();
}

function renderBueItems() {
  bueShownCount.textContent = bueFiltered.length;
  bueTotalCount.textContent = bueAllChapters.length;
  bueChapterList.innerHTML = bueFiltered.map((ch, i) => `
    <div class="bue-ch-item ${bueSelected.has(i) ? 'selected' : ''}" data-idx="${i}">
      <div class="bue-ch-check"></div>
      <span class="bue-ch-num">#${i+1}</span>
      <span class="bue-ch-name" title="${esc(ch.title)}">${esc(trunc(ch.title, 50))}</span>
      <span class="bue-ch-url" title="${esc(ch.url)}">${esc(trunc(ch.url, 36))}</span>
    </div>
  `).join('');
  updateBueSelCount();
}

function updateBueSelCount() {
  bueSelectedCount.textContent = bueSelected.size + ' selected';
  const hasAny = bueSelected.size > 0;
  bueSendBtn.disabled    = !hasAny;
  bueCopyUrlsBtn.disabled = !hasAny;
}

bueChapterList.addEventListener('click', e => {
  const item = e.target.closest('.bue-ch-item');
  if (!item) return;
  const idx = parseInt(item.dataset.idx);
  if (bueSelected.has(idx)) { bueSelected.delete(idx); item.classList.remove('selected'); }
  else                       { bueSelected.add(idx);    item.classList.add('selected'); }
  updateBueSelCount();
});

bueSelAll.addEventListener('click',    () => { bueFiltered.forEach((_, i) => bueSelected.add(i)); renderBueItems(); });
bueSelNone.addEventListener('click',   () => { bueSelected.clear(); renderBueItems(); });
bueSelInvert.addEventListener('click', () => { bueFiltered.forEach((_, i) => { if (bueSelected.has(i)) bueSelected.delete(i); else bueSelected.add(i); }); renderBueItems(); });

bueOrderSeg.querySelectorAll('.bue-seg-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    bueOrderSeg.querySelectorAll('.bue-seg-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    bueOrder = btn.dataset.order;
    bueSelected.clear();
    applyBueFilters();
  });
});

bueRangeApply.addEventListener('click', () => {
  const f = parseInt(bueRangeFrom.value) || 1;
  const t = parseInt(bueRangeTo.value)   || Infinity;
  bueRangeActive = { from: f, to: t };
  bueSelected.clear();
  applyBueFilters();
  showStatus(statusBue, `✓ Range applied: chapters ${f}–${t === Infinity ? 'end' : t}`, 'info');
});

bueFetchBtn.addEventListener('click', async () => {
  let raw = novelPageInput.value.trim();
  if (!raw) { showStatus(statusBue, '⚠ Enter a novelbin.com or novelarrow.com novel URL.', 'error', true); return; }
  // Auto-prepend https:// if missing
  if (!raw.startsWith('http')) raw = 'https://' + raw;
  novelPageInput.value = raw;
  if (!isAllowedUrl(raw)) {
    showStatus(statusBue, '⚠ Enter a valid novelbin.com or novelarrow.com novel URL.', 'error', true);
    return;
  }
  // reset
  bueAllChapters = []; bueFiltered = []; bueSelected.clear();
  bueResults.classList.remove('visible');
  bueSentConfirm.classList.remove('visible');
  bueLoader.style.display = 'flex';
  bueFetchBtn.disabled = true;
  statusBue.style.display = 'none';
  document.getElementById('buePastePanel').style.display = 'none';

  try {
    const { chapters, novelTitle, slug } = await bueFetchChapterList(raw);
    bueLoader.style.display = 'none';
    bueFetchBtn.disabled = false;

    if (chapters.length === 0) {
      showStatus(statusBue,
        '⚠ No chapters found on that page. NovelBin/NovelArrow may require login or load chapters via JavaScript. ' +
        'Try pasting the page source using the fallback below.',
        'warn', true);
      bueShowPastePanel();
      return;
    }

    bueAllChapters = chapters;
    bueNovelTitle.textContent = novelTitle || slug || 'Unknown Novel';
    bueTotalBadge.textContent = chapters.length + ' chapters';
    bueNovelBadge.textContent = slug || 'novel';
    bueRangeFrom.max = chapters.length;
    bueRangeTo.max   = chapters.length;
    bueRangeActive   = { from: 1, to: Infinity };
    bueOrder         = 'asc';
    bueOrderSeg.querySelectorAll('.bue-seg-btn').forEach(b => b.classList.toggle('active', b.dataset.order === 'asc'));
    applyBueFilters();
    bueResults.classList.add('visible');
    showStatus(statusBue, `✓ Found ${chapters.length} chapters for "${novelTitle}". Select below.`, 'success');
    footerText.textContent = `URL Extractor: ${chapters.length} chapters from "${trunc(novelTitle,35)}"`;
  } catch(err) {
    bueLoader.style.display = 'none';
    bueFetchBtn.disabled = false;
    showStatus(statusBue, '✗ ' + err.message + ' — Try the paste fallback below.', 'error', true);
    bueShowPastePanel();
  }
});

// ── Paste fallback panel: tab switching + auto-select for NovelArrow ──
const buePasteTabHtml = document.getElementById('buePasteTabHtml');
const buePasteTabJson = document.getElementById('buePasteTabJson');
const buePasteHtmlPane = document.getElementById('buePasteHtmlPane');
const buePasteJsonPane = document.getElementById('buePasteJsonPane');
const buePasteJsonUrlHint = document.getElementById('buePasteJsonUrlHint');

function buePasteActivateTab(tab) {
  // tab: 'html' | 'json'
  const isJson = tab === 'json';
  buePasteTabHtml.style.background    = isJson ? 'transparent' : 'var(--surface3)';
  buePasteTabHtml.style.color         = isJson ? 'var(--muted)' : 'var(--text)';
  buePasteTabJson.style.background    = isJson ? 'var(--surface3)' : 'transparent';
  buePasteTabJson.style.color         = isJson ? 'var(--text)' : 'var(--muted)';
  buePasteHtmlPane.style.display      = isJson ? 'none' : '';
  buePasteJsonPane.style.display      = isJson ? '' : 'none';
}

function bueShowPastePanel() {
  const raw = novelPageInput.value.trim();
  // Auto-select JSON tab for NovelArrow URLs, and populate the hint URL
  if (isNovelArrowUrl(raw)) {
    const slug = novelArrowSlug(raw) || bueSlugFromUrl(raw);
    if (slug) {
      buePasteJsonUrlHint.textContent =
        `https://novelarrow.com/api-web/novels/${slug}/chapters?sort=asc`;
    } else {
      buePasteJsonUrlHint.textContent =
        'https://novelarrow.com/api-web/novels/<slug>/chapters?sort=asc';
    }
    buePasteActivateTab('json');
  } else {
    buePasteActivateTab('html');
  }
  document.getElementById('buePastePanel').style.display = 'block';
}

buePasteTabHtml.addEventListener('click', () => buePasteActivateTab('html'));
buePasteTabJson.addEventListener('click', () => buePasteActivateTab('json'));

// ── Paste HTML fallback handlers ──────────────────────────────────────
document.getElementById('buePasteClose').addEventListener('click', () => {
  document.getElementById('buePastePanel').style.display = 'none';
});

document.getElementById('bueExtractPasteBtn').addEventListener('click', () => {
  const html = document.getElementById('bueHtmlPaste').value.trim();
  if (!html) {
    showStatus(statusBue, '⚠ Paste the page source first.', 'error', true);
    return;
  }
  // Try to extract novel slug from pasted URL input or from HTML itself
  const rawUrl  = novelPageInput.value.trim();
  const slug    = bueSlugFromUrl(rawUrl) || (html.match(/\/b\/([\w-]+)\//) || [])[1] || '';
  const chapters = bueExtractChaptersFromHtml(html, slug, rawUrl);
  const novelTitle = bueGetNovelTitle(html) || slug || 'Unknown Novel';

  if (chapters.length === 0) {
    showStatus(statusBue, '⚠ No chapters found in pasted HTML. Make sure you copied the full page source (Ctrl+U → Ctrl+A → Ctrl+C).', 'error', true);
    return;
  }

  bueAllChapters = chapters;
  bueResults.classList.remove('visible');
  bueNovelTitle.textContent = novelTitle;
  bueTotalBadge.textContent = chapters.length + ' chapters';
  bueNovelBadge.textContent = slug || 'novel';
  bueRangeFrom.max = chapters.length;
  bueRangeTo.max   = chapters.length;
  bueRangeActive   = { from: 1, to: Infinity };
  bueOrder         = 'asc';
  bueOrderSeg.querySelectorAll('.bue-seg-btn').forEach(b => b.classList.toggle('active', b.dataset.order === 'asc'));
  applyBueFilters();
  bueResults.classList.add('visible');
  document.getElementById('buePastePanel').style.display = 'none';
  showStatus(statusBue, `✓ Extracted ${chapters.length} chapters from pasted source for "${novelTitle}".`, 'success');
  footerText.textContent = `URL Extractor: ${chapters.length} chapters from "${trunc(novelTitle,35)}"`;
});

// ── JSON paste handler (NovelArrow chapters API response) ──────────────
document.getElementById('bueExtractJsonBtn').addEventListener('click', () => {
  const raw = document.getElementById('bueJsonPaste').value.trim();
  if (!raw) {
    showStatus(statusBue, '⚠ Paste the JSON first.', 'error', true);
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    showStatus(statusBue, '✗ Invalid JSON — make sure you copied the full API response.', 'error', true);
    return;
  }

  // Unwrap allorigins envelope: { contents: "...", status: {...} }
  // contents is itself a JSON string that needs a second parse
  if (parsed && typeof parsed.contents === 'string') {
    try { parsed = JSON.parse(parsed.contents); } catch {
      showStatus(statusBue, '✗ Could not parse the JSON inside the allorigins envelope.', 'error', true);
      return;
    }
  }
  // Also unwrap { data: { items: [...] } } nesting
  if (parsed && parsed.data && !Array.isArray(parsed.data) &&
      (parsed.data.items || parsed.data.chapters)) {
    parsed = parsed.data;
  }

  // Support the same envelope shapes as bueFetchNovelArrowChapters
  const items = parsed.items || parsed.data || parsed.chapters || [];
  if (!Array.isArray(items) || items.length === 0) {
    showStatus(statusBue, '✗ No chapter items found in pasted JSON.', 'error', true);
    return;
  }

  // Filter to free chapters only (same logic as API path)
  const freeItems = items.filter(ch =>
    ch.premium_content === false &&
    ch.platinum_content === false &&
    (ch.coin_price === 0 || ch.coin_price === null || ch.coin_price === undefined)
  );

  if (freeItems.length === 0) {
    showStatus(statusBue, '⚠ All chapters in this JSON are premium/coin-locked — nothing to extract.', 'warn', true);
    return;
  }

  // Derive the slug from the URL input (or try to find it in item URLs)
  const rawUrl  = novelPageInput.value.trim();
  const slug    = (isNovelArrowUrl(rawUrl) && (novelArrowSlug(rawUrl) || bueSlugFromUrl(rawUrl)))
                  || (freeItems[0]?.chapter_id ? '' : '');
  const origin  = 'https://novelarrow.com';

  // Build chapter objects — need the slug for the URL
  // If we can't determine slug from URL input, try to infer from the hint textarea
  let resolvedSlug = slug;
  if (!resolvedSlug) {
    const hintText = buePasteJsonUrlHint ? buePasteJsonUrlHint.textContent : '';
    const hintMatch = hintText.match(/\/novels\/([\w-]+)\//);
    if (hintMatch) resolvedSlug = hintMatch[1];
  }

  const chapters = freeItems.map(ch => ({
    title: ch.chapter_name || ch.chapter_id || '(untitled)',
    url:   resolvedSlug
      ? `${origin}/chapter/${resolvedSlug}/${ch.chapter_id}`
      : ch.chapter_id,          // fallback — user can still copy the list
  }));

  const novelTitle = resolvedSlug || 'NovelArrow Novel';

  bueAllChapters = chapters;
  bueResults.classList.remove('visible');
  bueNovelTitle.textContent = novelTitle;
  bueTotalBadge.textContent = chapters.length + ' chapters';
  bueNovelBadge.textContent = resolvedSlug || 'novel';
  bueRangeFrom.max = chapters.length;
  bueRangeTo.max   = chapters.length;
  bueRangeActive   = { from: 1, to: Infinity };
  bueOrder         = 'asc';
  bueOrderSeg.querySelectorAll('.bue-seg-btn').forEach(b => b.classList.toggle('active', b.dataset.order === 'asc'));
  applyBueFilters();
  bueResults.classList.add('visible');
  document.getElementById('buePastePanel').style.display = 'none';
  const skipped = items.length - freeItems.length;
  const skipNote = skipped > 0 ? ` (${skipped} premium/locked skipped)` : '';
  showStatus(statusBue, `✓ Extracted ${chapters.length} free chapters from pasted JSON${skipNote}.`, 'success');
  footerText.textContent = `URL Extractor: ${chapters.length} chapters from "${trunc(novelTitle, 35)}"`;
});

novelPageInput.addEventListener('keydown', e => { if (e.key === 'Enter') bueFetchBtn.click(); });

/* ── VERSION CHANGELOG PANEL ─────────────────────────────────────────── */
(function () {
  const btn     = document.getElementById('verBadgeBtn');
  const panel   = document.getElementById('verPanel');
  const overlay = document.getElementById('verOverlay');
  const closeBtn= document.getElementById('verPanelClose');
  if (!btn || !panel) return;

  function openPanel() {
    panel.style.display = 'block';
    overlay.style.display = 'block';
    // Trigger transition on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { panel.style.transform = 'translateX(0)'; });
    });
  }
  function closePanel() {
    panel.style.transform = 'translateX(100%)';
    overlay.style.display = 'none';
    setTimeout(() => { panel.style.display = 'none'; }, 290);
  }

  btn.addEventListener('click', openPanel);
  closeBtn.addEventListener('click', closePanel);
  overlay.addEventListener('click', closePanel);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && panel.style.display !== 'none') closePanel(); });
})();


bueSendBtn.addEventListener('click', () => {
  const selected = [...bueSelected].sort((a,b) => a-b).map(i => bueFiltered[i]);
  if (selected.length === 0) return;
  const urls = selected.map(c => c.url);

  // Inject into Custom URL List in Bulk tab
  urlListInput.value = urls.join('\n');
  urlListMeta.textContent = urls.length + ' URLs';
  urlListValidated.classList.remove('visible');
  // switch to custom mode
  bulkMode = 'custom';
  modeCustomUrls.classList.add('active'); modeContinuous.classList.remove('active');
  urlListPanel.classList.add('visible');

  bueSentConfirm.textContent =
    `✓ ${urls.length} chapter URL${urls.length===1?'':'s'} sent to Bulk → Custom URL List. ` +
    `Switch to the "Till Latest" tab to start scraping.`;
  bueSentConfirm.classList.add('visible');

  showStatus(statusBue,
    `✓ ${urls.length} URLs loaded into Bulk Scraper → Custom URL List!`,
    'success', true);
});

bueCopyUrlsBtn.addEventListener('click', async () => {
  const selected = [...bueSelected].sort((a,b) => a-b).map(i => bueFiltered[i]);
  if (selected.length === 0) return;
  const text = selected.map(c => c.url).join('\n');
  try { await navigator.clipboard.writeText(text); } catch {}
  showStatus(statusBue, `✓ ${selected.length} URLs copied to clipboard!`, 'success');
  bueCopyUrlsBtn.textContent = '✓ Copied!';
  setTimeout(() => { bueCopyUrlsBtn.textContent = '📋 Copy URLs'; }, 2000);
});

bueResetBtn.addEventListener('click', () => {
  bueAllChapters = []; bueFiltered = []; bueSelected.clear();
  bueResults.classList.remove('visible');
  bueSentConfirm.classList.remove('visible');
  novelPageInput.value = '';
  statusBue.style.display = 'none';
  bueChapterList.innerHTML = '';
});

/* ── SINGLE EXTRACT ── */
extractBtn.addEventListener('click', async () => {
  const url = urlInput.value.trim() || window.location.href;
  if (!isAllowedUrl(url)) { showStatus(statusSingle, '⚠ Enter a novelbin.com or novelarrow.com chapter URL above first.', 'error', true); return; }
  statusSingle.style.display = 'none'; loaderSingle.style.display = 'flex'; extractBtn.disabled = true;
  try {
    let title, content, error;

    // Use NovelArrow JSON API for novelarrow.com chapter pages (/chapter/<slug>/<id>)
    if (isNovelArrowUrl(url) && new URL(url).pathname.startsWith('/chapter/')) {
      showStatus(statusSingle, '⚡ Fetching via NovelArrow API…', 'info', true);
      ({ title, content, error } = await withRetry(
        () => fetchNovelArrowChapter(url),
        { maxAttempts: 4, onRetry: (attempt, max, err, delay) => {
          showStatus(statusSingle, `⚠ Attempt ${attempt}/${max} failed — retrying in ${(delay/1000).toFixed(1)}s… (${err.message})`, 'warn', true);
        }}
      ));
    } else {
      const html = await withRetry(
        () => fetchPageHtml(url),
        { maxAttempts: 4, onRetry: (attempt, max, err, delay) => {
          showStatus(statusSingle, `⚠ Attempt ${attempt}/${max} failed — retrying in ${(delay/1000).toFixed(1)}s… (${err.message})`, 'warn', true);
        }}
      );
      ({ title, content, error } = extractFromHtml(html, url));
    }

    loaderSingle.style.display = 'none'; extractBtn.disabled = false;
    if (error && !content) { showStatus(statusSingle, '✗ ' + error, 'error', true); return; }
    singleText = content; singleTitle = title; singleUrl = url;
    output.value = content; chapterTitle.textContent = title;
    const s = calcStats(content); wordCount.textContent = s.words.toLocaleString() + ' words'; charCount.textContent = s.chars.toLocaleString() + ' chars';
    copyBtn.disabled = printBtn.disabled = clearBtn.disabled = false;
    autoSaveHistory({ type: 'single', firstChapter: title, lastChapter: title, chaptersCount: 1, text: content, novelUrl: novelBaseUrl(url) });
    showStatus(statusSingle, `✓ Extracted & saved — ${s.words.toLocaleString()} words`, 'success');
    footerText.textContent = `Last extract: ${trunc(title, 50)}`;
  } catch(err) { loaderSingle.style.display = 'none'; extractBtn.disabled = false; showStatus(statusSingle, '✗ Failed after 4 attempts: ' + err.message, 'error', true); }
});
copyBtn.addEventListener('click', async () => {
  if (!singleText) return;
  try { await navigator.clipboard.writeText(singleText); } catch {}
  showStatus(statusSingle, '✓ Copied to clipboard!', 'success');
  copyBtn.textContent = '✓ Copied!'; setTimeout(() => { copyBtn.textContent = '📋 Copy'; }, 2000);
});
printBtn.addEventListener('click', () => { if (!singleText) return; setPrintData(singleText, singleTitle, null); switchTab(tabPrint, panelPrint); syncPrintPanel(); });
clearBtn.addEventListener('click', () => {
  singleText = ''; singleTitle = ''; singleUrl = ''; output.value = ''; chapterTitle.textContent = '';
  wordCount.textContent = '0 words'; charCount.textContent = '0 chars';
  copyBtn.disabled = printBtn.disabled = clearBtn.disabled = true; statusSingle.style.display = 'none';
});

/* ── BULK SCRAPE ── */
function setBulkUI(running) {
  bulkRunning = running; bulkStartBtn.disabled = running; bulkStopBtn.disabled = !running;
  if (running) { progressWrap.classList.add('show'); progressLabel.textContent = 'SCRAPING...'; canvasIndicator.style.display = 'flex'; progressBarFill.classList.add('animated'); }
  else         { progressWrap.classList.remove('show'); canvasIndicator.style.display = 'none'; progressBarFill.classList.remove('animated'); }
}
bulkStartBtn.addEventListener('click', async () => {
  bulkStopped = false; bulkChunks = []; bulkFirstTitle = ''; bulkLastTitle = ''; bulkCount = 0;
  bulkOutput.value = ''; bulkWordCount.textContent = '0 words'; bulkCharCount.textContent = '0 chars';
  bulkCopyBtn.disabled = bulkPrintBtn.disabled = bulkClearBtn.disabled = true;
  statusBulk.style.display = 'none'; bulkChapterTitle.textContent = '';
  progressBarFill.style.width = '5%';
  if (bulkMode === 'custom') {
    const rawUrls = parseUrlList(urlListInput.value).filter(u => isAllowedUrl(u));
    if (rawUrls.length === 0) { showStatus(statusBulk, '⚠ No valid novelbin.com or novelarrow.com URLs in list. Paste URLs and validate first.', 'error', true); return; }
    customUrlList = rawUrls; bulkStartUrl = rawUrls[0];
    const batchSz = rawUrls.length > 100 ? 8 : rawUrls.length > 30 ? 5 : 3;
    progressCurrent.textContent = `0 / ${rawUrls.length} chapters…`;
    canvasIndicatorText.textContent = `Custom list: ${rawUrls.length} URLs`;
    setBulkUI(true);
    showStatus(statusBulk,
      `🚀 Scraping ${rawUrls.length} URLs in parallel batches of ${batchSz} — order preserved!`,
      'warn', true);
    startBulkTimer(rawUrls.length);
    runCustomUrlLoop(rawUrls);
  } else {
    const url = urlInput.value.trim();
    if (!url || !isAllowedUrl(url)) { showStatus(statusBulk, '⚠ Enter a novelbin.com or novelarrow.com chapter URL above first.', 'error', true); return; }
    bulkStartUrl = url; progressCurrent.textContent = 'Fetching first chapter…';
    canvasIndicatorText.textContent = '0 chapters scraped';
    setBulkUI(true); showStatus(statusBulk, '🚀 Scraping via hidden canvas — no tab opened!', 'warn', true);
    startBulkTimer(0);
    runBulkLoop(url);
  }
});
bulkStopBtn.addEventListener('click', () => { bulkStopped = true; setBulkUI(false); stopBulkTimer(); progressLabel.textContent = 'STOPPING…'; showStatus(statusBulk, '⏹ Stopping after current chapter…', 'warn', true); });

async function runBulkLoop(startUrl) {
  // ── NovelArrow: use JSON API for reliable content + chapter list ──────
  if (isNovelArrowUrl(startUrl)) {
    await runNovelArrowBulkLoop(startUrl);
    return;
  }

  let currentUrl = startUrl;
  while (!bulkStopped) {
    try {
      progressCurrent.textContent = `Fetching: ${trunc(currentUrl, 55)}`;
      const html = await withRetry(
        () => fetchPageHtml(currentUrl),
        { maxAttempts: 4, onRetry: (attempt, max, err, delay) => {
          progressCurrent.textContent = `Retry ${attempt}/${max}: ${trunc(currentUrl, 42)} — ${(delay/1000).toFixed(1)}s delay`;
          canvasIndicatorText.textContent = `Retrying chapter (attempt ${attempt}/${max})…`;
        }}
      );
      const { title, content, error } = extractFromHtml(html, currentUrl);
      if (error && !content) {
        showStatus(statusBulk, `⚠ Parse error on "${trunc(currentUrl,35)}", skipping: ${error}`, 'warn', true);
        const nav = getNextUrlFromHtml(html, currentUrl);
        if (nav.isLast || !nav.nextUrl) { finishBulk('continuous'); break; }
        currentUrl = nav.nextUrl; await sleep(800); continue;
      }
      bulkCount++; bulkLastTitle = title;
      if (!bulkFirstTitle) bulkFirstTitle = title;
      const chunk = `\n\n${'─'.repeat(60)}\n${title}\n${'─'.repeat(60)}\n\n${content}`;
      bulkChunks.push({ title, content, raw: chunk }); updateBulkOutput();
      chapterCounter.textContent = bulkCount + ' chapter' + (bulkCount === 1 ? '' : 's');
      bulkChapterTitle.textContent = title; canvasIndicatorText.textContent = `${bulkCount} chapter${bulkCount===1?'':'s'} scraped`;
      recordChapterDone(bulkCount);
      const nav = getNextUrlFromHtml(html, currentUrl);
      if (nav.isLast || !nav.nextUrl) { finishBulk('continuous'); break; }
      currentUrl = nav.nextUrl; await sleep(800);
    } catch(err) {
      setBulkUI(false); stopBulkTimer();
      showStatus(statusBulk, `✗ Failed after 4 attempts on "${trunc(currentUrl,35)}": ${err.message}`, 'error', true);
      if (bulkCount > 0) {
        autoSaveHistory({ type: 'bulk', firstChapter: bulkFirstTitle, lastChapter: bulkLastTitle, chaptersCount: bulkCount, text: bulkText, novelUrl: novelBaseUrl(bulkStartUrl) });
        showStatus(statusBulk, `⏹ Saved ${bulkCount} chapters scraped before failure.`, 'warn', true);
      }
      break;
    }
  }
  if (bulkStopped && bulkText) {
    stopBulkTimer();
    autoSaveHistory({ type: 'bulk', firstChapter: bulkFirstTitle, lastChapter: bulkLastTitle, chaptersCount: bulkCount, text: bulkText, novelUrl: novelBaseUrl(bulkStartUrl) });
    showStatus(statusBulk, `⏹ Stopped — ${bulkCount} chapters saved to history.`, 'warn', true);
  }
}

/* ── NovelArrow "till latest" bulk loop ────────────────────────────────
   1. Fetch the full chapter list via the JSON API (same as URL Extractor).
   2. Find which chapter to start from (matching the startUrl).
   3. Fetch each chapter's content sequentially via the JSON API.         */
async function runNovelArrowBulkLoop(startUrl) {
  // 1. Get full free chapter list
  let chapterList;
  try {
    showStatus(statusBulk, '⚡ Fetching NovelArrow chapter list via API…', 'warn', true);
    progressCurrent.textContent = 'Fetching chapter list…';
    const result = await bueFetchNovelArrowChapters(startUrl);
    chapterList = result.chapters;
    if (!chapterList || chapterList.length === 0) throw new Error('No free chapters found.');
  } catch(err) {
    setBulkUI(false); stopBulkTimer();
    showStatus(statusBulk, `✗ Could not fetch chapter list: ${err.message}`, 'error', true);
    return;
  }

  // 2. Find start index — match by chapter-id slug in the URL
  const startParts = (() => { try { return new URL(startUrl).pathname.split('/').filter(Boolean); } catch { return []; } })();
  const startChapterId = startParts.slice(2).join('/'); // everything after /chapter/<slug>/
  let startIdx = 0;
  if (startChapterId) {
    const found = chapterList.findIndex(ch => ch.url.includes(startChapterId));
    if (found !== -1) startIdx = found;
  }

  const total = chapterList.length - startIdx;
  progressCurrent.textContent = `Starting from chapter ${startIdx + 1} of ${chapterList.length} — ${total} to scrape`;
  canvasIndicatorText.textContent = `0 / ${total} chapters`;
  showStatus(statusBulk, `🚀 Scraping ${total} chapter${total===1?'':'s'} via NovelArrow API…`, 'warn', true);

  // 3. Fetch each chapter sequentially
  for (let i = startIdx; i < chapterList.length; i++) {
    if (bulkStopped) break;
    const ch = chapterList[i];
    const chNum = i - startIdx + 1;

    progressCurrent.textContent = `Ch ${chNum}/${total}: ${trunc(ch.url, 50)}`;
    progressBarFill.style.width = Math.round((chNum / total) * 100) + '%';

    try {
      const { title, content, error } = await withRetry(
        () => fetchNovelArrowChapter(ch.url),
        { maxAttempts: 4, onRetry: (attempt, max, err, delay) => {
          progressCurrent.textContent = `Retry ${attempt}/${max} — ch ${chNum}/${total}: ${(delay/1000).toFixed(1)}s delay`;
          canvasIndicatorText.textContent = `Retrying ch ${chNum} (attempt ${attempt}/${max})…`;
        }}
      );

      if (error && !content) {
        // Show what's actually failing so we can diagnose the API shape issue
        showStatus(statusBulk, `⚠ Ch ${chNum} skipped — ${error}`, 'warn', true);
        bulkChapterTitle.textContent = `⚠ Ch ${chNum}: ${trunc(error, 60)}`;
        console.warn(`[NA bulk] ch ${chNum} skipped:`, error, ch.url);
        continue;
      }

      bulkCount++; bulkLastTitle = title;
      if (!bulkFirstTitle) bulkFirstTitle = title;
      const raw = `\n\n${'─'.repeat(60)}\n${title}\n${'─'.repeat(60)}\n\n${content}`;
      bulkChunks.push({ title, content, raw }); updateBulkOutput();
      chapterCounter.textContent = bulkCount + ' chapter' + (bulkCount === 1 ? '' : 's');
      bulkChapterTitle.textContent = title;
      canvasIndicatorText.textContent = `${bulkCount} / ${total} scraped`;
      recordChapterDone(bulkCount);
      await sleep(700);

    } catch(err) {
      showStatus(statusBulk, `✗ Failed ch ${chNum} after 4 attempts: ${err.message}`, 'error', true);
      // Insert placeholder and continue rather than aborting the whole run
      const placeholder = `[Chapter ${chNum} could not be fetched — open manually: ${ch.url}]`;
      const raw = `\n\n${'─'.repeat(60)}\nChapter ${chNum} [MISSING]\n${'─'.repeat(60)}\n\n${placeholder}`;
      bulkChunks.push({ title: `Chapter ${chNum} [MISSING]`, content: placeholder, raw });
      updateBulkOutput();
      await sleep(1500);
    }
  }

  if (!bulkStopped) {
    progressBarFill.style.width = '100%';
    finishBulk('continuous');
  } else if (bulkText) {
    stopBulkTimer(); setBulkUI(false);
    autoSaveHistory({ type: 'bulk', firstChapter: bulkFirstTitle, lastChapter: bulkLastTitle, chaptersCount: bulkCount, text: bulkText, novelUrl: novelBaseUrl(bulkStartUrl) });
    showStatus(statusBulk, `⏹ Stopped — ${bulkCount} chapters saved.`, 'warn', true);
  }
}


async function runCustomUrlLoop(urls) {
  const total      = urls.length;
  const BATCH_SIZE = total > 100 ? 8 : total > 30 ? 5 : 3;
  const results    = new Array(total).fill(null);
  const failedIdxs = []; // indices that exhausted all retries in main pass

  // ── fetch + extract one URL, store at results[i] ──────────────────────
  async function fetchOne(i, isRetry = false) {
    if (bulkStopped) return;
    const url = urls[i];

    // Use NovelArrow JSON API for novelarrow.com chapter pages
    if (isNovelArrowUrl(url) && (() => { try { return new URL(url).pathname.startsWith('/chapter/'); } catch { return false; } })()) {
      try {
        const { title, content, error } = await withRetry(
          () => fetchNovelArrowChapter(url),
          {
            maxAttempts: isRetry ? 6 : 4,
            baseDelay:   isRetry ? 3000 : 1200,
            onRetry: (attempt, max, err, delay) => {
              canvasIndicatorText.textContent =
                `Ch ${i+1}${isRetry?' (retry pass)':''}: attempt ${attempt}/${max}…`;
            }
          }
        );
        if (error && !content) { results[i] = { skipped: true, url, reason: error }; if (!isRetry) failedIdxs.push(i); return; }
        results[i] = { title, content, url };
      } catch(err) {
        results[i] = { skipped: true, url, reason: err.message };
        if (!isRetry) failedIdxs.push(i);
      }
      return;
    }

    let html;
    try {
      html = await withRetry(
        () => fetchPageHtml(url),
        {
          maxAttempts: isRetry ? 6 : 4,          // extra attempts on retry pass
          baseDelay:   isRetry ? 3000 : 1200,    // longer backoff on retry pass
          onRetry: (attempt, max, err, delay) => {
            canvasIndicatorText.textContent =
              `Ch ${i+1}${isRetry?' (retry pass)':''}: attempt ${attempt}/${max}…`;
          }
        }
      );
    } catch(err) {
      results[i] = { skipped: true, url, reason: err.message };
      if (!isRetry) failedIdxs.push(i);
      return;
    }
    const { title, content, error } = extractFromHtml(html, url);
    if (error && !content) {
      results[i] = { skipped: true, url, reason: error };
      if (!isRetry) failedIdxs.push(i);
      return;
    }
    results[i] = { title, content, url };
  }

  // ── helper: commit a batch of indices to bulkChunks in order ──────────
  function commitBatch(indices) {
    for (const i of indices) {
      const r = results[i];
      if (!r || r.skipped) continue;
      bulkCount++;
      bulkLastTitle = r.title;
      if (!bulkFirstTitle) bulkFirstTitle = r.title;
      const raw = `\n\n${'─'.repeat(60)}\n${r.title}\n${'─'.repeat(60)}\n\n${r.content}`;
      bulkChunks.push({ title: r.title, content: r.content, raw });
    }
    updateBulkOutput();
    chapterCounter.textContent = bulkCount + ' chapter' + (bulkCount===1?'':'s');
    canvasIndicatorText.textContent = `${bulkCount}/${total} done`;
    recordChapterDone(bulkCount);
  }

  // ══ MAIN PASS — parallel batches ══════════════════════════════════════
  for (let batchStart = 0; batchStart < total; batchStart += BATCH_SIZE) {
    if (bulkStopped) break;
    const batchEnd     = Math.min(batchStart + BATCH_SIZE, total);
    const batchIndices = Array.from({ length: batchEnd - batchStart }, (_, k) => batchStart + k);

    progressCurrent.textContent =
      `Batch ${Math.floor(batchStart/BATCH_SIZE)+1}/${Math.ceil(total/BATCH_SIZE)} — ` +
      `ch ${batchStart+1}–${batchEnd} of ${total} (${BATCH_SIZE} parallel)`;
    progressBarFill.style.width = Math.round((batchStart / total) * 100) + '%';

    await Promise.all(batchIndices.map(i => fetchOne(i, false)));
    commitBatch(batchIndices);

    if (batchEnd < total && !bulkStopped) await sleep(600);
  }

  // ══ RETRY PASS — re-attempt everything that failed in parallel ══════════
  if (!bulkStopped && failedIdxs.length > 0) {
    showStatus(statusBulk,
      `⚠ ${failedIdxs.length} chapter${failedIdxs.length===1?'':'s'} failed — retrying with longer delays…`,
      'warn', true);
    progressBarFill.style.width = '95%';

    const RETRY_BATCH = 4;
    for (let ri = 0; ri < failedIdxs.length; ri += RETRY_BATCH) {
      if (bulkStopped) break;
      const batchSlice = failedIdxs.slice(ri, ri + RETRY_BATCH);
      progressCurrent.textContent =
        `Retry pass: ch ${batchSlice.map(i=>i+1).join(', ')} of ${total}…`;
      await Promise.all(batchSlice.map(i => { results[i] = null; return fetchOne(i, true); }));
      const recovered = batchSlice.filter(i => results[i] && !results[i].skipped);
      if (recovered.length) commitBatch(recovered);
      if (ri + RETRY_BATCH < failedIdxs.length && !bulkStopped) await sleep(1500);
    }

    // Insert placeholders for chapters that still failed after retry
    const stillFailed = failedIdxs.filter(i => !results[i] || results[i].skipped);
    for (const i of stillFailed) {
      const placeholder = `[Chapter ${i+1} could not be fetched — open manually: ${urls[i]}]`;
      results[i] = { title: `Chapter ${i+1} [MISSING]`, content: placeholder, url: urls[i], missing: true };
      commitBatch([i]);
    }

    // Show batch manual-paste tray if anything still needs manual attention
    if (stillFailed.length > 0 && !bulkStopped) {
      showBulkPasteTray(stillFailed, urls, results);
    }
  }

  // ══ FINISH ═════════════════════════════════════════════════════════════
  if (!bulkStopped) {
    progressBarFill.style.width = '100%';
    stopBulkTimer();
    finishBulk('custom');
  } else if (bulkText) {
    stopBulkTimer();
    setBulkUI(false);
    autoSaveHistory({ type: 'custom', firstChapter: bulkFirstTitle, lastChapter: bulkLastTitle, chaptersCount: bulkCount, text: bulkText, novelUrl: novelBaseUrl(bulkStartUrl) });
    showStatus(statusBulk, `⏹ Stopped — ${bulkCount} chapters saved to history.`, 'warn', true);
  }
}

/* ── BATCH MANUAL PASTE TRAY ─────────────────────────────────────────────
   Shows a non-blocking list of all failed chapters so the user can paste
   them one-by-one at their own pace, then apply them all at once.        */
function showBulkPasteTray(failedIdxList, allUrls, resultsRef) {
  // Remove any existing tray
  const existing = document.getElementById('bulkPasteTray');
  if (existing) existing.remove();

  const count = failedIdxList.length;
  const tray = document.createElement('div');
  tray.id = 'bulkPasteTray';
  tray.style.cssText = [
    'margin-top:14px',
    'border:1px solid rgba(245,158,11,.35)',
    'border-radius:10px',
    'padding:14px',
    'background:rgba(245,158,11,.04)',
    'position:relative',
  ].join(';');

  tray.innerHTML = `
    <div style="font-family:var(--mono);font-size:10px;color:var(--accent4);letter-spacing:1.2px;margin-bottom:4px;">
      ✋ MANUAL PASTE REQUIRED — ${count} CHAPTER${count===1?'':'S'} FAILED
    </div>
    <div style="font-family:var(--mono);font-size:10px;color:var(--muted);line-height:1.7;margin-bottom:10px;">
      These chapters could not be fetched even after retrying.
      For each one: click the link → copy the chapter text → paste it below → click ✓.<br>
      When done, click <strong style="color:var(--text)">Apply All Pastes</strong> to patch them into the output.
      Chapters left empty will stay as [MISSING] placeholders.
    </div>
    <div id="bulkPasteTrayList" style="max-height:340px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;margin-bottom:12px;"></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
      <button id="bulkPasteTrayApply" style="padding:7px 18px;border-radius:6px;border:1px solid var(--success);background:rgba(0,245,160,.1);color:var(--success);font-family:var(--ff);font-size:12px;font-weight:700;letter-spacing:1px;cursor:pointer;text-transform:uppercase;">
        ✓ Apply All Pastes
      </button>
      <button id="bulkPasteTrayDismiss" style="padding:6px 12px;border-radius:6px;border:1px solid var(--border);background:transparent;color:var(--muted);font-family:var(--ff);font-size:11px;cursor:pointer;">
        Dismiss
      </button>
      <span id="bulkPasteTrayStatus" style="font-family:var(--mono);font-size:10px;color:var(--muted);margin-left:4px;"></span>
    </div>
  `;

  const list = tray.querySelector('#bulkPasteTrayList');

  failedIdxList.forEach(i => {
    const url = allUrls[i];
    const item = document.createElement('div');
    item.dataset.chIdx = i;
    item.style.cssText = 'border:1px solid var(--border);border-radius:7px;padding:10px;background:var(--surface3);';
    item.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap;">
        <span style="font-family:var(--mono);font-size:10px;color:var(--accent4);white-space:nowrap;">Ch ${i+1}</span>
        <a href="${esc(url)}" target="_blank" rel="noopener"
           style="font-family:var(--mono);font-size:10px;color:var(--accent);text-decoration:none;
                  flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
           title="${esc(url)}">🔗 ${esc(url)}</a>
        <span class="tray-status-badge" style="font-family:var(--mono);font-size:9px;color:var(--muted);white-space:nowrap;">empty</span>
      </div>
      <textarea class="tray-paste-area" placeholder="Paste chapter text here…" spellcheck="false"
        style="width:100%;height:70px;resize:vertical;background:var(--surface);border:1px solid var(--border);
               border-radius:5px;color:var(--text);font-family:var(--mono);font-size:10px;
               padding:7px;box-sizing:border-box;outline:none;"></textarea>
    `;

    // Live badge update
    const ta = item.querySelector('.tray-paste-area');
    const badge = item.querySelector('.tray-status-badge');
    ta.addEventListener('input', () => {
      const filled = ta.value.trim().length > 0;
      badge.textContent = filled ? '✓ ready' : 'empty';
      badge.style.color = filled ? 'var(--success)' : 'var(--muted)';
      item.style.borderColor = filled ? 'rgba(0,245,160,.3)' : 'var(--border)';
    });

    list.appendChild(item);
  });

  // Apply button — patch resultsRef and rebuild bulkOutput
  tray.querySelector('#bulkPasteTrayApply').addEventListener('click', () => {
    let patched = 0;
    list.querySelectorAll('[data-ch-idx]').forEach(item => {
      const idx = parseInt(item.dataset.chIdx);
      const text = item.querySelector('.tray-paste-area').value.trim();
      if (!text) return;
      const lines   = text.split('\n').map(l => l.trim()).filter(Boolean);
      const title   = lines[0] && lines[0].length < 120 ? lines[0] : `Chapter ${idx+1}`;
      const content = lines.slice(title === lines[0] ? 1 : 0).join('\n\n').trim() || text;
      resultsRef[idx] = { title, content, url: allUrls[idx], patched: true };
      patched++;
    });

    if (patched === 0) {
      tray.querySelector('#bulkPasteTrayStatus').textContent = '⚠ Nothing pasted yet.';
      return;
    }

    // Rebuild bulkChunks in index order from resultsRef
    bulkChunks = [];
    bulkCount  = 0;
    bulkFirstTitle = '';
    bulkLastTitle  = '';
    for (let idx = 0; idx < allUrls.length; idx++) {
      const r = resultsRef[idx];
      if (!r) continue;
      const raw = `\n\n${'─'.repeat(60)}\n${r.title}\n${'─'.repeat(60)}\n\n${r.content}`;
      bulkChunks.push({ title: r.title, content: r.content, raw });
      bulkCount++;
      bulkLastTitle = r.title;
      if (!bulkFirstTitle) bulkFirstTitle = r.title;
    }
    updateBulkOutput();

    const stillMissing = allUrls.length - bulkCount +
      bulkChunks.filter(c => c.content.startsWith('[Chapter')).length;
    tray.querySelector('#bulkPasteTrayStatus').textContent =
      `✓ ${patched} chapter${patched===1?'':'s'} applied!` +
      (stillMissing > 0 ? ` (${stillMissing} still missing)` : ' — all filled!');

    // Re-save history with patched content
    autoSaveHistory({ type: 'custom', firstChapter: bulkFirstTitle, lastChapter: bulkLastTitle,
      chaptersCount: bulkCount, text: bulkText, novelUrl: novelBaseUrl(bulkStartUrl) });
  });

  tray.querySelector('#bulkPasteTrayDismiss').addEventListener('click', () => tray.remove());

  // Insert after the status bar, before the output textarea
  statusBulk.insertAdjacentElement('afterend', tray);

  showStatus(statusBulk,
    `✗ ${count} chapter${count===1?'':'s'} need manual paste — see the tray below.`,
    'error', true);
}

function updateBulkOutput() {
  const fullText = bulkChunks.map(c => c.raw).join('');
  bulkText = fullText; bulkOutput.value = fullText;
  const s = calcStats(fullText);
  bulkWordCount.textContent = s.words.toLocaleString() + ' words'; bulkCharCount.textContent = s.chars.toLocaleString() + ' chars';
  bulkCopyBtn.disabled = bulkPrintBtn.disabled = bulkClearBtn.disabled = false;
}
function finishBulk(type) {
  setBulkUI(false); stopBulkTimer(); bulkChapterTitle.textContent = `Done — ${bulkCount} chapters`;
  autoSaveHistory({ type: type === 'custom' ? 'custom' : 'bulk', firstChapter: bulkFirstTitle, lastChapter: bulkLastTitle, chaptersCount: bulkCount, text: bulkText, novelUrl: novelBaseUrl(bulkStartUrl) });
  const s = calcStats(bulkText);
  showStatus(statusBulk, `✓ Done — ${bulkCount} chapters scraped & saved!`, 'success', true);
  footerText.textContent = `Bulk complete: ${bulkCount} chapters, ${s.words.toLocaleString()} words`;
}
bulkCopyBtn.addEventListener('click', async () => {
  if (!bulkText) return;
  try { await navigator.clipboard.writeText(bulkText); } catch {}
  showStatus(statusBulk, '✓ Copied!', 'success');
  bulkCopyBtn.textContent = '✓ Copied!'; setTimeout(() => { bulkCopyBtn.textContent = '📋 Copy'; }, 2000);
});
bulkPrintBtn.addEventListener('click', () => { if (!bulkText) return; setPrintData(bulkText, `${bulkFirstTitle} → ${bulkLastTitle}`, bulkChunks); switchTab(tabPrint, panelPrint); syncPrintPanel(); });
bulkClearBtn.addEventListener('click', () => {
  bulkText = ''; bulkChunks = []; bulkFirstTitle = ''; bulkLastTitle = ''; bulkCount = 0;
  bulkOutput.value = ''; bulkChapterTitle.textContent = '';
  bulkWordCount.textContent = '0 words'; bulkCharCount.textContent = '0 chars';
  bulkCopyBtn.disabled = bulkPrintBtn.disabled = bulkClearBtn.disabled = true; statusBulk.style.display = 'none';
});

/* ── HISTORY ── */
function autoSaveHistory(entry) {
  const words = entry.text.trim() ? entry.text.trim().split(/\s+/).length : 0;
  const h = { ...entry, id: Date.now().toString(36)+Math.random().toString(36).slice(2,6), timestamp: Date.now(), words, chars: entry.text.length };
  delete h.text; storageSet('nb_text_'+h.id, entry.text);
  let hist = storageGet(HISTORY_KEY, []);
  hist.unshift(h);
  if (hist.length > MAX_HISTORY) { hist.slice(MAX_HISTORY).forEach(old => { try { localStorage.removeItem('nb_text_'+old.id); } catch {} }); hist = hist.slice(0, MAX_HISTORY); }
  storageSet(HISTORY_KEY, hist);
}
function loadHistText(id) { return storageGet('nb_text_'+id, ''); }
subTabExtracts.addEventListener('click', () => { activeHistSub = 'extracts'; subTabExtracts.classList.add('active'); subTabBookmarks.classList.remove('active'); subTabLog.classList.remove('active'); extractsList.style.display = ''; bookmarksList.style.display = 'none'; sessionLogList.style.display = 'none'; renderExtracts(); });
subTabBookmarks.addEventListener('click', () => { activeHistSub = 'bookmarks'; subTabBookmarks.classList.add('active'); subTabExtracts.classList.remove('active'); subTabLog.classList.remove('active'); bookmarksList.style.display = ''; extractsList.style.display = 'none'; sessionLogList.style.display = 'none'; renderBookmarkLog(); });
subTabLog.addEventListener('click', () => { activeHistSub = 'log'; subTabLog.classList.add('active'); subTabExtracts.classList.remove('active'); subTabBookmarks.classList.remove('active'); sessionLogList.style.display = ''; extractsList.style.display = 'none'; bookmarksList.style.display = 'none'; renderSessionLog(); });
async function renderExtracts() {
  const hist = storageGet(HISTORY_KEY, []); histCountBadge.textContent = hist.length;
  if (hist.length === 0) { extractsList.innerHTML = `<div class="hist-empty"><div class="icon">📭</div><div class="msg">No extracts yet.</div></div>`; return; }
  extractsList.innerHTML = hist.map(e => {
    const isBulk = e.type === 'bulk', isCustom = e.type === 'custom';
    const range = (isBulk||isCustom) && e.firstChapter !== e.lastChapter ? `${trunc(e.firstChapter,24)} → ${trunc(e.lastChapter,24)}` : trunc(e.firstChapter, 48);
    const badge = isCustom ? 'custom' : (isBulk ? 'bulk' : 'single');
    const label = isCustom ? 'CUSTOM' : (isBulk ? 'BULK' : 'SINGLE');
    return `<div class="hc" data-id="${e.id}"><div class="hc-top"><div class="hc-title">${esc(range)}</div><div class="hc-ts" title="${fmtTimestamp(e.timestamp)}">${timeAgo(e.timestamp)}</div></div><div class="hc-meta"><span class="hc-badge ${badge}">${label}</span><span class="hc-badge auto">AUTO-SAVED</span><span class="hc-badge range">📑 ${e.chaptersCount} ch</span><span class="hc-badge words">✏ ${(e.words||0).toLocaleString()} w</span></div><div class="hc-actions"><button class="hc-btn load" data-id="${e.id}">📂 Load</button><button class="hc-btn recopy" data-id="${e.id}">📋 Copy</button><button class="hc-btn printhc" data-id="${e.id}">🖨 Print</button><button class="hc-btn del" data-id="${e.id}">🗑 Del</button></div></div>`;
  }).join('');
}
extractsList.addEventListener('click', async e => {
  const btn = e.target.closest('.hc-btn'); if (!btn) return;
  const id = btn.dataset.id; const hist = storageGet(HISTORY_KEY, []); const entry = hist.find(h => h.id === id); if (!entry) return;
  if (btn.classList.contains('load')) { const text = loadHistText(id); singleText = text; singleTitle = entry.firstChapter; singleUrl = entry.novelUrl || ''; output.value = text; chapterTitle.textContent = entry.firstChapter; const s = calcStats(text); wordCount.textContent = s.words.toLocaleString() + ' words'; charCount.textContent = s.chars.toLocaleString() + ' chars'; copyBtn.disabled = printBtn.disabled = clearBtn.disabled = false; switchTab(tabSingle, panelSingle); showStatus(statusSingle, `✓ Loaded: ${trunc(entry.firstChapter,40)}`, 'info'); }
  if (btn.classList.contains('recopy')) { const text = loadHistText(id); try { await navigator.clipboard.writeText(text); showStatus(statusHistory, '✓ Copied!', 'success'); } catch { showStatus(statusHistory, '✗ Clipboard failed.', 'error'); } }
  if (btn.classList.contains('printhc')) { const text = loadHistText(id); setPrintData(text, entry.firstChapter, null); switchTab(tabPrint, panelPrint); syncPrintPanel(); }
  if (btn.classList.contains('del')) { const updated = hist.filter(h => h.id !== id); try { localStorage.removeItem('nb_text_'+id); } catch {} storageSet(HISTORY_KEY, updated); renderExtracts(); showStatus(statusHistory, '✓ Deleted.', 'info'); }
});
function renderBookmarkLog() {
  const log = storageGet(BOOKMARK_LOG, []); histCountBadge.textContent = log.length;
  if (log.length === 0) { bookmarksList.innerHTML = `<div class="hist-empty"><div class="icon">🔖</div><div class="msg">No bookmark updates yet.</div></div>`; return; }
  bookmarksList.innerHTML = log.map(e => `<div class="hc bm-card" data-id="${e.id}"><div class="hc-top"><div class="hc-title">${esc(trunc(e.chapterTitle||e.newTitle,46))}</div><div class="hc-ts">${timeAgo(e.timestamp)}</div></div><div class="hc-meta"><span class="hc-badge bm">🔖 BOOKMARK</span><span class="hc-badge auto">AUTO-UPDATED</span></div><div class="bm-detail">Was: ${esc(trunc(e.oldTitle,36))}<br><span style="color:var(--bookmark)">Now: ${esc(trunc(e.newTitle,36))}</span></div><div class="hc-actions"><button class="hc-btn del" data-id="${e.id}">🗑 Delete</button></div></div>`).join('');
}
bookmarksList.addEventListener('click', e => { const btn = e.target.closest('.hc-btn.del'); if (!btn) return; let log = storageGet(BOOKMARK_LOG, []); log = log.filter(x => x.id !== btn.dataset.id); storageSet(BOOKMARK_LOG, log); renderBookmarkLog(); showStatus(statusHistory, '✓ Deleted.', 'info'); });
histClearAll.addEventListener('click', () => {
  if (activeHistSub === 'extracts') { if (!confirm('Clear all extract history?')) return; const hist = storageGet(HISTORY_KEY, []); hist.forEach(e => { try { localStorage.removeItem('nb_text_'+e.id); } catch {} }); storageSet(HISTORY_KEY, []); renderExtracts(); }
  else if (activeHistSub === 'bookmarks') { if (!confirm('Clear all bookmark logs?')) return; storageSet(BOOKMARK_LOG, []); renderBookmarkLog(); }
  else if (activeHistSub === 'log') { if (!confirm('Clear session log?')) return; try { sessionStorage.removeItem(SESSION_LOG_KEY); } catch {} renderSessionLog(); return; }
  showStatus(statusHistory, '✓ Cleared.', 'warn');
});
function renderHistory() {
  if (activeHistSub === 'extracts') { extractsList.style.display = ''; bookmarksList.style.display = 'none'; sessionLogList.style.display = 'none'; renderExtracts(); }
  else if (activeHistSub === 'bookmarks') { bookmarksList.style.display = ''; extractsList.style.display = 'none'; sessionLogList.style.display = 'none'; renderBookmarkLog(); }
  else { sessionLogList.style.display = ''; extractsList.style.display = 'none'; bookmarksList.style.display = 'none'; renderSessionLog(); }
}

/* ── PRINT ── */
function setPrintData(text, title, chunks) { printData = { text, title, chunks }; }
function loadPrintConfig() {
  const cfg = storageGet(PRINT_CFG_KEY, {});
  if (cfg.fontSize)   fontSizeSlider.value   = cfg.fontSize;
  if (cfg.lineHeight) lineHeightSlider.value  = cfg.lineHeight;
  if (cfg.fontFamily) fontFamilySelect.value  = cfg.fontFamily;
  if (cfg.pageBreak)  pageBreakSelect.value   = cfg.pageBreak;
  if (cfg.twoCol !== undefined)   twoColToggle.checked   = cfg.twoCol;
  if (cfg.titles !== undefined)   titlesToggle.checked   = cfg.titles;
  if (cfg.dividers !== undefined) dividersToggle.checked = cfg.dividers;
  updateSliderDisplays();
}
function savePrintConfig() { storageSet(PRINT_CFG_KEY, { fontSize: fontSizeSlider.value, lineHeight: lineHeightSlider.value, fontFamily: fontFamilySelect.value, pageBreak: pageBreakSelect.value, twoCol: twoColToggle.checked, titles: titlesToggle.checked, dividers: dividersToggle.checked }); }
function updateSliderDisplays() { fontSizeVal.textContent = parseFloat(fontSizeSlider.value).toFixed(1)+'pt'; lineHeightVal.textContent = parseFloat(lineHeightSlider.value).toFixed(1); }
[fontSizeSlider,lineHeightSlider].forEach(s => s.addEventListener('input', () => { updateSliderDisplays(); buildPreview(); savePrintConfig(); }));
[fontFamilySelect,pageBreakSelect].forEach(s => s.addEventListener('change', () => { buildPreview(); savePrintConfig(); }));
[twoColToggle,titlesToggle,dividersToggle].forEach(t => t.addEventListener('change', () => { buildPreview(); savePrintConfig(); }));
function syncPrintPanel() {
  if (!printData) { printSourceInfo.innerHTML = '<strong>Print source:</strong> No text loaded — extract a chapter first.'; printPreview.textContent = 'No text to preview yet.'; doPrintBtn.disabled = true; return; }
  const s = calcStats(printData.text);
  printSourceInfo.innerHTML = `<strong>Print source:</strong> ${esc(trunc(printData.title,60))} — ${s.words.toLocaleString()} words, ${s.chars.toLocaleString()} chars`;
  doPrintBtn.disabled = false; buildPreview();
}
// Split text into paragraphs robustly — handles \n\n, single \n, and mixed
function splitParas(text) {
  if (!text) return [];
  // If the text has double newlines, use those as paragraph breaks
  if (text.includes('\n\n')) {
    return text.split('\n\n').map(s => s.replace(/\n/g, ' ').trim()).filter(Boolean);
  }
  // Otherwise split on single newlines, treating each non-empty line as a paragraph
  return text.split('\n').map(s => s.trim()).filter(Boolean);
}

function buildPrintRoot(fontSize, lineHeight, fontFamily, twoCol, titles, dividers, pageBreak) {
  const root = document.getElementById('printRoot');
  if (!root || !printData) return;
  root.innerHTML = buildPrintHTML(fontSize, lineHeight, fontFamily, twoCol, titles, dividers, pageBreak);
}

function buildPreview() {
  if (!printData) return;
  const fontSize = parseFloat(fontSizeSlider.value), lineHeight = parseFloat(lineHeightSlider.value), fontFamily = fontFamilySelect.value, twoCol = twoColToggle.checked, titles = titlesToggle.checked, dividers = dividersToggle.checked;
  printPreview.style.fontSize = fontSize+'pt'; printPreview.style.lineHeight = lineHeight; printPreview.style.fontFamily = fontFamily; printPreview.classList.toggle('two-col', twoCol);
  if (printData.chunks && printData.chunks.length > 0) {
    let html = '';
    printData.chunks.forEach((ch, i) => {
      if (titles) html += `<div style="font-weight:bold;font-size:${(fontSize+1.5).toFixed(1)}pt;border-bottom:1px solid #ccc;padding-bottom:4pt;margin-bottom:8pt;">${esc(ch.title)}</div>`;
      html += splitParas(ch.content).map(p => {
        if (p.includes('─────')) return dividers ? `<hr style="border:none;border-top:1px dashed #ccc;margin:8pt 0;"/>` : '';
        return `<div style="margin-bottom:5pt;text-align:justify;">${esc(p)}</div>`;
      }).join('');
      if (dividers && i < printData.chunks.length-1) html += `<hr style="border:none;border-top:1px dashed #ccc;margin:10pt 0;"/>`;
    });
    printPreview.innerHTML = html;
  } else {
    let html = '';
    splitParas(printData.text).forEach(line => {
      const isSep = line.includes('─────');
      if (isSep && dividers) { html += `<hr style="border:none;border-top:1px dashed #ccc;margin:8pt 0;"/>`; return; }
      if (isSep) return;
      html += `<div style="margin-bottom:5pt;text-align:justify;">${esc(line)}</div>`;
    });
    printPreview.innerHTML = html || `<div>${esc(printData.text)}</div>`;
  }
  buildPrintRoot(fontSize, lineHeight, fontFamily, twoCol, titles, dividers, pageBreakSelect.value);
}
function buildPrintHTML(fontSize, lineHeight, fontFamily, twoCol, titles, dividers, pageBreak) {
  let body = '';
  const chunks = printData.chunks && printData.chunks.length > 0 ? printData.chunks : null;
  if (chunks) {
    chunks.forEach((ch, i) => {
      const pb = pageBreak === 'always' && i > 0 ? 'page-break-before:always;' : '';
      body += `<div class="pc" style="${pb}">`;
      if (titles) body += `<div class="pc-title">${esc(ch.title)}</div>`;
      splitParas(ch.content).forEach(para => {
        if (para.includes('─────')) { if (dividers) body += `<hr/>`; return; }
        body += `<p class="pp">${esc(para)}</p>`;
      });
      body += `</div>`;
      if (dividers && i < chunks.length - 1) body += `<hr/>`;
    });
  } else {
    body += `<div class="pc">`;
    if (titles && printData.title) body += `<div class="pc-title">${esc(printData.title)}</div>`;
    splitParas(printData.text).forEach(line => {
      if (line.includes('─────')) { if (dividers) body += `<hr/>`; return; }
      body += `<p class="pp">${esc(line)}</p>`;
    });
    body += `</div>`;
  }
  const colCSS = twoCol ? 'body{column-count:2;column-gap:20pt;} .pc-title{column-span:all;}' : '';
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>${esc(printData.title || 'Print')}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body{background:#fff;color:#000;font-family:${fontFamily};font-size:${fontSize}pt;line-height:${lineHeight};}
  .pc{margin-bottom:0;}
  .pc-title{font-weight:bold;font-size:${fontSize + 1.5}pt;border-bottom:1px solid #ccc;padding-bottom:4pt;margin-bottom:8pt;margin-top:4pt;}
  .pp{margin-bottom:5pt;text-align:justify;}
  hr{border:none;border-top:1px dashed #ccc;margin:8pt 0;}
  ${colCSS}
  @media print{html,body{overflow:visible!important;height:auto!important;}}
</style></head><body>${body}</body></html>`;
}
doPrintBtn.addEventListener('click', () => {
  if (!printData) return;
  showStatus(statusPrint, '🖨 Opening print dialog…', 'info');
  const fontSize = parseFloat(fontSizeSlider.value), lineHeight = parseFloat(lineHeightSlider.value),
        fontFamily = fontFamilySelect.value, twoCol = twoColToggle.checked,
        titles = titlesToggle.checked, dividers = dividersToggle.checked,
        pageBreak = pageBreakSelect.value;
  const html = buildPrintHTML(fontSize, lineHeight, fontFamily, twoCol, titles, dividers, pageBreak);
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) { showStatus(statusPrint, '✗ Popup blocked — allow popups for this site and try again.', 'error', true); return; }
  win.document.write(html);
  win.document.close();
  win.focus();
  // Wait for fonts/layout then print
  win.onload = () => { win.print(); };
  // Fallback if onload already fired
  setTimeout(() => { try { win.print(); } catch {} }, 600);
  showStatus(statusPrint, "✓ Print window opened. Use your browser's print settings for margins & paper.", 'success', true);
});

/* ── INIT ── */
loadPrintConfig(); renderExtracts();
try { if (isAllowedUrl(window.location.href)) urlInput.value = window.location.href; } catch {}

/* ══════════════════════════════════════════════════════════════════════════
   FIREBASE AUTH + USER PANEL  (roles: admin | normal | guest)
══════════════════════════════════════════════════════════════════════════ */
(function initFirebaseUI() {
  if (!window._fbAuth || !window._fbDb) { setTimeout(initFirebaseUI, 80); return; }

  const auth = window._fbAuth;
  const db   = window._fbDb;
  const F    = window._fbFns;

  /* ── DOM refs ── */
  const loginScreen    = document.getElementById('loginScreen');
  const loginEmail     = document.getElementById('loginEmail');
  const loginPass      = document.getElementById('loginPass');
  const loginBtn       = document.getElementById('loginBtn');
  const loginError     = document.getElementById('loginError');
  const loginSpinner   = document.getElementById('loginSpinner');

  const userPanel      = document.getElementById('userPanel');
  const userOverlay    = document.getElementById('userOverlay');
  const userAvatarBtn  = document.getElementById('userAvatarBtn');
  const userPanelClose = document.getElementById('userPanelClose');
  const upDisplayName  = document.getElementById('upDisplayName');
  const upRoleBadge    = document.getElementById('upRoleBadge');
  const upEmail        = document.getElementById('upEmail');
  const upSignOutBtn   = document.getElementById('upSignOutBtn');

  const upTabs         = document.querySelectorAll('.up-tab');
  const upNovelsTab    = document.getElementById('upNovelsTab');
  const upSettingsTab  = document.getElementById('upSettingsTab');
  const upAdminTabBtn  = document.getElementById('upAdminTab');
  const upAdminTabContent = document.getElementById('upAdminTabContent');

  const upNovelsList   = document.getElementById('upNovelsList');
  const upNovelsEmpty  = document.getElementById('upNovelsEmpty');
  const upAddNovelBtn  = document.getElementById('upAddNovelBtn');
  const upAddNovelForm = document.getElementById('upAddNovelForm');
  const upSaveNovelBtn = document.getElementById('upSaveNovelBtn');
  const upCancelNovelBtn = document.getElementById('upCancelNovelBtn');

  const upSettingName     = document.getElementById('upSettingName');
  const upSettingUsername = document.getElementById('upSettingUsername');
  const upSaveProfileBtn  = document.getElementById('upSaveProfileBtn');
  const upCurrentPass     = document.getElementById('upCurrentPass');
  const upNewPass         = document.getElementById('upNewPass');
  const upConfirmPass     = document.getElementById('upConfirmPass');
  const upChangePassBtn   = document.getElementById('upChangePassBtn');
  const upSettingsMsg     = document.getElementById('upSettingsMsg');

  // Admin
  const adminNewName       = document.getElementById('adminNewName');
  const adminNewUsername   = document.getElementById('adminNewUsername');
  const adminNewEmail      = document.getElementById('adminNewEmail');
  const adminNewPass       = document.getElementById('adminNewPass');
  const adminNewRole       = document.getElementById('adminNewRole');
  const adminCreateUserBtn = document.getElementById('adminCreateUserBtn');
  const adminRefreshBtn    = document.getElementById('adminRefreshUsersBtn');
  const adminUsersList     = document.getElementById('adminUsersList');
  const adminPassToggle    = document.getElementById('adminPassToggle');
  const upCreateUserMsg    = document.getElementById('upCreateUserMsg');
  const adminRefreshReportsBtn = document.getElementById('adminRefreshReportsBtn');
  const adminReportsList       = document.getElementById('adminReportsList');
  const adminReportSearch      = document.getElementById('adminReportSearch');
  const adminReportSort        = document.getElementById('adminReportSort');
  const upReportsTabContent    = document.getElementById('upReportsTabContent');
  const upNewReportBtn         = document.getElementById('upNewReportBtn');
  const upNewTaskForm          = document.getElementById('upNewTaskForm');
  const upActiveTaskBanner     = document.getElementById('upActiveTaskBanner');
  const upTaskNameInput        = document.getElementById('upTaskNameInput');
  const upTaskDescInput        = document.getElementById('upTaskDescInput');
  const upStartTaskBtn         = document.getElementById('upStartTaskBtn');
  const upCancelNewTaskBtn     = document.getElementById('upCancelNewTaskBtn');
  const upFinishTaskBtn        = document.getElementById('upFinishTaskBtn');
  const upCancelTaskBtn        = document.getElementById('upCancelTaskBtn');
  const upActiveTaskName       = document.getElementById('upActiveTaskName');
  const upTaskActivityLog      = document.getElementById('upTaskActivityLog');
  const upTaskNotes            = document.getElementById('upTaskNotes');
  const upTaskElapsed          = document.getElementById('upTaskElapsed');
  const upCompletedTasksSection= document.getElementById('upCompletedTasksSection');
  const upCompletedTasksList   = document.getElementById('upCompletedTasksList');
  const upMyReportsList        = document.getElementById('upMyReportsList');
  const upMyReportsEmpty       = document.getElementById('upMyReportsEmpty');

  let currentUser     = null;
  let currentUserData = {};
  let currentRole     = 'guest'; // 'admin' | 'normal' | 'guest'

  // Active task state
  let activeTask      = null;   // { name, desc, startTime, activityLog:[] }
  let _taskTimerInt   = null;
  let completedTasks  = [];     // finished but not yet reported

  /* ──────────────────────────────────────────────────────────
     ROLE HELPERS
  ────────────────────────────────────────────────────────── */
  const ROLE_STYLES = {
    admin:  { label: 'ADMIN',  bg: 'rgba(245,158,11,.15)', border: 'rgba(245,158,11,.4)', color: '#f59e0b' },
    normal: { label: 'USER',   bg: 'rgba(0,229,255,.08)',  border: 'rgba(0,229,255,.3)',  color: 'var(--accent)' },
    guest:  { label: 'GUEST',  bg: 'rgba(107,115,148,.15)',border: 'rgba(107,115,148,.4)','color': 'var(--muted)' },
  };

  function applyRoleUI(role) {
    currentRole = role || 'guest';
    const s = ROLE_STYLES[currentRole] || ROLE_STYLES.guest;
    upRoleBadge.textContent    = s.label;
    upRoleBadge.style.background   = s.bg;
    upRoleBadge.style.borderColor  = s.border;
    upRoleBadge.style.color        = s.color;
    upRoleBadge.style.display      = 'inline-block';

    // Show/hide admin tab
    if (upAdminTabBtn)   upAdminTabBtn.style.display   = role === 'admin' ? '' : 'none';
    // Reports tab visible for admin and normal; not for guest
    const upReportsTabBtn = document.getElementById('upReportsTab');
    if (upReportsTabBtn) upReportsTabBtn.style.display = (role === 'admin' || role === 'normal') ? '' : 'none';

    // Guest: hide add-novel button & settings
    if (upAddNovelBtn)  upAddNovelBtn.style.display  = role === 'guest' ? 'none' : '';
    if (upSaveProfileBtn) upSaveProfileBtn.disabled  = role === 'guest';
    if (upChangePassBtn)  upChangePassBtn.disabled   = role === 'guest';
  }

  /* ──────────────────────────────────────────────────────────
     PANEL OPEN / CLOSE
  ────────────────────────────────────────────────────────── */
  function openUserPanel() {
    userPanel.style.display = 'flex';
    userOverlay.style.display = 'block';
    requestAnimationFrame(() => requestAnimationFrame(() => userPanel.classList.add('open')));
  }
  function closeUserPanel() {
    userPanel.classList.remove('open');
    userOverlay.style.display = 'none';
    setTimeout(() => { userPanel.style.display = 'none'; }, 290);
  }

  userAvatarBtn.addEventListener('click', openUserPanel);
  userPanelClose.addEventListener('click', closeUserPanel);
  userOverlay.addEventListener('click', closeUserPanel);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && userPanel.classList.contains('open')) closeUserPanel();
  });

  /* ── Tab switching ── */
  upTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      upTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      upNovelsTab.style.display         = target === 'novels'   ? 'block' : 'none';
      upSettingsTab.style.display       = target === 'settings' ? 'block' : 'none';
      upReportsTabContent.style.display = target === 'reports'  ? 'block' : 'none';
      upAdminTabContent.style.display   = target === 'admin'    ? 'block' : 'none';
      if (target === 'admin')   { loadAdminUsers(); loadAdminReports(); }
      if (target === 'reports') loadMyReports();
    });
  });

  /* ──────────────────────────────────────────────────────────
     HELPERS
  ────────────────────────────────────────────────────────── */
  function showLoginError(msg) { loginError.textContent = msg; loginError.style.display = 'block'; }
  function hideLoginError()    { loginError.style.display = 'none'; }

  function showMsg(el, msg, type='success') {
    el.textContent = msg;
    el.style.display = 'block';
    el.style.background = type === 'success' ? 'rgba(0,245,160,.1)' : 'rgba(255,69,96,.1)';
    el.style.border     = type === 'success' ? '1px solid rgba(0,245,160,.3)' : '1px solid rgba(255,69,96,.3)';
    el.style.color      = type === 'success' ? 'var(--success)' : 'var(--error)';
    setTimeout(() => { el.style.display = 'none'; }, 3500);
  }

  /* ──────────────────────────────────────────────────────────
     AUTH STATE — first-user becomes admin automatically
  ────────────────────────────────────────────────────────── */
  F.onAuthStateChanged(auth, async user => {
    if (user) {
      currentUser = user;
      loginScreen.style.display = 'none';
      userAvatarBtn.style.display = 'flex';
      upEmail.textContent = user.email;

      try {
        const userRef  = F.doc(db, 'users', user.uid);
        const snap     = await F.getDoc(userRef);

        if (snap.exists()) {
          currentUserData = snap.data();

          // If the account was suspended or blocked, sign them out immediately
          if (currentUserData.status === 'suspended' || currentUserData.status === 'blocked') {
            await F.signOut(auth);
            showLoginError(`Your account has been ${currentUserData.status}. Contact the admin.`);
            loginScreen.style.display = 'flex';
            return;
          }

          applyRoleUI(currentUserData.role || 'normal');
        } else {
          // First-ever user → admin; all others → normal
          const allSnap = await F.getDocs(F.collection(db, 'users'));
          const role    = allSnap.empty ? 'admin' : 'normal';
          const data    = {
            displayName: '', username: '', email: user.email,
            role, status: 'active', createdAt: F.serverTimestamp()
          };
          await F.setDoc(userRef, data);
          currentUserData = data;
          applyRoleUI(role);
        }

        const name = currentUserData.displayName || currentUserData.username || user.email.split('@')[0];
        upDisplayName.textContent = name;
        userAvatarBtn.textContent = (name[0] || '?').toUpperCase();
        upSettingName.value       = currentUserData.displayName || '';
        upSettingUsername.value   = currentUserData.username    || '';

      } catch(e) { console.error('Profile load error:', e); }

      loadNovels();
    } else {
      currentUser = null;
      loginScreen.style.display = 'flex';
      userAvatarBtn.style.display = 'none';
    }
  });

  /* ──────────────────────────────────────────────────────────
     LOGIN
  ────────────────────────────────────────────────────────── */
  async function doLogin() {
    const email = loginEmail.value.trim();
    const pass  = loginPass.value;
    if (!email || !pass) { showLoginError('Enter your email and password.'); return; }
    hideLoginError();
    loginBtn.disabled = true;
    loginSpinner.style.display = 'block';
    try {
      await F.signInWithEmailAndPassword(auth, email, pass);
    } catch(e) {
      const msgs = {
        'auth/invalid-credential': 'Incorrect email or password.',
        'auth/user-not-found':     'No account found with that email.',
        'auth/wrong-password':     'Incorrect password.',
        'auth/too-many-requests':  'Too many attempts — try again later.',
        'auth/invalid-email':      'Invalid email address.',
        'auth/user-disabled':      'This account has been disabled.',
      };
      showLoginError(msgs[e.code] || 'Sign-in failed: ' + e.message);
    } finally { loginBtn.disabled = false; loginSpinner.style.display = 'none'; }
  }

  loginBtn.addEventListener('click', doLogin);
  loginPass.addEventListener('keydown',  e => { if (e.key === 'Enter') doLogin(); });
  loginEmail.addEventListener('keydown', e => { if (e.key === 'Enter') loginPass.focus(); });

  /* ──────────────────────────────────────────────────────────
     SIGN OUT
  ────────────────────────────────────────────────────────── */
  upSignOutBtn.addEventListener('click', async () => {
    closeUserPanel();
    if (currentUser && currentUser.isGuest) {
      currentUser = null; currentUserData = {}; currentRole = 'guest';
      userAvatarBtn.style.display = 'none';
      loginScreen.style.display   = 'flex';
    } else {
      await F.signOut(auth);
    }
  });

  /* ──────────────────────────────────────────────────────────
     NOVELS
  ────────────────────────────────────────────────────────── */
  async function loadNovels() {
    if (!currentUser || currentRole === 'guest') return;
    try {
      const snap = await F.getDocs(F.collection(db, 'users', currentUser.uid, 'novels'));
      const novels = [];
      snap.forEach(d => novels.push({ id: d.id, ...d.data() }));
      renderNovels(novels);
    } catch(e) { console.error('Novels load error:', e); }
  }

  function renderNovels(novels) {
    upNovelsList.innerHTML = '';
    if (novels.length === 0) {
      upNovelsEmpty.style.display = 'block';
      upNovelsList.appendChild(upNovelsEmpty);
      return;
    }
    upNovelsEmpty.style.display = 'none';
    novels.sort((a,b) => (a.createdAt?.seconds||0) - (b.createdAt?.seconds||0));
    novels.forEach(novel => {
      const card = document.createElement('div');
      card.className = 'up-novel-card';
      card.dataset.id = novel.id;
      const isGuest = currentRole === 'guest';
      card.innerHTML = `
        <div class="up-novel-name" title="${esc(novel.name||'')}">${esc(novel.name||'Untitled')}</div>
        <a class="up-novel-url" href="${esc(novel.url||'#')}" target="_blank" rel="noopener">${esc(novel.url||'—')}</a>
        <div class="up-novel-stats">
          <div class="up-novel-stat">
            <div class="up-novel-stat-label">CH. EXTRACTED</div>
            <input class="up-stat-input" type="number" min="0" value="${novel.extracted||0}" data-field="extracted" ${isGuest?'readonly':''} />
          </div>
          <div class="up-novel-stat">
            <div class="up-novel-stat-label">CH. PRINTED</div>
            <input class="up-stat-input" type="number" min="0" value="${novel.printed||0}" data-field="printed" ${isGuest?'readonly':''} />
          </div>
        </div>
        ${isGuest ? '' : `<div class="up-novel-actions">
          <button class="up-novel-save-btn">💾 Save</button>
          <button class="up-novel-del-btn">🗑</button>
        </div>`}
      `;
      if (!isGuest) {
        card.querySelector('.up-novel-save-btn').addEventListener('click', async () => {
          const extracted = parseInt(card.querySelector('[data-field="extracted"]').value)||0;
          const printed   = parseInt(card.querySelector('[data-field="printed"]').value)||0;
          try {
            await F.updateDoc(F.doc(db,'users',currentUser.uid,'novels',novel.id), { extracted, printed, updatedAt: F.serverTimestamp() });
            const btn = card.querySelector('.up-novel-save-btn');
            btn.textContent = '✓ Saved!';
            setTimeout(() => { btn.textContent = '💾 Save'; }, 1800);
          } catch(e) { alert('Save failed: '+e.message); }
        });
        card.querySelector('.up-novel-del-btn').addEventListener('click', async () => {
          if (!confirm(`Delete "${novel.name}"?`)) return;
          try {
            await F.deleteDoc(F.doc(db,'users',currentUser.uid,'novels',novel.id));
            card.remove();
            if (!upNovelsList.querySelector('.up-novel-card')) {
              upNovelsEmpty.style.display = 'block';
              upNovelsList.appendChild(upNovelsEmpty);
            }
          } catch(e) { alert('Delete failed: '+e.message); }
        });
      }
      upNovelsList.appendChild(card);
    });
  }

  upAddNovelBtn.addEventListener('click', () => {
    upAddNovelForm.style.display = upAddNovelForm.style.display === 'none' ? 'block' : 'none';
  });
  upCancelNovelBtn.addEventListener('click', () => {
    upAddNovelForm.style.display = 'none';
    ['upNewNovelName','upNewNovelUrl','upNewNovelExtracted','upNewNovelPrinted'].forEach(id => {
      document.getElementById(id).value = '';
    });
  });
  upSaveNovelBtn.addEventListener('click', async () => {
    const name      = document.getElementById('upNewNovelName').value.trim();
    const url       = document.getElementById('upNewNovelUrl').value.trim();
    const extracted = parseInt(document.getElementById('upNewNovelExtracted').value)||0;
    const printed   = parseInt(document.getElementById('upNewNovelPrinted').value)||0;
    if (!name) { alert('Novel name is required.'); return; }
    try {
      upSaveNovelBtn.disabled = true; upSaveNovelBtn.textContent = 'Saving…';
      await F.addDoc(F.collection(db,'users',currentUser.uid,'novels'), {
        name, url, extracted, printed, createdAt: F.serverTimestamp(), updatedAt: F.serverTimestamp()
      });
      await loadNovels();
      upCancelNovelBtn.click();
    } catch(e) { alert('Add failed: '+e.message); }
    finally { upSaveNovelBtn.disabled = false; upSaveNovelBtn.textContent = '💾 Save'; }
  });

  /* ──────────────────────────────────────────────────────────
     SETTINGS — Profile
  ────────────────────────────────────────────────────────── */
  upSaveProfileBtn.addEventListener('click', async () => {
    if (!currentUser || currentRole === 'guest') return;
    const displayName = upSettingName.value.trim();
    const username    = upSettingUsername.value.trim().replace(/^@/,'');
    try {
      upSaveProfileBtn.disabled = true;
      await F.updateDoc(F.doc(db,'users',currentUser.uid), { displayName, username, updatedAt: F.serverTimestamp() });
      currentUserData.displayName = displayName;
      currentUserData.username    = username;
      const name = displayName || username || currentUser.email.split('@')[0];
      upDisplayName.textContent  = name;
      userAvatarBtn.textContent  = (name[0]||'?').toUpperCase();
      showMsg(upSettingsMsg, '✓ Profile saved!', 'success');
    } catch(e) { showMsg(upSettingsMsg, '✗ '+e.message, 'error'); }
    finally { upSaveProfileBtn.disabled = false; }
  });

  /* ── Settings — Change Password ── */
  upChangePassBtn.addEventListener('click', async () => {
    if (!currentUser || currentRole === 'guest') return;
    const current = upCurrentPass.value;
    const newP    = upNewPass.value;
    const confirm = upConfirmPass.value;
    if (!current)           { showMsg(upSettingsMsg,'Enter your current password.','error'); return; }
    if (newP.length < 8)    { showMsg(upSettingsMsg,'New password must be ≥ 8 characters.','error'); return; }
    if (newP !== confirm)   { showMsg(upSettingsMsg,"New passwords don't match.",'error'); return; }
    try {
      upChangePassBtn.disabled = true;
      const cred = F.EmailAuthProvider.credential(currentUser.email, current);
      await F.reauthenticateWithCredential(currentUser, cred);
      await F.updatePassword(currentUser, newP);
      upCurrentPass.value = ''; upNewPass.value = ''; upConfirmPass.value = '';
      showMsg(upSettingsMsg, '✓ Password changed!', 'success');
    } catch(e) {
      const m = { 'auth/wrong-password':'Current password incorrect.','auth/invalid-credential':'Current password incorrect.' };
      showMsg(upSettingsMsg, '✗ '+(m[e.code]||e.message), 'error');
    } finally { upChangePassBtn.disabled = false; }
  });

  /* ──────────────────────────────────────────────────────────
     ADMIN — Password toggle
  ────────────────────────────────────────────────────────── */
  if (adminPassToggle) {
    adminPassToggle.addEventListener('click', () => {
      const show = adminNewPass.type === 'password';
      adminNewPass.type = show ? 'text' : 'password';
      adminPassToggle.textContent = show ? '🙈' : '👁';
    });
  }

  /* ──────────────────────────────────────────────────────────
     ADMIN — Create User
     Uses a secondary app instance to avoid signing out the admin
  ────────────────────────────────────────────────────────── */
  if (adminCreateUserBtn) {
    adminCreateUserBtn.addEventListener('click', async () => {
      if (currentRole !== 'admin') return;
      const name  = adminNewName.value.trim();
      const uname = adminNewUsername.value.trim().replace(/^@/,'');
      const email = adminNewEmail.value.trim();
      const pass  = adminNewPass.value;
      const role  = adminNewRole.value;

      if (!email) { showMsg(upCreateUserMsg,'Email is required.','error'); return; }
      if (pass.length < 8) { showMsg(upCreateUserMsg,'Password must be ≥ 8 characters.','error'); return; }

      adminCreateUserBtn.disabled = true;
      adminCreateUserBtn.textContent = 'Creating…';

      try {
        // Create via secondary Firebase Auth app so admin stays logged in
        const { initializeApp, getApp, deleteApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
        const { getAuth: _ga, createUserWithEmailAndPassword: _cu } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');

        let secondaryApp;
        try { secondaryApp = getApp('secondary'); } catch {
          secondaryApp = initializeApp(window._fbAuth.app.options, 'secondary');
        }
        const secondaryAuth = _ga(secondaryApp);
        const cred = await _cu(secondaryAuth, email, pass);
        const newUid = cred.user.uid;
        await secondaryAuth.signOut();

        // Write profile to Firestore
        await F.setDoc(F.doc(db,'users',newUid), {
          displayName: name, username: uname, email,
          role, status: 'active', createdAt: F.serverTimestamp()
        });

        showMsg(upCreateUserMsg, `✓ User "${email}" created as ${role}!`, 'success');
        adminNewName.value = ''; adminNewUsername.value = '';
        adminNewEmail.value = ''; adminNewPass.value = '';
        adminNewRole.value = 'normal';
        loadAdminUsers();
      } catch(e) {
        const m = {
          'auth/email-already-in-use': 'That email is already registered.',
          'auth/invalid-email':        'Invalid email address.',
          'auth/weak-password':        'Password is too weak.',
        };
        showMsg(upCreateUserMsg, '✗ '+(m[e.code]||e.message), 'error');
      } finally {
        adminCreateUserBtn.disabled = false;
        adminCreateUserBtn.textContent = '＋ Create User';
      }
    });
  }

  /* ──────────────────────────────────────────────────────────
     ADMIN — Load & Render User List
  ────────────────────────────────────────────────────────── */
  async function loadAdminUsers() {
    if (currentRole !== 'admin' || !adminUsersList) return;
    adminUsersList.innerHTML = '<div style="font-family:var(--mono);font-size:10px;color:var(--muted);text-align:center;padding:16px 0;">Loading…</div>';
    try {
      const snap = await F.getDocs(F.collection(db, 'users'));
      const users = [];
      snap.forEach(d => users.push({ uid: d.id, ...d.data() }));
      users.sort((a,b) => (a.createdAt?.seconds||0) - (b.createdAt?.seconds||0));
      renderAdminUsers(users);
    } catch(e) {
      adminUsersList.innerHTML = `<div style="color:var(--error);font-family:var(--mono);font-size:10px;padding:10px;">Error: ${esc(e.message)}</div>`;
    }
  }

  function renderAdminUsers(users) {
    adminUsersList.innerHTML = '';
    if (users.length === 0) {
      adminUsersList.innerHTML = '<div style="font-family:var(--mono);font-size:10px;color:var(--muted);text-align:center;padding:16px 0;">No users found.</div>';
      return;
    }

    users.forEach(u => {
      const isSelf   = u.uid === currentUser.uid;
      const rs       = ROLE_STYLES[u.role] || ROLE_STYLES.guest;
      const statusColor = u.status === 'active' ? 'var(--success)' : u.status === 'suspended' ? 'var(--accent4)' : 'var(--error)';

      const card = document.createElement('div');
      card.className = 'admin-user-card';
      card.innerHTML = `
        <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;">
          <div style="width:34px;height:34px;border-radius:50%;background:${rs.bg};border:1.5px solid ${rs.border};
               display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-weight:700;
               font-size:14px;color:${rs.color};flex-shrink:0;">
            ${esc((u.displayName||u.email||'?')[0]).toUpperCase()}
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              ${esc(u.displayName || u.username || '(no name)')}
              ${isSelf ? '<span style="font-family:var(--mono);font-size:9px;color:var(--muted);margin-left:5px;">(you)</span>' : ''}
            </div>
            <div style="font-family:var(--mono);font-size:10px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(u.email||'')}</div>
            ${u.username ? `<div style="font-family:var(--mono);font-size:9px;color:var(--accent2);">@${esc(u.username)}</div>` : ''}
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;">
            <span style="font-family:var(--mono);font-size:9px;padding:2px 7px;border-radius:3px;
              background:${rs.bg};border:1px solid ${rs.border};color:${rs.color};">${esc(u.role||'normal').toUpperCase()}</span>
            <span style="font-family:var(--mono);font-size:9px;color:${statusColor};">● ${esc(u.status||'active')}</span>
          </div>
        </div>

        ${isSelf ? '' : `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px;">
          <div>
            <div style="font-family:var(--mono);font-size:8px;color:var(--muted);letter-spacing:1px;margin-bottom:3px;">CHANGE ROLE</div>
            <select class="admin-role-sel up-form-input" style="padding:4px 6px;font-size:10px;width:100%;">
              <option value="admin"  ${u.role==='admin' ?'selected':''}>Admin</option>
              <option value="normal" ${u.role==='normal'?'selected':''}>Normal</option>
              <option value="guest"  ${u.role==='guest' ?'selected':''}>Guest</option>
            </select>
          </div>
          <div>
            <div style="font-family:var(--mono);font-size:8px;color:var(--muted);letter-spacing:1px;margin-bottom:3px;">STATUS</div>
            <select class="admin-status-sel up-form-input" style="padding:4px 6px;font-size:10px;width:100%;">
              <option value="active"    ${u.status==='active'   ?'selected':''}>Active</option>
              <option value="suspended" ${u.status==='suspended'?'selected':''}>Suspended</option>
              <option value="blocked"   ${u.status==='blocked'  ?'selected':''}>Blocked</option>
            </select>
          </div>
        </div>
        <div style="display:flex;gap:5px;flex-wrap:wrap;">
          <button class="admin-save-btn up-action-btn save" style="flex:1;padding:5px 8px;font-size:10px;">💾 Save</button>
          <button class="admin-del-btn up-action-btn cancel" style="padding:5px 10px;font-size:10px;border-color:rgba(255,69,96,.3);color:var(--error);">🗑 Delete</button>
        </div>`}
      `;

      if (!isSelf) {
        // Save role + status
        card.querySelector('.admin-save-btn').addEventListener('click', async () => {
          const role   = card.querySelector('.admin-role-sel').value;
          const status = card.querySelector('.admin-status-sel').value;
          try {
            await F.updateDoc(F.doc(db,'users',u.uid), { role, status, updatedAt: F.serverTimestamp() });
            const btn = card.querySelector('.admin-save-btn');
            btn.textContent = '✓ Saved!';
            setTimeout(() => { btn.textContent = '💾 Save'; loadAdminUsers(); }, 1500);
          } catch(e) { alert('Save failed: '+e.message); }
        });

        // Delete user (Firestore doc only — Firebase Auth deletion requires Admin SDK)
        card.querySelector('.admin-del-btn').addEventListener('click', async () => {
          if (!confirm(`Delete user "${u.email}"? This removes their Firestore data. Their Firebase Auth account will be blocked via status.`)) return;
          try {
            // Block auth access + mark deleted
            await F.updateDoc(F.doc(db,'users',u.uid), { status: 'blocked', deletedAt: F.serverTimestamp() });
            card.remove();
          } catch(e) { alert('Delete failed: '+e.message); }
        });
      }

      adminUsersList.appendChild(card);
    });
  }


  /* ══════════════════════════════════════════════════════════════════════
     TASK REPORTS — user side
  ════════════════════════════════════════════════════════════════════════ */

  /* ── helpers ── */
  function fmtDuration(ms) {
    const s = Math.floor(ms/1000);
    if (s < 60)   return s + 's';
    if (s < 3600) return Math.floor(s/60) + 'm ' + (s%60) + 's';
    const h = Math.floor(s/3600), m = Math.floor((s%3600)/60);
    return h + 'h ' + m + 'm';
  }
  function fmtDateTime(ms) {
    const d = new Date(ms);
    return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) +
           ' ' + d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
  }

  /* Append a line to the active task activity log */
  function taskLog(msg) {
    if (!activeTask) return;
    const ts = new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
    activeTask.activityLog.push('['+ts+'] '+msg);
    if (upTaskActivityLog) {
      upTaskActivityLog.innerHTML = activeTask.activityLog.map(l => esc(l)).join('<br>');
      upTaskActivityLog.scrollTop = upTaskActivityLog.scrollHeight;
    }
  }

  /* Start elapsed timer for active task banner */
  function startTaskTimer() {
    clearInterval(_taskTimerInt);
    _taskTimerInt = setInterval(() => {
      if (!activeTask || !upTaskElapsed) return;
      const ms = Date.now() - activeTask.startTime;
      const s  = Math.floor(ms/1000), m = Math.floor(s/60), h = Math.floor(m/60);
      upTaskElapsed.textContent = h > 0 ? h+'h '+('0'+m%60).slice(-2)+'m' : ('0'+m).slice(-2)+':'+('0'+(s%60)).slice(-2);
    }, 1000);
  }

  function showActiveBanner() {
    if (!upActiveTaskBanner || !activeTask) return;
    upActiveTaskName.textContent = activeTask.name;
    upActiveTaskBanner.style.display = 'block';
    upNewTaskForm.style.display      = 'none';
    startTaskTimer();
  }
  function hideActiveBanner() {
    if (upActiveTaskBanner) upActiveTaskBanner.style.display = 'none';
    clearInterval(_taskTimerInt);
  }

  /* ── Start new task ── */
  if (upNewReportBtn) upNewReportBtn.addEventListener('click', () => {
    if (activeTask) { alert('A task is already running. Finish or discard it first.'); return; }
    upNewTaskForm.style.display = upNewTaskForm.style.display === 'none' ? 'block' : 'none';
  });
  if (upCancelNewTaskBtn) upCancelNewTaskBtn.addEventListener('click', () => {
    upNewTaskForm.style.display = 'none';
    upTaskNameInput.value = ''; upTaskDescInput.value = '';
  });
  if (upStartTaskBtn) upStartTaskBtn.addEventListener('click', () => {
    const name = upTaskNameInput.value.trim();
    if (!name) { alert('Enter a task name.'); return; }
    activeTask = {
      name, desc: upTaskDescInput.value.trim(),
      startTime: Date.now(), activityLog: []
    };
    taskLog('Task started: ' + name);
    upTaskNameInput.value = ''; upTaskDescInput.value = '';
    upNewTaskForm.style.display = 'none';
    showActiveBanner();
  });

  /* ── Discard task ── */
  if (upCancelTaskBtn) upCancelTaskBtn.addEventListener('click', () => {
    if (!confirm('Discard this task? All recorded activity will be lost.')) return;
    activeTask = null;
    hideActiveBanner();
    upTaskNotes.value = '';
  });

  /* ── Finish task ── */
  if (upFinishTaskBtn) upFinishTaskBtn.addEventListener('click', () => {
    if (!activeTask) return;
    taskLog('Task finished.');
    const finished = {
      ...activeTask,
      endTime:  Date.now(),
      duration: Date.now() - activeTask.startTime,
      notes:    upTaskNotes.value.trim(),
      reported: false,
    };
    completedTasks.unshift(finished);
    activeTask = null;
    hideActiveBanner();
    upTaskNotes.value = '';
    renderCompletedTasks();
  });

  /* ── Render completed (unreported) tasks ── */
  function renderCompletedTasks() {
    if (!upCompletedTasksList) return;
    upCompletedTasksList.innerHTML = '';
    const unreported = completedTasks.filter(t => !t.reported);
    upCompletedTasksSection.style.display = unreported.length ? 'block' : 'none';
    unreported.forEach((t, idx) => {
      const card = document.createElement('div');
      card.className = 'up-task-card';
      card.innerHTML = `
        <div class="up-task-card-name">${esc(t.name)}</div>
        <div class="up-task-card-meta">
          <span>&#x23F0; ${fmtDateTime(t.startTime)}</span>
          <span>&#x23F1; ${fmtDuration(t.duration)}</span>
          ${t.desc ? `<span>${esc(t.desc)}</span>` : ''}
        </div>
        ${t.activityLog.length ? `<div class="up-task-card-log">${t.activityLog.map(l=>esc(l)).join('<br>')}</div>` : ''}
        ${t.notes ? `<div style="font-family:var(--mono);font-size:10px;color:var(--text);background:var(--surface3);border:1px solid var(--border);border-radius:5px;padding:5px 8px;margin-bottom:7px;white-space:pre-wrap;">${esc(t.notes)}</div>` : ''}
        <div class="up-task-card-actions">
          <button class="up-action-btn save task-report-btn" style="flex:1;padding:5px 8px;font-size:10px;">&#x1F4E4; Submit Report</button>
          <button class="up-action-btn cancel task-discard-btn" style="padding:5px 10px;font-size:10px;">&#x1F5D1;</button>
        </div>
      `;
      card.querySelector('.task-report-btn').addEventListener('click', () => submitReport(t, card));
      card.querySelector('.task-discard-btn').addEventListener('click', () => {
        if (!confirm('Delete this completed task?')) return;
        completedTasks = completedTasks.filter(x => x !== t);
        renderCompletedTasks();
      });
      upCompletedTasksList.appendChild(card);
    });
  }

  /* ── Submit report to Firestore ── */
  async function submitReport(task, card) {
    if (currentRole === 'guest' || !currentUser || currentUser.isGuest) {
      alert('Please sign in to submit reports.'); return;
    }
    const btn = card.querySelector('.task-report-btn');
    btn.disabled = true; btn.textContent = 'Submitting…';
    try {
      const userName  = currentUserData.displayName || currentUserData.username || currentUser.email;
      const userEmail = currentUser.email || '';
      await F.addDoc(F.collection(db, 'reports'), {
        uid:          currentUser.uid,
        userEmail,
        userName,
        taskName:     task.name,
        taskDesc:     task.desc || '',
        startTime:    task.startTime,
        endTime:      task.endTime,
        durationMs:   task.duration,
        activityLog:  task.activityLog,
        notes:        task.notes || '',
        submittedAt:  F.serverTimestamp(),
      });
      task.reported = true;
      btn.textContent = '✓ Reported!';
      setTimeout(() => { renderCompletedTasks(); loadMyReports(); }, 1200);
    } catch(e) {
      alert('Submit failed: ' + e.message);
      btn.disabled = false; btn.textContent = '📤 Submit Report';
    }
  }

  /* ── Load & render user's own submitted reports ── */
  async function loadMyReports() {
    if (!upMyReportsList || currentRole === 'guest') return;
    upMyReportsList.innerHTML = '<div style="font-family:var(--mono);font-size:10px;color:var(--muted);text-align:center;padding:12px 0;">Loading…</div>';
    try {
      const q    = F.query(F.collection(db,'reports'), F.where('uid','==',currentUser.uid), F.orderBy('submittedAt','desc'));
      const snap = await F.getDocs(q);
      const reports = [];
      snap.forEach(d => reports.push({ id: d.id, ...d.data() }));
      renderMyReports(reports);
    } catch(e) {
      upMyReportsList.innerHTML = `<div style="font-family:var(--mono);font-size:10px;color:var(--error);padding:10px;">Error: ${esc(e.message)}</div>`;
    }
  }

  function renderMyReports(reports) {
    upMyReportsList.innerHTML = '';
    if (!reports.length) {
      upMyReportsList.appendChild(upMyReportsEmpty);
      upMyReportsEmpty.style.display = 'block';
      return;
    }
    upMyReportsEmpty.style.display = 'none';
    const STATUS_COLORS = {
      pending:  { color: '#6b7394', bg: 'rgba(107,115,148,.15)', border: 'rgba(107,115,148,.3)' },
      reviewed: { color: '#00e5ff', bg: 'rgba(0,229,255,.12)',   border: 'rgba(0,229,255,.3)'  },
      approved: { color: '#10b981', bg: 'rgba(16,185,129,.12)',  border: 'rgba(16,185,129,.3)' },
      flagged:  { color: '#f59e0b', bg: 'rgba(245,158,11,.12)', border: 'rgba(245,158,11,.3)' },
      rejected: { color: '#ff4560', bg: 'rgba(255,69,96,.12)',   border: 'rgba(255,69,96,.3)'  },
    };
    reports.forEach(r => {
      const card = document.createElement('div');
      card.className = 'up-report-card';
      const durMs   = r.durationMs || (r.endTime - r.startTime) || 0;
      const subDate = r.submittedAt?.seconds ? fmtDateTime(r.submittedAt.seconds*1000) : '—';
      const st      = r.adminStatus || 'pending';
      const sc      = STATUS_COLORS[st] || STATUS_COLORS.pending;
      const stLabel = { pending:'Pending', reviewed:'Reviewed', approved:'Approved', flagged:'⚑ Flagged', rejected:'Rejected' }[st] || st;
      const commentsHtml = (r.adminComments && r.adminComments.length)
        ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border);">
             <div style="font-family:var(--mono);font-size:9px;color:var(--muted);letter-spacing:1px;margin-bottom:5px;">ADMIN FEEDBACK</div>
             ${r.adminComments.map(c => `
               <div style="background:rgba(0,229,255,.04);border:1px solid rgba(0,229,255,.12);border-radius:5px;padding:6px 9px;margin-bottom:4px;">
                 <div style="font-family:var(--mono);font-size:9px;color:var(--accent4);margin-bottom:3px;">👑 ${esc(c.by)} · ${fmtDateTime(c.at)}</div>
                 <div style="font-family:var(--mono);font-size:10px;color:var(--text);white-space:pre-wrap;">${esc(c.text)}</div>
               </div>`).join('')}
           </div>`
        : '';
      card.innerHTML = `
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px;">
          <div class="up-report-card-name">${esc(r.taskName)}</div>
          <span style="font-family:var(--mono);font-size:9px;letter-spacing:.5px;padding:2px 8px;border-radius:3px;border:1px solid ${sc.border};color:${sc.color};background:${sc.bg};white-space:nowrap;flex-shrink:0;">${stLabel}</span>
        </div>
        <div class="up-report-card-meta">
          <span>&#x1F4C5; ${fmtDateTime(r.startTime)}</span>
          <span>&#x23F1; ${fmtDuration(durMs)}</span>
          <span>&#x1F4E4; ${subDate}</span>
        </div>
        ${r.notes ? `<div class="up-report-card-notes">${esc(r.notes)}</div>` : ''}
        ${r.activityLog && r.activityLog.length ? `
          <details style="margin-top:6px;">
            <summary style="font-family:var(--mono);font-size:9px;color:var(--muted);cursor:pointer;letter-spacing:1px;">ACTIVITY LOG (${r.activityLog.length} entries)</summary>
            <div class="up-task-card-log" style="margin-top:4px;">${r.activityLog.map(l=>esc(l)).join('<br>')}</div>
          </details>` : ''}
        ${commentsHtml}
      `;
      upMyReportsList.appendChild(card);
    });
  }

  /* ── Auto-log key user actions into the active task ── */
  // Hook into existing extract/bulk events via a global tap point
  window._taskLog = taskLog;

  /* ══════════════════════════════════════════════════════════════════════
     TASK REPORTS — admin side
  ════════════════════════════════════════════════════════════════════════ */
  let _allAdminReports = [];

  async function loadAdminReports() {
    if (currentRole !== 'admin' || !adminReportsList) return;
    adminReportsList.innerHTML = '<div style="font-family:var(--mono);font-size:10px;color:var(--muted);text-align:center;padding:16px 0;">Loading…</div>';
    try {
      const q    = F.query(F.collection(db,'reports'), F.orderBy('submittedAt','desc'));
      const snap = await F.getDocs(q);
      _allAdminReports = [];
      snap.forEach(d => _allAdminReports.push({ id: d.id, ...d.data() }));
      renderAdminReports(_allAdminReports);
    } catch(e) {
      adminReportsList.innerHTML = `<div style="font-family:var(--mono);font-size:10px;color:var(--error);padding:10px;">Error: ${esc(e.message)}</div>`;
    }
  }

  /* ── Admin report status config ── */
  const REPORT_STATUSES = {
    pending:    { label: 'Pending',    color: '#6b7394', bg: 'rgba(107,115,148,.15)', border: 'rgba(107,115,148,.3)' },
    reviewed:   { label: 'Reviewed',   color: '#00e5ff', bg: 'rgba(0,229,255,.12)',   border: 'rgba(0,229,255,.3)'  },
    approved:   { label: 'Approved',   color: '#10b981', bg: 'rgba(16,185,129,.12)',  border: 'rgba(16,185,129,.3)' },
    flagged:    { label: '⚑ Flagged',  color: '#f59e0b', bg: 'rgba(245,158,11,.12)', border: 'rgba(245,158,11,.3)' },
    rejected:   { label: 'Rejected',   color: '#ff4560', bg: 'rgba(255,69,96,.12)',   border: 'rgba(255,69,96,.3)'  },
  };

  function statusBadgeHtml(status) {
    const s = REPORT_STATUSES[status] || REPORT_STATUSES.pending;
    return `<span class="admin-report-status-badge" style="color:${s.color};background:${s.bg};border-color:${s.border};">${s.label}</span>`;
  }

  async function setReportStatus(reportId, newStatus, statusEl) {
    try {
      await F.updateDoc(F.doc(db, 'reports', reportId), {
        adminStatus: newStatus,
        adminStatusAt: F.serverTimestamp(),
        adminStatusBy: currentUserData.displayName || currentUser.email,
      });
      // Update local cache
      const r = _allAdminReports.find(x => x.id === reportId);
      if (r) r.adminStatus = newStatus;
      if (statusEl) statusEl.outerHTML = statusBadgeHtml(newStatus);
    } catch(e) {
      alert('Status update failed: ' + e.message);
    }
  }

  async function postAdminComment(reportId, text, commentsWrap) {
    if (!text.trim()) return;
    const comment = {
      text: text.trim(),
      by:   currentUserData.displayName || currentUser.email,
      at:   Date.now(),
    };
    try {
      await F.updateDoc(F.doc(db, 'reports', reportId), {
        adminComments: F.arrayUnion(comment),
      });
      // Update local cache
      const r = _allAdminReports.find(x => x.id === reportId);
      if (r) { r.adminComments = r.adminComments || []; r.adminComments.push(comment); }
      appendCommentEl(commentsWrap, comment);
    } catch(e) {
      alert('Comment failed: ' + e.message);
    }
  }

  function appendCommentEl(wrap, c) {
    const el = document.createElement('div');
    el.className = 'admin-report-comment';
    el.innerHTML = `
      <div class="admin-report-comment-meta">
        <span class="admin-report-comment-by">👑 ${esc(c.by)}</span>
        <span class="admin-report-comment-time">${fmtDateTime(c.at)}</span>
      </div>
      <div class="admin-report-comment-text">${esc(c.text)}</div>
    `;
    wrap.appendChild(el);
  }

  function renderAdminReports(reports) {
    if (!adminReportsList) return;
    adminReportsList.innerHTML = '';
    if (!reports.length) {
      adminReportsList.innerHTML = '<div style="font-family:var(--mono);font-size:10px;color:var(--muted);text-align:center;padding:16px 0;">No reports found.</div>';
      return;
    }
    reports.forEach(r => {
      const card = document.createElement('div');
      card.className = 'admin-report-card';
      const durMs   = r.durationMs || (r.endTime - r.startTime) || 0;
      const subDate = r.submittedAt?.seconds ? fmtDateTime(r.submittedAt.seconds*1000) : '—';
      const initial = (r.userName || r.userEmail || '?')[0].toUpperCase();
      const curStatus = r.adminStatus || 'pending';

      card.innerHTML = `
        <div class="admin-report-card-header">
          <div class="admin-report-card-user">${esc(initial)}</div>
          <div class="admin-report-card-body">
            <div class="admin-report-card-task">${esc(r.taskName)}</div>
            <div class="admin-report-card-who">&#x1F464; ${esc(r.userName||'')} &nbsp;·&nbsp; <span style="color:var(--muted);">${esc(r.userEmail||'')}</span></div>
          </div>
          ${statusBadgeHtml(curStatus)}
        </div>
        <div class="admin-report-card-meta">
          <span>&#x1F4C5; Started: ${fmtDateTime(r.startTime)}</span>
          <span>&#x23F1; Duration: ${fmtDuration(durMs)}</span>
          <span>&#x1F4E4; Submitted: ${subDate}</span>
          ${r.taskDesc ? `<span>&#x1F4DD; ${esc(r.taskDesc)}</span>` : ''}
        </div>
        ${r.notes ? `
          <div style="font-family:var(--mono);font-size:9px;color:var(--muted);letter-spacing:1px;margin-bottom:3px;">NOTES</div>
          <div class="admin-report-card-notes">${esc(r.notes)}</div>` : ''}
        ${r.activityLog && r.activityLog.length ? `
          <details style="margin-top:7px;">
            <summary style="font-family:var(--mono);font-size:9px;color:var(--muted);cursor:pointer;letter-spacing:1px;">ACTIVITY LOG (${r.activityLog.length} entries)</summary>
            <div class="admin-report-card-log" style="margin-top:5px;">${r.activityLog.map(l=>esc(l)).join('<br>')}</div>
          </details>` : ''}

        <!-- ── Admin actions ── -->
        <div class="admin-report-actions">
          <div class="admin-report-actions-label">SET STATUS</div>
          <div class="admin-report-status-btns">
            ${Object.entries(REPORT_STATUSES).map(([key, s]) =>
              `<button class="admin-status-btn${curStatus===key?' active':''}" data-status="${key}"
                style="color:${s.color};border-color:${s.border};${curStatus===key?'background:'+s.bg+';':''}"
              >${s.label}</button>`
            ).join('')}
          </div>
        </div>

        <!-- ── Admin comments ── -->
        <div class="admin-report-comments-section">
          <div class="admin-report-actions-label">ADMIN COMMENTS</div>
          <div class="admin-report-comments-list"></div>
          <div class="admin-report-comment-compose">
            <textarea class="admin-report-comment-input" placeholder="Add a comment or note…" rows="2"></textarea>
            <div style="display:flex;gap:6px;margin-top:6px;">
              <button class="up-action-btn save admin-comment-post-btn" style="flex:1;padding:5px 8px;font-size:10px;">💬 Post Comment</button>
              <button class="up-action-btn cancel admin-report-delete-btn" style="padding:5px 10px;font-size:10px;border-color:rgba(255,69,96,.3);color:var(--error);">🗑 Delete Report</button>
            </div>
          </div>
        </div>
      `;

      // Populate existing comments
      const commentsWrap = card.querySelector('.admin-report-comments-list');
      if (r.adminComments && r.adminComments.length) {
        r.adminComments.forEach(c => appendCommentEl(commentsWrap, c));
      }

      // Status buttons
      const statusBadge = card.querySelector('.admin-report-status-badge');
      card.querySelectorAll('.admin-status-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const newStatus = btn.dataset.status;
          card.querySelectorAll('.admin-status-btn').forEach(b => {
            const s = REPORT_STATUSES[b.dataset.status];
            b.classList.remove('active');
            b.style.background = '';
          });
          btn.classList.add('active');
          btn.style.background = REPORT_STATUSES[newStatus].bg;
          await setReportStatus(r.id, newStatus, card.querySelector('.admin-report-status-badge'));
        });
      });

      // Post comment
      const postBtn   = card.querySelector('.admin-comment-post-btn');
      const commentTx = card.querySelector('.admin-report-comment-input');
      postBtn.addEventListener('click', async () => {
        if (!commentTx.value.trim()) return;
        postBtn.disabled = true; postBtn.textContent = 'Posting…';
        await postAdminComment(r.id, commentTx.value, commentsWrap);
        commentTx.value = '';
        postBtn.disabled = false; postBtn.textContent = '💬 Post Comment';
      });

      // Delete report
      card.querySelector('.admin-report-delete-btn').addEventListener('click', async () => {
        if (!confirm(`Delete report "${r.taskName}" by ${r.userName || r.userEmail}?\nThis cannot be undone.`)) return;
        try {
          await F.deleteDoc(F.doc(db, 'reports', r.id));
          _allAdminReports = _allAdminReports.filter(x => x.id !== r.id);
          card.style.transition = 'opacity .25s';
          card.style.opacity = '0';
          setTimeout(() => card.remove(), 260);
        } catch(e) { alert('Delete failed: ' + e.message); }
      });

      adminReportsList.appendChild(card);
    });
  }

  /* Search + sort admin reports */
  function filterAdminReports() {
    const q   = (adminReportSearch ? adminReportSearch.value.toLowerCase() : '');
    const srt = (adminReportSort   ? adminReportSort.value                 : 'newest');
    let list  = _allAdminReports.filter(r =>
      (r.taskName||'').toLowerCase().includes(q) ||
      (r.userName||'').toLowerCase().includes(q) ||
      (r.userEmail||'').toLowerCase().includes(q) ||
      (r.notes||'').toLowerCase().includes(q)
    );
    if (srt === 'oldest') list = [...list].reverse();
    else if (srt === 'duration') list = [...list].sort((a,b) => (b.durationMs||0) - (a.durationMs||0));
    renderAdminReports(list);
  }

  if (adminReportSearch) adminReportSearch.addEventListener('input', filterAdminReports);
  if (adminReportSort)   adminReportSort.addEventListener('change', filterAdminReports);
  if (adminRefreshReportsBtn) adminRefreshReportsBtn.addEventListener('click', loadAdminReports);

  /* ══════════════════════════════════════════════════════════════════════
     GUEST LOGIN — bypass auth, show read-only interface
  ════════════════════════════════════════════════════════════════════════ */
  const guestLoginBtn = document.getElementById('guestLoginBtn');
  if (guestLoginBtn) {
    guestLoginBtn.addEventListener('click', () => {
      currentUser     = { uid: 'guest', email: 'guest@local', isGuest: true };
      currentUserData = { role: 'guest', status: 'active', displayName: 'Guest', username: '' };
      loginScreen.style.display    = 'none';
      userAvatarBtn.style.display  = 'flex';
      upEmail.textContent          = 'guest session';
      upDisplayName.textContent    = 'Guest';
      userAvatarBtn.textContent    = 'G';
      applyRoleUI('guest');
      upSettingName.value          = '';
      upSettingUsername.value      = '';
    });
  }

  /* ══════════════════════════════════════════════════════════════════════
     REGISTER — self-service account creation
  ════════════════════════════════════════════════════════════════════════ */
  const showRegisterBtn = document.getElementById('showRegisterBtn');
  const hideRegisterBtn = document.getElementById('hideRegisterBtn');
  const registerForm    = document.getElementById('registerForm');
  const registerBtn     = document.getElementById('registerBtn');
  const registerSpinner = document.getElementById('registerSpinner');
  const registerError   = document.getElementById('registerError');
  const registerName    = document.getElementById('registerName');
  const registerEmail2  = document.getElementById('registerEmail');
  const registerPass2   = document.getElementById('registerPass');

  function showRegErr(msg) { if (registerError) { registerError.textContent = msg; registerError.style.display = 'block'; } }
  function hideRegErr()    { if (registerError) registerError.style.display = 'none'; }

  if (showRegisterBtn) showRegisterBtn.addEventListener('click', () => {
    if (registerForm) registerForm.style.display = 'block';
    if (showRegisterBtn.parentElement) showRegisterBtn.parentElement.style.display = 'none';
    hideLoginError();
  });
  if (hideRegisterBtn) hideRegisterBtn.addEventListener('click', () => {
    if (registerForm) registerForm.style.display = 'none';
    if (showRegisterBtn && showRegisterBtn.parentElement) showRegisterBtn.parentElement.style.display = 'block';
    hideRegErr();
  });

  if (registerBtn) {
    registerBtn.addEventListener('click', async () => {
      const name  = registerName  ? registerName.value.trim()   : '';
      const email = registerEmail2 ? registerEmail2.value.trim() : '';
      const pass  = registerPass2  ? registerPass2.value         : '';
      hideRegErr();
      if (!email)         { showRegErr('Email is required.'); return; }
      if (pass.length < 8){ showRegErr('Password must be at least 8 characters.'); return; }
      registerBtn.disabled = true;
      if (registerSpinner) registerSpinner.style.display = 'block';
      try {
        const { createUserWithEmailAndPassword: _cuw } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
        const cred   = await _cuw(auth, email, pass);
        const newUid = cred.user.uid;
        const allSnap = await F.getDocs(F.collection(db,'users'));
        const role    = allSnap.empty ? 'admin' : 'normal';
        await F.setDoc(F.doc(db,'users',newUid), {
          displayName: name, username: '', email,
          role, status: 'active', createdAt: F.serverTimestamp()
        });
        // onAuthStateChanged takes over
      } catch(e) {
        const msgs = {
          'auth/email-already-in-use': 'That email is already registered.',
          'auth/invalid-email':        'Invalid email address.',
          'auth/weak-password':        'Password too weak (min 8 chars).',
        };
        showRegErr(msgs[e.code] || 'Registration failed: ' + e.message);
        registerBtn.disabled = false;
        if (registerSpinner) registerSpinner.style.display = 'none';
      }
    });
  }


  if (adminRefreshBtn) adminRefreshBtn.addEventListener('click', loadAdminUsers);

})(); // end initFirebaseUI
