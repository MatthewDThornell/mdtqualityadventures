function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// renders `text` with `highlight.term` wrapped in a colored, optionally linked span
function buildHighlightedHtml(text, highlight) {
  const idx = text.indexOf(highlight.term);
  if (idx === -1) return escapeHtml(text);

  const before = escapeHtml(text.slice(0, idx));
  const term = escapeHtml(highlight.term);
  const after = escapeHtml(text.slice(idx + highlight.term.length));
  const className = `brand-link ${highlight.className}`;

  const tag = highlight.href
    ? `<a class="${className}" href="${highlight.href}" target="_blank" rel="noopener">${term}</a>`
    : `<span class="${className}">${term}</span>`;

  return `${before}${tag}${after}`;
}

export function initTypewriter(el, phrases, options = {}) {
  const { typeSpeed = 55, deleteSpeed = 28, holdTime = 1600, pauseTime = 350, loop = true } = options;

  const normalized = phrases.map((p) => (typeof p === 'string' ? { text: p, highlight: null } : p));

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion || normalized.length === 0) {
    const first = normalized[0];
    if (first) {
      el.innerHTML = first.highlight ? buildHighlightedHtml(first.text, first.highlight) : escapeHtml(first.text);
    }
    return { stop() {} };
  }

  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;
  let timeoutId = null;

  function tick() {
    const phrase = normalized[phraseIndex];

    if (!deleting) {
      charIndex++;
      el.textContent = phrase.text.slice(0, charIndex);
      if (charIndex === phrase.text.length) {
        if (phrase.highlight) {
          el.innerHTML = buildHighlightedHtml(phrase.text, phrase.highlight);
        }
        if (!loop && phraseIndex === normalized.length - 1) {
          return; // fully typed, and nothing left to loop back to — stop here for good
        }
        deleting = true;
        timeoutId = setTimeout(tick, holdTime);
        return;
      }
      timeoutId = setTimeout(tick, typeSpeed);
      return;
    }

    if (charIndex === phrase.text.length && phrase.highlight) {
      // revert to plain text before slicing it character by character again
      el.textContent = phrase.text;
    }
    charIndex--;
    el.textContent = phrase.text.slice(0, charIndex);
    if (charIndex === 0) {
      deleting = false;
      phraseIndex = (phraseIndex + 1) % normalized.length;
      timeoutId = setTimeout(tick, pauseTime);
      return;
    }
    timeoutId = setTimeout(tick, deleteSpeed);
  }

  timeoutId = setTimeout(tick, typeSpeed);

  return {
    stop() {
      clearTimeout(timeoutId);
    },
  };
}
