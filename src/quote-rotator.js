import { typeReveal } from './type-reveal.js';

const ROTATE_INTERVAL = 7000;
const FADE_MS = 300;
const MS_PER_CHAR = 38; // a quote is short; it can be written at reading speed

// The cover quote writes itself. It waits, hidden, until the About Me page is
// actually on screen, types out (src/type-reveal.js — the words are in the DOM
// the whole time), holds, then fades and writes the next one. The fade between
// quotes is what keeps this from reading as a second copy of the hero's
// typewriter: that one erases and retypes in place, this one turns the page.
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

  function write() {
    return typeReveal(el, MS_PER_CHAR).then(() => {
      timeoutId = setTimeout(swap, ROTATE_INTERVAL);
    });
  }

  function swap() {
    el.style.opacity = '0';
    timeoutId = setTimeout(() => {
      index = (index + 1) % quotes.length;
      el.textContent = quotes[index];
      el.style.opacity = '1';
      write();
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

  // Nothing is written until the quote is read: the first one types out when
  // the section scrolls into view, and the rotation starts from there, so a
  // visitor arriving at About Me always catches a quote mid-sentence rather
  // than a line that changed twice while they were somewhere else.
  el.classList.add('tw-waiting');
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      el.classList.remove('tw-waiting');
      write();
    },
    { threshold: 0.6 },
  );
  observer.observe(el);

  return { pause, resume };
}
