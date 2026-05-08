# NovelBin

> A two-part toolkit for reading web novels: a Chrome Extension that rips chapters from NovelBin, and a standalone browser-based TTS reader for playing them back.

---

## 📁 Project Structure

```
novelbin/
├── extension/               # Chrome Extension (MV3)
│   └── index.html           # Extension popup UI
│
├── voxen-tts/               # VOXEN — Standalone TTS Reader
│   └── index.html           # Single-file app (HTML + CSS + JS)
│
└── README.md
```

---

## Part 1 — NovelBin Chapter Extractor (Chrome Extension)

A Manifest V3 Chrome extension that extracts novel chapters from [novelbin.com](https://novelbin.com), bulk-scrapes from any chapter to the latest, auto-saves history, and keeps your Chrome bookmarks updated with your reading progress.

### Features

| Feature | Description |
|---|---|
| **Single extract** | Grab the current chapter with one click |
| **Bulk scrape** | Auto-follows "next chapter" links until the latest, all in a hidden background tab |
| **Auto-save history** | Every extract (single or bulk) is saved to `chrome.storage.local` automatically |
| **Bookmark auto-update** | After each extract, the matching Chrome bookmark is updated to the latest chapter URL + title |
| **Bookmark log** | Full history of every bookmark update with old/new title and timestamps |
| **Tab-switch safe** | Bulk scraping runs in a hidden tab — you can freely browse elsewhere while it works |
| **Resumable UI** | Reopening the popup reconnects to an in-progress bulk scrape seamlessly |

### Screenshots

> _Popup — Single, Bulk, and History tabs_

```
┌──────────────────────────────────────┐
│  [N]  NovelBin Extractor      v5.0  │
├──────────────────────────────────────┤
│  📄 Current │ 📚 Till Latest │ 🕘 History │
├──────────────────────────────────────┤
│  Chapter: The Demon Prince Arc...    │
│  ──────────────────────────────────  │
│         ⚡ Extract This Chapter      │
└──────────────────────────────────────┘
```

### Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked**
5. Select the `extension/` folder
6. The NovelBin icon will appear in your toolbar

> **Requires Chrome 109+** (Manifest V3 service worker support)

### Usage

#### Single Chapter

1. Navigate to any `novelbin.com/b/*/chapter-*` page
2. Click the extension icon
3. Hit **⚡ Extract This Chapter**
4. Text appears in the output area — copy or read directly

#### Bulk Scrape (Till Latest)

1. Navigate to the chapter you want to **start from**
2. Open the extension → **📚 Till Latest** tab
3. Hit **🚀 Start Bulk**
4. A hidden background tab will scrape every chapter from here to the latest
5. You can switch tabs — progress is shown live when you reopen the popup
6. Hit **⏹ Stop** at any time; partial results are saved to history

#### History

- **📄 Extracts** — all auto-saved single/bulk extracts with word counts, load-back and copy buttons
- **🔖 Bookmark Updates** — a chronological log of every Chrome bookmark that was auto-updated

### How Bookmark Updating Works

When a chapter is extracted, the extension:
1. Parses the chapter URL to get the novel base URL (e.g. `novelbin.com/b/novel-slug`)
2. Walks your entire Chrome bookmark tree looking for any bookmark whose URL starts with that base URL
3. Updates matching bookmarks' URL → latest chapter URL, title → latest chapter title
4. Logs the change (old title → new title) to the Bookmark Updates history tab

### Permissions

| Permission | Reason |
|---|---|
| `activeTab` | Read the current page URL |
| `scripting` | Inject content.js to extract DOM content |
| `tabs` | Create/manage the hidden scraping tab |
| `storage` | Save extract history and bulk state |
| `bookmarks` | Auto-update reading progress bookmarks |
| `clipboardWrite` | Copy extracted text |

### File Reference

| File | Role |
|---|---|
| `manifest.json` | MV3 manifest — permissions, icons, service worker declaration |
| `background.js` | Service worker — orchestrates the bulk scrape loop, manages storage, updates bookmarks |
| `content.js` | Injected into chapter pages — extracts `#chr-content` and the chapter title, finds the next chapter URL |
| `popup.html` | Extension popup — three-tab UI: Current, Till Latest, History |
| `popup.js` | All popup logic — tab switching, single extract, bulk UI, history rendering, bookmark log |

---

## Part 2 — VOXEN TTS Reader

A standalone, single-file browser app that reads extracted novel text aloud using the browser's built-in **SpeechSynthesis API** with live word-by-word highlighting.

> **No installation needed.** Just open `voxen-tts/index.html` in any modern browser.

### Features

| Feature | Description |
|---|---|
| **Live word highlighting** | Currently spoken word is highlighted and centred in the viewport |
| **Three-panel layout** | Input · Live Playback · Settings — all visible simultaneously |
| **Resizable panels** | Drag the dividers to resize any column; widths are persisted in `localStorage` |
| **Sentence navigation** | `◀` / `▶` buttons (or `←` / `→` keys) to jump back/forward by sentence |
| **Double-click to jump** | Double-click any word in Live Playback to restart speech from that word |
| **Speed 0.5× – 10×** | Fine-grained rate control with keyboard `↑` / `↓` shortcuts |
| **Pitch control** | Adjustable pitch slider |
| **Voice selection** | Dropdown lists all voices available in your browser/OS |
| **Format preservation** | Pasted text (paragraphs, line breaks) renders identically in Live Playback |
| **Sticky controls bar** | Play / Pause / Resume / Stop / ◀ / ▶ always visible at the bottom |
| **Settings persist** | Speed, pitch, voice, panel widths saved to `localStorage` |
| **Chromium bug workaround** | Periodic ping prevents Chrome from silently pausing long reads in background tabs |

### Keyboard Shortcuts

| Key | Action |
|---|---|
| `Space` | Play / Pause / Resume |
| `S` | Stop |
| `←` | Previous sentence |
| `→` | Next sentence |
| `↑` | Speed +0.1× |
| `↓` | Speed −0.1× |

### Usage

1. Open `voxen-tts/index.html` in Chrome, Edge, Firefox, or Safari
2. Paste or type novel text into the **Input Text** panel on the left
3. Click **Play** (or press `Space`)
4. The centre panel switches to **Live Playback** — each word highlights as it is spoken and stays centred
5. Use **◀ / ▶** or double-click to navigate; adjust speed in the **Settings** panel on the right

### Workflow with the Extension

```
novelbin.com chapter page
        ↓
  Chrome Extension
  (extract / bulk scrape)
        ↓
  Copy extracted text
        ↓
  VOXEN TTS Reader
  (paste → play)
```

---

## Tech Stack

| Component | Tech |
|---|---|
| Chrome Extension | Manifest V3, Service Worker, `chrome.scripting`, `chrome.bookmarks`, `chrome.storage` |
| Content extraction | Vanilla JS DOM manipulation |
| Popup UI | Vanilla HTML/CSS/JS — no frameworks |
| TTS Reader | Vanilla JS, `SpeechSynthesis` API, CSS `pre-wrap`, `getBoundingClientRect` scroll centering |
| Fonts | Google Fonts (Syne, DM Mono — VOXEN) · Rajdhani, Share Tech Mono (Extension popup) |

---

## Browser Compatibility

| Browser | Extension | VOXEN TTS |
|---|---|---|
| Chrome 109+ | ✅ Full support | ✅ |
| Edge (Chromium) | ✅ Full support | ✅ |
| Firefox | ❌ MV3 not supported | ✅ |
| Safari | ❌ | ✅ (voices differ) |

---

## Development

No build step required — all files are plain HTML, CSS, and JavaScript.

```bash
# Clone
git clone https://github.com/abhimanyughjk/novelbin.git
cd novelbin

# Load extension in Chrome
# → chrome://extensions → Developer mode → Load unpacked → select extension/

# Open TTS reader
open voxen-tts/index.html
# or just drag the file into Chrome
```

---

## Changelog

### v5.0.0
- Background tab bulk scraping (tab-switch safe)
- Auto-save extract history on every completion
- Chrome bookmark auto-update after each extract
- Bookmark update log with full history
- History sub-tabs: Extracts + Bookmark Updates
- VOXEN TTS Reader added as companion tool

---

## License

MIT — free to use, modify, and distribute.

---

> **Disclaimer:** This tool is for personal use only. Respect the terms of service of novelbin.com. Do not use for redistribution of copyrighted content.
