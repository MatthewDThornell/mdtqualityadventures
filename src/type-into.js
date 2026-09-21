// Types text into an element that already holds it: every text node is
// blanked, then refilled left to right over time. The element keeps its
// markup (a highlighted code block types out with its colours intact), and
// the full text is in the DOM the whole time for anything that doesn't run
// the animation. Paced by the clock, not the frame — a slow frame reveals
// more at once, and the total always takes text.length × msPerChar.
const textNodesIn = (root) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  return nodes;
};

export function typeInto(el, msPerChar) {
  const nodes = textNodesIn(el).map((node) => ({ node, text: node.nodeValue }));
  const total = nodes.reduce((sum, n) => sum + n.text.length, 0);
  // Hold the element at its finished height while it types. The recommendation
  // cards sit in a multi-column grid, and a block that grows a line at a time
  // would have the columns rebalance every frame for every card typing at
  // once — enough to stall the page. Measured before the text is blanked, so
  // the reserved box is exactly the one the full text will need.
  el.classList.add('is-shown');
  el.style.minHeight = `${el.offsetHeight}px`;
  nodes.forEach(({ node }) => (node.nodeValue = ''));

  return new Promise((resolve) => {
    const start = performance.now();
    const tick = (now) => {
      let budget = Math.min(total, Math.floor((now - start) / msPerChar));
      nodes.forEach(({ node, text }) => {
        const take = Math.min(text.length, budget);
        node.nodeValue = text.slice(0, take);
        budget -= take;
      });
      if (budget > 0 || nodes.every(({ node, text }) => node.nodeValue === text)) {
        el.style.minHeight = '';
        resolve();
      } else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
