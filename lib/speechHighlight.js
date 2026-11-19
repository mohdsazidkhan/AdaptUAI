'use client';

/**
 * Tracks the words of an answer while it is read aloud. The active word is shown in a fixed
 * overlay so it can be enlarged without changing React's rendered markdown.
 *
 * The spoken text is a cleaned copy of the answer (see toSpeechText), so spoken words are matched to
 * the rendered words in order: each spoken word looks a few words ahead in the answer for the same
 * word; words that were added for speech ("equals", "squared") simply match nothing.
 * - speak-line: the sentence being read (works with every voice)
 * - speak-word: the exact word, when the voice sends word-boundary events
 */
const WORD = /[\p{L}\p{N}\p{M}]+/gu;
const LOOK_AHEAD = 20;

const supported = () => typeof CSS !== 'undefined' && !!CSS.highlights && typeof Highlight !== 'undefined';

// Every word of the rendered answer, in reading order. Code blocks (not spoken) and KaTeX's hidden
// MathML copy are skipped.
function domWords(root) {
  const out = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent.closest('pre, .katex-mathml, button, .sr-only')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let node;
  while ((node = walker.nextNode())) {
    for (const m of node.data.matchAll(WORD)) {
      out.push({ node, start: m.index, end: m.index + m[0].length, w: m[0].toLowerCase() });
    }
  }
  return out;
}

const textRange = (from, to) => {
  const r = new Range();
  r.setStart(from.node, from.start);
  r.setEnd(to.node, to.end);
  return r;
};

export function clearSpeechHighlight() {
  if (!supported()) return;
  CSS.highlights.delete('speak-word');
  CSS.highlights.delete('speak-line');
  document.querySelectorAll('[data-speech-word-overlay]').forEach((el) => el.remove());
  document.querySelectorAll('[data-speech-line-size]').forEach((el) => {
    el.style.fontSize = el.dataset.speechLineSize;
    delete el.dataset.speechLineSize;
  });
}

function showSpokenWord(word) {
  document.querySelectorAll('[data-speech-word-overlay]').forEach((el) => el.remove());
  const range = textRange(word, word);
  const rect = range.getBoundingClientRect();
  const style = getComputedStyle(word.node.parentElement);
  const overlay = document.createElement('span');
  overlay.dataset.speechWordOverlay = 'true';
  overlay.textContent = word.node.data.slice(word.start, word.end);
  Object.assign(overlay.style, {
    position: 'fixed', left: `${rect.left + rect.width / 2}px`, top: `${rect.top + rect.height / 2}px`,
    transform: 'translate(-50%, -50%)', zIndex: '1000', pointerEvents: 'none', whiteSpace: 'nowrap',
    padding: '0.08em 0.2em', borderRadius: '0.2em', background: '#000', color: '#fff',
    fontFamily: style.fontFamily, fontWeight: style.fontWeight, fontStyle: style.fontStyle,
    fontSize: `${parseFloat(style.fontSize)}px`, lineHeight: '1.1',
  });
  document.body.appendChild(overlay);
}

/** Returns { update(progress), clear() } for one answer's rendered container. */
export function createSpeechHighlighter(root) {
  if (!supported() || !root) return { update() {}, clear() {} };

  let words = domWords(root);
  let pos = 0; // next answer word to search from
  let chunkIndex = -1;
  let map = []; // the current chunk's words with the answer word each one matched (dom = -1: none)

  const mapChunk = (text) => {
    map = [...text.matchAll(WORD)].map((m) => {
      const w = m[0].toLowerCase();
      let dom = -1;
      for (let k = pos; k < Math.min(words.length, pos + LOOK_AHEAD); k += 1) {
        if (words[k].w === w) { dom = k; pos = k + 1; break; }
      }
      return { start: m.index, end: m.index + m[0].length, dom };
    });
    const hits = map.filter((m) => m.dom >= 0);
    if (!hits.length) return;
    words[hits[0].dom].node.parentElement?.scrollIntoView({ block: 'center', behavior: 'instant' });
  };

  return {
    update(progress) {
      if (!progress) { clearSpeechHighlight(); return; }
      // The answer re-rendered: read its words again from the top.
      if (words.length && !words[0].node.isConnected) {
        words = domWords(root);
        pos = 0;
        chunkIndex = -1;
      }
      if (progress.chunkIndex !== chunkIndex) {
        chunkIndex = progress.chunkIndex;
        mapChunk(progress.chunk);
      }
      if (progress.charIndex >= 0) {
        const at = map.find((m) => progress.charIndex >= m.start && progress.charIndex < m.end)
          || map.find((m) => m.start >= progress.charIndex);
        if (at && at.dom >= 0) {
          // Keep the currently spoken word visible near the center of the chat viewport.
          words[at.dom].node.parentElement?.scrollIntoView({ block: 'center', behavior: 'instant' });
          showSpokenWord(words[at.dom]);
        }
      }
    },
    clear: clearSpeechHighlight,
  };
}
