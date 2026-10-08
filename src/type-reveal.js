// A typewriter that never takes the words off the page.
//
// src/type-into.js blanks an element's text nodes and refills them, which is
// right for the incident reports — a terminal writing something that did not
// exist a moment ago. This is for copy that is already the page's content: a
// role on the résumé, a quote in About Me. Rather than remove the text and
// put it back, every text node is split in two — what has been typed, and
// what is still to come behind `visibility: hidden`. The full text is in the
// DOM from the first frame to the last, so a screen reader, a crawler or an
// assertion reading the paragraph sees all of it at any moment, and because
// the untyped tail still takes up its space, nothing below moves while the
// line writes itself.
//
// Both spans are removed when the reveal finishes, leaving the markup exactly
// as it was found.
const textNodesIn = (root) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  return nodes;
};

export function typeReveal(el, msPerChar) {
  const parts = textNodesIn(el)
    // whitespace-only nodes are the markup's own indentation between words:
    // hiding them reveals nothing and typing them spends half a second on a
    // line that looks like it has not started yet
    .filter((node) => node.nodeValue.trim().length)
    .map((node) => {
      const text = node.nodeValue;
      const typed = document.createElement('span');
      typed.className = 'tw-typed';
      const pending = document.createElement('span');
      pending.className = 'tw-pending';
      pending.textContent = text;
      node.replaceWith(typed, pending);
      return { typed, pending, text };
    });
  const total = parts.reduce((sum, p) => sum + p.text.length, 0);
  if (total === 0) return Promise.resolve();
  el.classList.add('is-typing');

  const restore = () => {
    for (const { typed, pending, text } of parts) {
      typed.replaceWith(document.createTextNode(text));
      pending.remove();
    }
    el.normalize();
    el.classList.remove('is-typing');
  };

  return new Promise((resolve) => {
    const start = performance.now();
    // Only the word being written is touched each frame.
    //
    // The first version of this walked all of `parts` every frame and rewrote
    // both spans of every one, finished or not — around 57 DOM mutations a
    // frame, 1,100 a second, to reveal about 33 characters. Every one of them
    // invalidated the paragraph's layout, and on a card as long as the Detail
    // Guy's it cost enough main thread that a right-click took ~165ms to show
    // the pen. A word already written never changes again, and a word not yet
    // reached is already in its starting state, so the loop below commits each
    // word once as it is passed and otherwise writes one span pair per frame —
    // and not even that when the character count has not moved.
    let index = 0; // the word being written
    let committed = 0; // characters in the words already finished
    let shown = -1; // how much of the current word is showing
    let writing = null; // the span carrying the caret

    const tick = (now) => {
      const budget = Math.floor((now - start) / msPerChar);

      while (index < parts.length && budget - committed >= parts[index].text.length) {
        const part = parts[index];
        part.typed.textContent = part.text;
        part.pending.textContent = '';
        committed += part.text.length;
        index += 1;
        shown = -1;
      }

      if (index >= parts.length) {
        writing?.classList.remove('is-writing');
        restore();
        resolve();
        return;
      }

      const part = parts[index];
      const take = budget - committed;
      if (take !== shown) {
        part.typed.textContent = part.text.slice(0, take);
        part.pending.textContent = part.text.slice(take);
        shown = take;
      }
      if (writing !== part.typed) {
        writing?.classList.remove('is-writing');
        part.typed.classList.add('is-writing');
        writing = part.typed;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

// Types each element out once, when it first scrolls into view.
//
// By default the ones that arrive together are offset by `staggerMs`, so a
// screenful of résumé entries reads as several lines being written at once
// rather than one shout. `sequential` instead makes each wait for the line
// before it to finish — for a card whose lines are a sentence and then its
// punchline, where the second arriving early gives the first away.
export function initTypeOnView(
  elements,
  { msPerChar = 30, staggerMs = 320, sequential = false, threshold = 0.6 } = {},
) {
  const targets = Array.from(elements).filter((el) => el.textContent.trim());
  if (targets.length === 0) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  targets.forEach((el) => el.classList.add('tw-waiting'));

  const write = (el) => {
    el.classList.remove('tw-waiting');
    return typeReveal(el, msPerChar).then(() => {
      el.classList.add('tw-written');
      el.dispatchEvent(new CustomEvent('type-revealed', { bubbles: true }));
    });
  };

  // everything queued in document order, however the observer batches it
  let queue = Promise.resolve();

  const observer = new IntersectionObserver(
    (entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .forEach((entry, i) => {
          observer.unobserve(entry.target);
          if (sequential) {
            queue = queue.then(() => write(entry.target));
            return;
          }
          setTimeout(() => write(entry.target), i * staggerMs);
        });
    },
    { threshold },
  );
  targets.forEach((el) => observer.observe(el));
}
