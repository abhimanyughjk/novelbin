// content.js — injected on novelbin chapter pages

function extractChapter() {
  const result = { title: "", content: "", error: null };

  try {
    const titleEl = document.querySelector(".chr-text");
    result.title = titleEl ? titleEl.textContent.trim() : "";

    const contentEl = document.querySelector("#chr-content");
    if (!contentEl) {
      result.error = "Chapter content not found on this page.";
      return result;
    }

    const clone = contentEl.cloneNode(true);
    clone.querySelectorAll("script, style, .pubfuture, [id^='pf-'], hr").forEach(el => el.remove());

    const lines = [];
    clone.querySelectorAll("h4, p").forEach(el => {
      const text = el.textContent.trim();
      if (text.length > 0) lines.push(text);
    });

    result.content = lines.join("\n\n");
    if (!result.content) result.error = "No text content found.";
  } catch (e) {
    result.error = "Extraction failed: " + e.message;
  }

  return result;
}

function getNextUrl() {
  const nextBtn = document.getElementById("next_chap");
  if (!nextBtn) return { nextUrl: null, isLast: true };

  const href = nextBtn.getAttribute("href") || "";
  const isDisabled = nextBtn.hasAttribute("disabled");
  const isNull = href.endsWith("/null") || href === "" || isDisabled;

  return {
    nextUrl: isNull ? null : href,
    isLast: isNull
  };
}

// Guard: only add listener once
if (!window._novelBinListenerAttached) {
  window._novelBinListenerAttached = true;

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extractChapter") {
      sendResponse(extractChapter());
    } else if (request.action === "getNextUrl") {
      sendResponse(getNextUrl());
    }
    return true;
  });
}
