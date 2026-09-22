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
    .filter((node) => node.nodeValue.length)
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
    // Paced by the clock rather than the frame, like every other animation
    // here: a slow frame reveals more at once instead of running long.
    const tick = (now) => {
      let budget = Math.floor((now - start) / msPerChar);
      let carried = false;
      for (const { typed, pending, text } of parts) {
        const take = Math.max(0, Math.min(text.length, budget));
        typed.textContent = text.slice(0, take);
        pending.textContent = text.slice(take);
        // the caret rides the one node currently being written into
        typed.classList.toggle('is-writing', !carried && take < text.length);
        if (take < text.length) carried = true;
        budget -= take;
      }
      if (budget >= 0 && !carried) {
        restore();
        resolve();
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

// Types each element out once, when it first scrolls into view. Elements that
// arrive together are offset so a screenful reads as several lines being
// written rather than one shout.
export function initTypeOnView(elements, { msPerChar = 30, staggerMs = 320 } = {}) {
  const targets = Array.from(elements).filter((el) => el.textContent.trim());
  if (targets.length === 0) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  targets.forEach((el) => el.classList.add('tw-waiting'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .forEach((entry, i) => {
          observer.unobserve(entry.target);
          setTimeout(() => {
            entry.target.classList.remove('tw-waiting');
            typeReveal(entry.target, msPerChar).then(() => {
              entry.target.classList.add('tw-written');
              entry.target.dispatchEvent(new CustomEvent('type-revealed', { bubbles: true }));
            });
          }, i * staggerMs);
        });
    },
    { threshold: 0.6 },
  );
  targets.forEach((el) => observer.observe(el));
}
