# NovelBin

> A multi-part toolkit for reading web novels: a browser-based Chapter Extractor that rips chapters from NovelBin, a standalone TTS reader for playback, a PDF chapter browser, and a GitHub file explorer.

---

## 📁 Project Structure

```
novelbin/
├── index.html           # GitHub Explorer — browse any public GitHub repo
│
├── main/
│   └── index.html       # NovelBin Chapter Extractor (browser app, no install)
│
├── voxen-tts/
│   └── index.html       # VOXEN — Standalone TTS Reader
│
├── pdf/
│   └── index.html       # PDF Chapter Browser
│
└── README.md
```

---

## Part 1 — GitHub Explorer (`index.html`)

A browser-based GitHub repository file explorer. Enter any public GitHub repo URL to browse its file tree, view file contents, and download files — no GitHub account required.

### Features

| Feature | Description |
|---|---|
| **Repo browsing** | Browse any public GitHub repo's file tree with breadcrumb navigation |
| **File viewer** | Open and read file contents in a modal overlay |
| **Sort controls** | Sort files by name or type |
| **Download** | Download individual files directly |
| **File icons** | Type-aware icons for common file extensions |

### Usage

1. Open `index.html` in any modern browser
2. Paste a GitHub repo URL (e.g. `https://github.com/user/repo`) into the input bar
3. Browse folders, click files to view, or download as needed

---

## Part 2 — NovelBin Chapter Extractor (`main/index.html`)

A standalone browser app (no Chrome extension needed) that extracts novel chapters from [novelbin.com](https://novelbin.com). Supports single chapter extraction, bulk scraping, URL-based batch extraction, print formatting, and full history management.

### Tabs

| Tab | Description |
|---|---|
| **📄 Single** | Extract the current chapter from a pasted URL |
| **📚 Bulk** | Auto-scrape from a starting chapter to the latest |
| **🔗 URL Extractor** | Fetch the full chapter list from a novel page; select a range to extract |
| **🖨 Print** | Format extracted text for printing with font size, line height, page break, and two-column controls |
| **🕘 History** | View all past extracts; sub-tabs for Extracts, Bookmarks, and Session Log |

### Features

| Feature | Description |
|---|---|
| **Single extract** | Paste a chapter URL and extract its text instantly |
| **Bulk scrape** | Auto-follows "next chapter" links from a start URL to the latest |
| **Bulk URL Extractor** | Fetches a novel's full chapter list; supports range selection (from/to chapter #), select-all/invert/none, chapter title toggle |
| **Custom URL list** | Paste a list of chapter URLs for batch extraction |
| **Print panel** | Live print preview with adjustable font size, line height, page-break style, and two-column layout toggle |
| **Auto-save history** | Every extract is saved automatically with word count and chapter range |
| **Progress tracking** | Live stats during bulk scraping: %, speed, elapsed time, ETA |
| **Resumable bulk** | Reopening reconnects to an in-progress bulk scrape |
| **Word / char count** | Displayed for all extracted content |
| **Copy & print** | Copy or print extracted text from any panel |

### Usage

#### Single Chapter

1. Open `main/index.html` in Chrome or Edge
2. Go to the **📄 Single** tab
3. Paste a `novelbin.com/b/*/chapter-*` URL and hit **Extract**
4. Text appears in the output — copy or print directly

#### Bulk Scrape

1. Go to the **📚 Bulk** tab
2. Paste the starting chapter URL and hit **🚀 Start Bulk**
3. Scraping runs in a hidden frame; progress updates live
4. Hit **⏹ Stop** at any time; partial results are saved to history

#### URL Extractor

1. Go to the **🔗 URL Extractor** tab
2. Paste the novel's main page URL and click **Fetch Chapters**
3. Select a chapter range (From / To) or use Select All / Invert
4. Click **Send to Bulk** to extract the selected chapters

#### Print

1. Extract any chapter(s) first via Single or Bulk
2. Click **🖨 Print** on the output, or go to the **Print** tab
3. Adjust font size, line height, page-break style, and column layout
4. Click **🖨 Print** to open the browser print dialog

---

## Part 3 — VOXEN TTS Reader (`voxen-tts/index.html`)

A standalone, single-file browser app that reads extracted novel text aloud using the browser's built-in **SpeechSynthesis API** with live word-by-word highlighting.

> **No installation needed.** Just open `voxen-tts/index.html` in any modern browser.

### Features

| Feature | Description |
|---|---|
| **Live word highlighting** | Currently spoken word is highlighted and centred in the viewport |
| **Three-panel layout** | Input · Live Playback · Settings — all visible simultaneously |
| **Resizable panels** | Drag the dividers to resize any column; widths persist in `localStorage` |
| **Sentence navigation** | `◀` / `▶` buttons (or `←` / `→` keys) to jump back/forward by sentence |
| **Double-click to jump** | Double-click any word in Live Playback to restart speech from that word |
| **Speed 0.5× – 10×** | Fine-grained rate control with keyboard `↑` / `↓` shortcuts |
| **Pitch control** | Adjustable pitch slider |
| **Voice selection** | Dropdown lists all voices available in your browser/OS, with language tag display |
| **Format preservation** | Pasted text (paragraphs, line breaks) renders identically in Live Playback |
| **Sticky controls bar** | Play / Pause / Resume / Stop / ◀ / ▶ always visible at the bottom |
| **Settings persist** | Speed, pitch, voice, and panel widths saved to `localStorage` |
| **Chromium bug workaround** | Periodic ping prevents Chrome from silently pausing long reads in background tabs |
| **Progress bar** | Visual reading progress across the full text |
| **Char count display** | Character count shown for loaded text |

### Keyboard Shortcuts

| Key | Action |
|---|---|
| `Space` | Play / Pause / Resume |
| `S` | Stop |
| `←` | Previous sentence |
| `→` | Next sentence |
| `↑` | Speed +0.1× |
| `↓` | Speed −0.1× |
| `dbl-click` | Jump to word |

### Usage

1. Open `voxen-tts/index.html` in Chrome, Edge, Firefox, or Safari
2. Paste or type novel text into the **Input Text** panel on the left
3. Click **Play** (or press `Space`)
4. The centre panel switches to **Live Playback** — each word highlights as it is spoken and stays centred
5. Use **◀ / ▶** or double-click to navigate; adjust speed and voice in the **Settings** panel on the right

---

## Part 4 — PDF Chapter Browser (`pdf/index.html`)

A simple browser for PDF files stored in the `pdf/` folder. Lists all available PDFs with links to open them directly.

---

## Recommended Workflow

```
novelbin.com novel page
        ↓
  URL Extractor (main/index.html)
  (fetch chapter list → select range)
        ↓
  Bulk Extractor
  (auto-scrape selected chapters)
        ↓
  Copy extracted text
        ↓
  VOXEN TTS Reader (voxen-tts/index.html)
  (paste → play)
        ↓
  Print Panel (optional)
  (format → print / save as PDF)
```

---

## Tech Stack

| Component | Tech |
|---|---|
| GitHub Explorer | Vanilla JS, GitHub Contents API |
| Chapter Extractor | Vanilla HTML/CSS/JS, hidden `<iframe>` scraping |
| URL Extractor | Vanilla JS, CORS-proxied fetch of novel chapter list pages |
| Print Panel | Vanilla JS, `window.open` print via formatted HTML |
| TTS Reader | Vanilla JS, `SpeechSynthesis` API, CSS `pre-wrap`, `getBoundingClientRect` scroll centering |
| Fonts | Google Fonts — Syne, DM Mono (all tools) |

---

## Browser Compatibility

| Browser | Extractor (main) | VOXEN TTS |
|---|---|---|
| Chrome 109+ | ✅ Full support | ✅ |
| Edge (Chromium) | ✅ Full support | ✅ |
| Firefox | ✅ | ✅ |
| Safari | ✅ | ✅ (voices differ) |

---

## Development

No build step required — all files are plain HTML, CSS, and JavaScript.

```bash
# Clone
git clone https://github.com/abhimanyughjk/novelbin.git
cd novelbin

# Open any tool directly in browser
open index.html            # GitHub Explorer
open main/index.html       # Chapter Extractor
open voxen-tts/index.html  # TTS Reader
open pdf/index.html        # PDF Browser
```

---

## Changelog

### v6.0.0 (current)
- Removed Chrome Extension dependency — extractor now runs entirely in-browser
- Added **URL Extractor** tab: fetch full chapter lists, select ranges, send to bulk
- Added **Print panel**: live preview with font size, line height, page-break, and two-column controls
- Added **GitHub Explorer** (`index.html`): browse any public repo
- Added **PDF Chapter Browser** (`pdf/index.html`)
- VOXEN: added progress bar, char count display, voice language tag
- VOXEN: improved panel resize persistence

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
