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
  // a count rather than a boolean, since hover-pause, tab-visibility-pause, and
  // pen-hold-pause can all be active independently — e.g. releasing the pen
  // while the mouse still happens to be hovering the quote must not resume it
  // early just because that one source let go
  let pauseCount = 0;

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
    if (timeoutId === null && pauseCount === 0) {
      timeoutId = setTimeout(swap, ROTATE_INTERVAL);
    }
  }

  function pause() {
    pauseCount++;
    clearTimeout(timeoutId);
    timeoutId = null;
  }

  function resume() {
    pauseCount = Math.max(0, pauseCount - 1);
    if (pauseCount === 0) start();
  }

  start();

  return { pause, resume };
}
