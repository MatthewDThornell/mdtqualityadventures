// The hero's decrypt, scaled to paragraphs: every recommendation starts as a
// block of binary and resolves into the real words when its card scrolls into
// view, so reading down the section feels like the story decoding card by
// card. Same technique as src/hero-decrypt.js — the real paragraph is never
// rewritten, only made transparent behind an aria-hidden overlay that plays
// the scramble and is removed once every character has locked — so a screen
// reader or a test reading the paragraph sees the real quote the whole time.
//
// Two things differ from the title. The lock cascade is paced by a fixed
// budget rather than per character (a title has 18 characters; a quote can
// have 800 — at the hero's two frames per character that's most of a
// minute), and the overlay mirrors the paragraph's word structure so that as
// words lock into the serif they wrap exactly where the real text does, and
// the final swap doesn't shift a line.
const BINARY_CHARS = '01';
const LETTER_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const BINARY_MS = 320; // pure binary before letters start showing
const WAVE_MS = 1300; // for the lock to sweep from first character to last
const SETTLE_MS = 900; // let the last-locked characters' colour transition finish before the swap
const STAGGER_MS = 180; // between cards that scroll into view together, so they decode in turn
const CHURN = 0.5; // share of still-scrambling characters rewritten each frame — reads as full noise at half the cost

const randomFrom = (pool) => pool[Math.floor(Math.random() * pool.length)];

function buildOverlay(text) {
  const overlay = document.createElement('span');
  overlay.className = 'quote-decrypt';
  overlay.setAttribute('aria-hidden', 'true');

  const charSpans = [];
  const words = text.trim().split(/\s+/);
  words.forEach((word, w) => {
    if (w > 0) overlay.appendChild(document.createTextNode(' '));
    const wordSpan = document.createElement('span');
    wordSpan.className = 'qd-word';
    for (const ch of word) {
      const span = document.createElement('span');
      span.className = 'qd-char';
      span.textContent = randomFrom(BINARY_CHARS);
      span.dataset.char = ch;
      wordSpan.appendChild(span);
      charSpans.push(span);
    }
    overlay.appendChild(wordSpan);
  });
  return { overlay, charSpans };
}

// Paced by the clock, not by frame count: a quote is hundreds of characters
// and every frame that rewrites them forces the paragraph to reflow, so on
// a slow machine — or four cards decoding at once — frames run long. Tying
// the sweep to elapsed time means it always finishes in ~1.6s; a slow frame
// just locks more characters in one go.
function decrypt(paragraph, overlay, charSpans) {
  const start = performance.now();
  let remaining = charSpans.length;

  const tick = (now) => {
    const elapsed = now - start;
    const pool = elapsed < BINARY_MS ? BINARY_CHARS : LETTER_CHARS;
    // how far along the text the lock has swept, in characters
    const lockedThrough = Math.floor(((elapsed - BINARY_MS) / WAVE_MS) * charSpans.length);

    charSpans.forEach((span, i) => {
      if (span.classList.contains('is-locked')) return;
      if (i < lockedThrough) {
        span.textContent = span.dataset.char;
        span.classList.add('is-locked');
        remaining--;
        return;
      }
      if (Math.random() < CHURN) span.textContent = randomFrom(pool);
    });

    if (remaining > 0) {
      requestAnimationFrame(tick);
      return;
    }
    setTimeout(() => {
      paragraph.classList.remove('quote-decrypt-hidden');
      overlay.remove();
      // the card's badge has read PENDING since init; it now reads the
      // outcome — PASS, or FAIL for the one card that carries that verdict —
      // and anything waiting on the result (src/quaid-report.js) hears about it
      const card = paragraph.closest('.rec-card');
      if (card) {
        card.dataset.status = card.dataset.outcome || 'pass';
        card.dispatchEvent(new CustomEvent('quote-decrypted', { bubbles: true }));
      }
    }, SETTLE_MS);
  };
  requestAnimationFrame(tick);
}

export function initQuoteDecrypt(paragraphs) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const targets = Array.from(paragraphs).filter((p) => p.textContent.trim());
  if (targets.length === 0) return;

  // every verdict is pending from the start; the badge is the only visible
  // sign of that until a card gets close enough to be given its overlay
  targets.forEach((p) => {
    const card = p.closest('.rec-card');
    if (card) card.dataset.status = 'pending';
  });

  const pending = new Map();

  const decryptObserver = new IntersectionObserver(
    (entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .forEach((entry, i) => {
          const { overlay, charSpans } = pending.get(entry.target);
          pending.delete(entry.target);
          decryptObserver.unobserve(entry.target);
          // cards that arrive in the same batch decode one after another
          setTimeout(() => decrypt(entry.target, overlay, charSpans), i * STAGGER_MS);
        });
    },
    { threshold: 0.25 },
  );

  // An overlay is a span per character — thousands across the page — so each
  // is built only once its card comes within a screen or so of the viewport,
  // still out of sight, rather than all of them at startup. The card is hidden
  // and covered in the same step, and only then handed to the decrypt observer,
  // so a card that's already in view (a deep link) can never decrypt before it
  // has anything to decrypt.
  const buildObserver = new IntersectionObserver(
    (entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .forEach((entry) => {
          const p = entry.target;
          buildObserver.unobserve(p);
          const { overlay, charSpans } = buildOverlay(p.textContent);
          p.classList.add('quote-decrypt-hidden');
          p.parentNode.insertBefore(overlay, p.nextSibling);
          pending.set(p, { overlay, charSpans });
          decryptObserver.observe(p);
        });
    },
    { rootMargin: '800px 0px' },
  );
  targets.forEach((p) => buildObserver.observe(p));
}
