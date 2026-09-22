// The chapter titles decode the way the hero's name and the recommendations
// do: a chapter-opener's heading sits as binary until its page turns into
// view, then resolves left to right into the display serif. Same overlay
// technique as src/quote-decrypt.js (which lends its overlay builder and
// sweep) — the real heading is wrapped and made transparent, never
// rewritten, so a screen reader, a test, or a search engine reads the real
// title the whole time.
//
// A heading is sixteen characters, not eight hundred, so the sweep is
// shorter than a quote's; and every overlay is built up front, since three
// titles' worth of spans is nothing.
import { buildOverlay, decrypt } from './quote-decrypt.js';

const WAVE_MS = 900;
const SETTLE_MS = 700;
const PAGE_TURN_LEAD_MS = 250; // the page has started flipping open before its title starts to resolve
const STAGGER_MS = 180;

export function initTitleDecrypt(headings) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const targets = Array.from(headings).filter((h) => h.textContent.trim());
  if (targets.length === 0) return;

  const pending = new Map();
  targets.forEach((heading) => {
    const { overlay, charSpans } = buildOverlay(heading.textContent, 'title-decrypt');
    // the overlay is a sibling inside a positioned wrapper, not a child of the
    // heading, so the heading's own textContent stays exactly its title — which
    // also means it inherits nothing from the heading: its face, size and
    // leading are copied over so the reveal lands in the box it covers
    const face = getComputedStyle(heading);
    for (const prop of [
      'fontFamily',
      'fontSize',
      'fontWeight',
      'fontStyle',
      'lineHeight',
      'letterSpacing',
    ]) {
      overlay.style[prop] = face[prop];
    }
    const wrap = document.createElement('span');
    wrap.className = 'title-decrypt-wrap';
    heading.parentNode.insertBefore(wrap, heading);
    wrap.appendChild(heading);
    wrap.appendChild(overlay);
    heading.classList.add('title-decrypt-hidden');
    pending.set(heading, { overlay, charSpans });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .forEach((entry, i) => {
          const { overlay, charSpans } = pending.get(entry.target);
          pending.delete(entry.target);
          observer.unobserve(entry.target);
          setTimeout(
            () =>
              decrypt(entry.target, overlay, charSpans, {
                hiddenClass: 'title-decrypt-hidden',
                waveMs: WAVE_MS,
                settleMs: SETTLE_MS,
                onDone: () => {
                  entry.target.classList.add('title-decrypted');
                  entry.target.dispatchEvent(new CustomEvent('title-decrypted', { bubbles: true }));
                },
              }),
            PAGE_TURN_LEAD_MS + i * STAGGER_MS,
          );
        });
    },
    { threshold: 0.5 },
  );
  targets.forEach((heading) => observer.observe(heading));
}
