// Quaid's card is the one recommendation that fails on purpose. Once its
// quote has "decrypted" into an error (src/quote-decrypt.js flips the card's
// data-status to fail and fires quote-decrypted), this types out the
// investigation line by line — root cause, the missing test case, and the
// Playwright test it generates — like a terminal thinking out loud.
//
// The report's full text is in the markup; this only hides it and reveals it
// again progressively, so without JS, or under reduced motion, the card reads
// exactly as written. Typing is paced by the clock rather than per frame,
// the same as the decrypt, so a slow frame just reveals more at once.
const MS_PER_CHAR = 11; // log lines
const MS_PER_CODE_CHAR = 4; // the generated test — long, and a reader skims code
const LINE_PAUSE = 220;

const textNodesIn = (root) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  return nodes;
};

// blanks an element's text and refills it left to right over time
function typeInto(el, msPerChar) {
  const nodes = textNodesIn(el).map((node) => ({ node, text: node.nodeValue }));
  const total = nodes.reduce((sum, n) => sum + n.text.length, 0);
  nodes.forEach(({ node }) => (node.nodeValue = ''));
  el.classList.add('is-shown');

  return new Promise((resolve) => {
    const start = performance.now();
    const tick = (now) => {
      let budget = Math.min(total, Math.floor((now - start) / msPerChar));
      nodes.forEach(({ node, text }) => {
        const take = Math.min(text.length, budget);
        node.nodeValue = text.slice(0, take);
        budget -= take;
      });
      if (budget > 0 || nodes.every(({ node, text }) => node.nodeValue === text)) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function initQuaidReport(card) {
  if (!card) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const report = card.querySelector('.qa-report');
  if (!report) return;

  // every line and the code block wait their turn
  const steps = Array.from(report.querySelectorAll('.qa-line, .qa-code'));
  report.classList.add('is-typing');

  card.addEventListener(
    'quote-decrypted',
    async () => {
      for (const step of steps) {
        const isCode = step.classList.contains('qa-code');
        await typeInto(step, isCode ? MS_PER_CODE_CHAR : MS_PER_CHAR);
        step.classList.add('is-done', 'is-waiting');
        await wait(Number(step.dataset.pause) || LINE_PAUSE);
        step.classList.remove('is-waiting');
      }
      report.classList.remove('is-typing');
      report.classList.add('is-complete');
    },
    { once: true },
  );
}
