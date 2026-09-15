// A "decrypting" reveal for a hero title: every character scrambles through
// binary digits, then random letters, before locking into place — staggered
// left to right so it cascades like a slot machine settling, rather than
// every character resolving at once.
//
// Purely a decorative overlay: the real heading element is wrapped, not
// rewritten, and its own textContent never changes — nothing here can ever
// desync from what a screen reader announces or what a test asserts
// against. Reuses .tw-char-landing (typewriter.js's own "ink settling"
// glow) on each character as it locks, so a letter landing here reads as
// the same moment as a letter landing while typing, just arrived at a
// different way.
const BINARY_CHARS = '01';
const LETTER_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
// .tw-char-land's glow animation runs 1.1s — wait for it to finish playing
// on the last-locked character before swapping back to the real heading,
// or that glow gets cut off mid-fade instead of settling naturally.
const GLOW_SETTLE_MS = 1150;

function randomBinaryChar() {
  return BINARY_CHARS[Math.floor(Math.random() * BINARY_CHARS.length)];
}

export function initHeroDecrypt(headingEl, options = {}) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return { stop() {} };

  const { frameMs = 40, charStagger = 2, binaryFrames = 10, letterFrames = 8 } = options;

  const text = headingEl.textContent;

  const wrap = document.createElement('div');
  wrap.className = 'hero-name-wrap';
  headingEl.parentNode.insertBefore(wrap, headingEl);
  wrap.appendChild(headingEl);
  headingEl.classList.add('hero-name-hidden');

  const overlay = document.createElement('div');
  overlay.className = 'hero-name-decrypt';
  overlay.setAttribute('aria-hidden', 'true');
  wrap.appendChild(overlay);

  // Every character scrambles together starting at frame 1 — none of them
  // show their real value, or anything else that gives away the answer,
  // before that first tick. charStagger only affects when each one *locks*,
  // cascading left to right; it never gates when scrambling starts. An
  // earlier version gated the start per character too, which let
  // not-yet-reached characters just sit there quietly showing the real
  // letter until their turn came around — visible proof in a slowed-down
  // manual test, not just a theoretical bug.
  const chars = text.split('');
  const spans = chars.map((ch) => {
    const span = document.createElement('span');
    span.className = 'hnd-char';
    if (ch === ' ') {
      // Spaces never scramble or go through the per-frame lock below, so
      // without this they'd sit in the overlay's monospace font for the
      // entire animation — and a monospace space is much wider than one in
      // the display serif .is-locked switches to, so the "revealed" name
      // renders visibly wider than the real heading and jumps left when the
      // real (narrower, properly-spaced) heading swaps in. Locking immediately
      // fixes both: font-family: var(--font-display) applies from frame one.
      span.textContent = ' ';
      span.classList.add('is-locked');
    } else {
      span.textContent = randomBinaryChar();
    }
    overlay.appendChild(span);
    return span;
  });

  const lockFrame = (i) => i * charStagger + binaryFrames + letterFrames;

  function finish() {
    headingEl.classList.remove('hero-name-hidden');
    overlay.remove();
  }

  let frame = 0;
  let settling = false;
  const intervalId = setInterval(() => {
    frame++;
    let allLocked = true;

    chars.forEach((ch, i) => {
      if (ch === ' ') return;
      const span = spans[i];

      if (frame >= lockFrame(i)) {
        if (!span.classList.contains('is-locked')) {
          span.textContent = ch;
          span.classList.add('is-locked', 'tw-char-landing');
        }
        return;
      }

      allLocked = false;
      const pool = frame < binaryFrames ? BINARY_CHARS : LETTER_CHARS;
      span.textContent = pool[Math.floor(Math.random() * pool.length)];
    });

    if (allLocked && !settling) {
      settling = true;
      clearInterval(intervalId);
      setTimeout(finish, GLOW_SETTLE_MS);
    }
  }, frameMs);

  return {
    stop() {
      clearInterval(intervalId);
      finish();
    },
  };
}
