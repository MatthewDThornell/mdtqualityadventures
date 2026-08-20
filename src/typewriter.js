function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function brandSegment(term, className, href, logoSrc, logoBothSides = false) {
  return {
    term,
    render: (t) => {
      const logo = logoSrc ? `<img class="tagline-logo" src="${logoSrc}" alt="" loading="lazy" />` : '';
      const inner = logoBothSides ? `${logo}${t}${logo}` : `${logo}${t}`;
      return href
        ? `<a class="brand-link ${className}" href="${href}" target="_blank" rel="noopener">${inner}</a>`
        : `<span class="brand-link ${className}">${inner}</span>`;
    },
  };
}

// renders `text` with each non-overlapping segment's term wrapped by its own render()
function buildStyledHtml(text, segments) {
  const matches = (segments ?? [])
    .map((seg) => {
      const idx = text.indexOf(seg.term);
      return idx === -1 ? null : { idx, end: idx + seg.term.length, seg };
    })
    .filter(Boolean)
    .sort((a, b) => a.idx - b.idx);

  let html = '';
  let cursor = 0;
  for (const m of matches) {
    html += escapeHtml(text.slice(cursor, m.idx));
    html += m.seg.render(escapeHtml(m.seg.term));
    cursor = m.end;
  }
  html += escapeHtml(text.slice(cursor));
  return html;
}

export function initTypewriter(el, phrases, options = {}) {
  const { typeSpeed = 55, deleteSpeed = 28, holdTime = 1600, pauseTime = 350, loop = true } = options;

  const normalized = phrases.map((p) => (typeof p === 'string' ? { text: p, segments: null } : p));

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion || normalized.length === 0) {
    const first = normalized[0];
    if (first) {
      el.innerHTML = buildStyledHtml(first.text, first.segments);
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
        if (phrase.segments) {
          el.innerHTML = buildStyledHtml(phrase.text, phrase.segments);
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

    if (charIndex === phrase.text.length && phrase.segments) {
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
