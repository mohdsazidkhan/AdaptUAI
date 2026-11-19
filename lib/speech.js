'use client';

/**
 * Read tutor answers aloud with the browser's own text-to-speech (free, works offline on most phones).
 * - Markdown, LaTeX, code and emoji are turned into plain speakable text first.
 * - Devanagari sentences use a Hindi voice, everything else (English, Hinglish) an Indian English voice.
 * - Text is spoken in short chunks because Chrome silently stops long utterances after ~15 seconds.
 * - One answer speaks at a time; components read which one with useSpeakingId().
 */
import { useSyncExternalStore } from 'react';

const MAX_CHUNK = 200;
const DEVANAGARI = /[ऀ-ॿ]/;

let speakingId = null;
let run = 0;
const listeners = new Set();
// Reading progress for word highlighting: { id, chunkIndex, chunk, charIndex } or null when stopped.
const progressListeners = new Set();
const emitProgress = (p) => progressListeners.forEach((l) => l(p));
export const onSpeechProgress = (l) => {
  progressListeners.add(l);
  return () => progressListeners.delete(l);
};
const setSpeaking = (id) => {
  speakingId = id;
  listeners.forEach((l) => l());
  if (id === null) emitProgress(null);
};
const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

/** The id of the answer being read right now, or null. */
export const useSpeakingId = () => useSyncExternalStore(subscribe, () => speakingId, () => null);

// Simple LaTeX → words, enough for school maths ("a by b", "x squared", "square root of 2").
function mathToWords(m) {
  return String(m)
    .replace(/\\(?:d|t)?frac\{([^{}]+)\}\{([^{}]+)\}/g, ' $1 by $2 ')
    .replace(/\\sqrt\{([^{}]+)\}/g, ' square root of $1 ')
    .replace(/\^\{?2\}?/g, ' squared ')
    .replace(/\^\{?3\}?/g, ' cubed ')
    .replace(/\^\{([^{}]+)\}/g, ' to the power $1 ')
    .replace(/\^(\w)/g, ' to the power $1 ')
    .replace(/\\(?:times|cdot)/g, ' times ')
    .replace(/\\div/g, ' divided by ')
    .replace(/\\pm/g, ' plus or minus ')
    .replace(/\\(?:leq|le)\b/g, ' less than or equal to ')
    .replace(/\\(?:geq|ge)\b/g, ' greater than or equal to ')
    .replace(/\\(?:neq|ne)\b/g, ' not equal to ')
    .replace(/\\(?:approx)\b/g, ' approximately ')
    .replace(/\\(?:rightarrow|to|Rightarrow|implies)\b/g, ' gives ')
    .replace(/\\(?:text|mathrm|mathbf|operatorname)\{([^{}]*)\}/g, ' $1 ')
    .replace(/\\(?:left|right|quad|qquad|,|;|!)/g, ' ')
    .replace(/\\([a-zA-Z]+)/g, ' $1 ')
    .replace(/</g, ' less than ')
    .replace(/>/g, ' greater than ')
    .replace(/=/g, ' equals ')
    .replace(/[{}_\\]/g, ' ');
}

/** Markdown answer → plain text a voice can read. */
export function toSpeechText(markdown) {
  return String(markdown || '')
    .replace(/```[\s\S]*?```/g, '\n(The code is shown on screen.)\n')
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, m) => `\n${mathToWords(m)}.\n`)
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, m) => ` ${mathToWords(m)} `)
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, m) => `\n${mathToWords(m)}.\n`)
    .replace(/\$([^$\n]+?)\$/g, (_, m) => ` ${mathToWords(m)} `)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*\|?\s*:?-{2,}[-|:\s]*$/gm, '') // table divider rows
    .replace(/^[ \t]*\|(.*?)\|?[ \t]*$/gm, (_, row) => `${row.split('|').map((c) => c.trim()).filter(Boolean).join(', ')}.`) // table rows
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/(\*\*|__|~~|\*)/g, '')
    .replace(/[\p{Extended_Pictographic}️‍]/gu, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

// Sentences grouped into chunks of at most MAX_CHUNK characters.
function toChunks(text) {
  const pieces = text.split(/(?<=[.!?।])\s+|\n+/).map((s) => s.trim()).filter(Boolean);
  const chunks = [];
  for (const piece of pieces) {
    // A very long sentence is split at commas, then at spaces.
    const parts = piece.length <= MAX_CHUNK ? [piece] : piece.split(/(?<=[,;:])\s+/);
    for (let part of parts) {
      while (part.length > MAX_CHUNK) {
        const cut = part.lastIndexOf(' ', MAX_CHUNK) > 40 ? part.lastIndexOf(' ', MAX_CHUNK) : MAX_CHUNK;
        chunks.push(part.slice(0, cut));
        part = part.slice(cut).trim();
      }
      const last = chunks[chunks.length - 1];
      const sameScript = last && DEVANAGARI.test(last) === DEVANAGARI.test(part);
      if (last && sameScript && last.length + part.length + 1 <= MAX_CHUNK) chunks[chunks.length - 1] = `${last} ${part}`;
      else if (part) chunks.push(part);
    }
  }
  return chunks;
}

// On-device voices are preferred: they send word-boundary events, so the spoken word can be
// highlighted (Chrome's online Google voices do not).
function pickVoice(hindi) {
  const voices = window.speechSynthesis.getVoices() || [];
  const lang = (v) => (v.lang || '').toLowerCase().replace('_', '-');
  const best = (match) => voices.find((v) => match(v) && v.localService) || voices.find(match);
  if (hindi) return best((v) => lang(v).startsWith('hi'));
  return best((v) => lang(v) === 'en-in') || best((v) => lang(v).startsWith('en'));
}

// Voices load asynchronously in Chrome; touching getVoices() early starts the load.
if (canSpeak()) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', () => window.speechSynthesis.getVoices());
}

/** Stop whatever is being read. */
export function stopSpeaking() {
  run += 1;
  if (canSpeak()) window.speechSynthesis.cancel();
  if (speakingId !== null) setSpeaking(null);
}

/** Read an answer aloud. Returns false when the browser cannot speak or there is nothing to read. */
export function speak(id, markdown) {
  if (!canSpeak()) return false;
  const chunks = toChunks(toSpeechText(markdown));
  if (!chunks.length) return false;

  const synth = window.speechSynthesis;
  synth.cancel();
  const token = ++run;
  setSpeaking(id);

  const queue = () => {
    if (run !== token) return;
    chunks.forEach((chunk, i) => {
      const u = new SpeechSynthesisUtterance(chunk);
      const hindi = DEVANAGARI.test(chunk);
      u.lang = hindi ? 'hi-IN' : 'en-IN';
      const voice = pickVoice(hindi);
      if (voice) u.voice = voice;
      u.rate = 1;
      u.onstart = () => { if (run === token) emitProgress({ id, chunkIndex: i, chunk, charIndex: -1 }); };
      u.onboundary = (e) => {
        if (run === token && (!e.name || e.name === 'word')) emitProgress({ id, chunkIndex: i, chunk, charIndex: e.charIndex });
      };
      if (i === chunks.length - 1) u.onend = () => { if (run === token) setSpeaking(null); };
      u.onerror = (e) => {
        if (run === token && e.error !== 'interrupted' && e.error !== 'canceled') stopSpeaking();
      };
      synth.speak(u);
    });
  };
  // Chrome can drop utterances queued in the same tick as cancel(); wait a moment.
  setTimeout(queue, 60);
  return true;
}
