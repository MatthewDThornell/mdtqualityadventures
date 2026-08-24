const ROTATE_INTERVAL = 7000;
const FADE_MS = 300;

// A quiet crossfade rotator for the cover quote — deliberately simpler than
// typewriter.js (no per-character typing, no segments): full-string swaps
// under an opacity fade, so it reads as a distinct rhythm from the tagline
// typewriter above it rather than a second copy of the same effect.
export function initQuoteRotator(el, quotes) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion || quotes.length === 0) {
    return { pause() {}, resume() {} };
  }

  let index = 0;
  let timeoutId = null;
  let paused = false;

  function swap() {
    el.style.opacity = '0';
    timeoutId = setTimeout(() => {
      index = (index + 1) % quotes.length;
      el.textContent = quotes[index];
      el.style.opacity = '1';
      timeoutId = setTimeout(swap, ROTATE_INTERVAL);
    }, FADE_MS);
  }

  function start() {
    if (timeoutId === null && !paused) {
      timeoutId = setTimeout(swap, ROTATE_INTERVAL);
    }
  }

  function pause() {
    paused = true;
    clearTimeout(timeoutId);
    timeoutId = null;
  }

  function resume() {
    paused = false;
    start();
  }

  start();

  return { pause, resume };
}
