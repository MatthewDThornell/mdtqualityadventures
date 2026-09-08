function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function brandSegment(term, className, href, logoSrc, logoBothSides = false) {
  return {
    term,
    className,
    href,
    logoSrc,
    render: (t) => {
      // the bare role/title half of a phrase has no href — it's about to be
      // highlighted again in the permanent career-trail entry below the
      // instant this phrase finishes typing, so it doesn't need its own loud
      // brand color here too; an underline keeps it reading as significant
      // without the two live/permanent copies competing for the same emphasis
      if (!href) {
        return `<span class="tw-role">${t}</span>`;
      }
      const logo = logoSrc
        ? `<img class="tagline-logo" src="${logoSrc}" alt="" loading="lazy" />`
        : '';
      const inner = logoBothSides ? `${logo}${t}${logo}` : `${logo}${t}`;
      return `<a class="brand-link ${className}" href="${href}" target="_blank" rel="noopener">${inner}</a>`;
    },
  };
}

// renders `text` with each non-overlapping segment's term wrapped by its own render()
export function buildStyledHtml(text, segments) {
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
  const { typeSpeed = 55, holdTime = 1600, pauseTime = 350, loop = true, onPhraseTyped } = options;

  const normalized = phrases.map((p) => (typeof p === 'string' ? { text: p, segments: null } : p));

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // The typed text lives in its own child span rather than directly in `el`,
  // so the quill-tip icon survives every tick's rewrite — only textEl's
  // content ever gets replaced, never el's.
  //
  // The quill itself is position: absolute (see .tw-quill in style.css) and
  // placed by positionQuill() below, rather than left in normal inline flow
  // right after the text. An earlier version kept it in-flow (plus a
  // same-width blank spacer *before* the text to balance it, so text-align:
  // center on `el` wouldn't be thrown off by the quill's one-sided width) —
  // that balancing only works for single-line phrases though. The "Former
  // X at\nY" phrases force a line break, putting the spacer on line 1 and
  // the quill on line 2; each line's own content is still centered
  // correctly as a *unit*, but that pushes line 1's text right (spacer on
  // its left) and line 2's text left (quill on its right) in opposite
  // directions, visibly misaligning the two lines from each other and from
  // the centered career-trail list below. Taking the quill out of flow
  // entirely removes it from text-align's width math altogether, so every
  // line of actual text — one or several — centers correctly on its own.
  const textEl = document.createElement('span');
  textEl.className = 'tw-text';
  const quillEl = document.createElement('span');
  quillEl.className = 'tw-quill';
  quillEl.setAttribute('aria-hidden', 'true');
  el.textContent = '';
  el.append(textEl, quillEl);

  // Measures where the text actually ends (the last character of the last
  // line, in el's own coordinate space) and moves the absolutely-positioned
  // quill there. Needs a real measurement rather than a fixed offset since
  // that end point moves both horizontally (as characters are typed) and
  // vertically (once a phrase wraps/breaks onto a second line) — and, for
  // phrases ending in a company logo <img> (every "Former X at Y" phrase
  // does, via logoBothSides), rather than a Range over textEl's full mixed
  // text+image contents: Range.getClientRects() does not reliably include a
  // trailing <img> as its own final rect, so `rects[rects.length - 1]` was
  // quietly landing on the rect for the text *before* the image instead of
  // the image itself, positioning the quill on top of the logo rather than
  // after it. Walking straight to the deepest last DOM node sidesteps that
  // ambiguity entirely: an <img> has no children, so the walk stops there
  // and gets its rect directly; a trailing text character still resolves
  // through a Range, but one scoped to just that single text node rather
  // than the whole mixed-content element.
  function positionQuill() {
    if (!textEl.lastChild) return;
    let node = textEl;
    while (node.lastChild) node = node.lastChild;

    let lastRect;
    if (node.nodeType === Node.TEXT_NODE) {
      const range = document.createRange();
      range.selectNodeContents(node);
      const rects = range.getClientRects();
      lastRect = rects[rects.length - 1];
    } else {
      lastRect = node.getBoundingClientRect();
    }
    if (!lastRect || (lastRect.width === 0 && lastRect.height === 0)) return;

    const elRect = el.getBoundingClientRect();
    // centered against the last character's own rect height rather than
    // pinned to its top, so it sits level with the glyphs themselves instead
    // of the line box (which is taller than the glyphs by whatever the
    // font's line-height adds above/below them)
    const quillSize = quillEl.offsetHeight;
    quillEl.style.top = `${lastRect.top - elRect.top + (lastRect.height - quillSize) / 2}px`;
    quillEl.style.left = `${lastRect.right - elRect.left}px`;
  }

  if (prefersReducedMotion || normalized.length === 0) {
    const first = normalized[0];
    if (first) {
      textEl.innerHTML = buildStyledHtml(first.text, first.segments);
      positionQuill();
    }
    // the typewriter never cycles in this mode, so anything listening for completed
    // phrases (e.g. the career trail) would otherwise never hear about the rest
    normalized.forEach((phrase) => onPhraseTyped?.(phrase));
    return { stop() {}, pause() {}, resume() {} };
  }

  // Appends one character as its own span so it can carry its own brief
  // ink-glow-then-settle animation (see .tw-char-landing/@keyframes
  // tw-char-land in style.css) independently of every character already
  // typed before it — the same "each point fades on its own timer" idea as
  // the canvas ink trail, just applied to letters instead of pixels. Kept as
  // plain (unwrapped) text nodes for whitespace: wrapping a literal "\n" in
  // its own inline box risks it no longer forcing a line break the same way
  // it does as a bare text node under this element's white-space: pre-line,
  // and a space needs no glow anyway.
  function appendChar(char) {
    if (/\s/.test(char)) {
      textEl.appendChild(document.createTextNode(char));
      return;
    }
    const span = document.createElement('span');
    span.className = 'tw-char tw-char-landing';
    span.textContent = char;
    textEl.appendChild(span);
    positionQuill();
    spawnInkSpark();
    tapQuill();
  }

  // A little burst of brass/parchment glitter off the nib each time a letter
  // lands — same two colors and drift-and-fade motion language as the canvas
  // ink trail's own sparkles, just DOM/CSS driven since there are far too
  // few of these at once to need a canvas. Several per letter, at varied
  // sizes/speeds/delays, so it reads as a little flick of glitter rather than
  // one dot appearing — each one twinkles (a scale+opacity pulse layered on
  // top of the drift, via tw-spark-fall in style.css) instead of just fading
  // evenly, closer to how glitter actually catches the light as it falls.
  function spawnInkSpark() {
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const spark = document.createElement('span');
      spark.className = 'tw-spark';
      spark.style.setProperty('--tw-spark-x', `${(Math.random() - 0.5) * 24}px`);
      spark.style.setProperty('--tw-spark-y', `${4 + Math.random() * 16}px`);
      spark.style.setProperty('--tw-spark-size', `${2 + Math.random() * 2.5}px`);
      spark.style.setProperty('--tw-spark-rotate', `${(Math.random() - 0.5) * 200}deg`);
      spark.style.setProperty('--tw-spark-delay', `${Math.random() * 90}ms`);
      spark.style.setProperty(
        '--tw-spark-color',
        Math.random() < 0.4
          ? 'var(--brass-bright)'
          : Math.random() < 0.7
            ? 'var(--parchment)'
            : '#fff4d6',
      );
      quillEl.appendChild(spark);
      spark.addEventListener('animationend', () => spark.remove());
    }
  }

  // A quick nib-down "tap" each time a letter lands, replacing a continuous
  // idle wiggle that ran regardless of whether anything was actually being
  // written — restart the animation by removing then re-adding the class
  // (same restart trick as .magic-word-pop) so back-to-back keystrokes each
  // get their own tap instead of the first one just being cut short.
  function tapQuill() {
    quillEl.classList.remove('is-writing');
    void quillEl.offsetWidth;
    quillEl.classList.add('is-writing');
  }

  const FADE_MS = 700;

  let phraseIndex = 0;
  let charIndex = 0;
  let timeoutId = null;
  let paused = false;
  // whichever function is currently scheduled behind timeoutId, plus the
  // delay it was scheduled with — so pause()/resume() can freeze and later
  // re-fire the *right* next step regardless of which phase (typing this
  // character, starting the fade, or clearing after it) it's paused during,
  // without needing a separate boolean flag per phase like the old
  // type/delete state machine needed
  let pendingFn = null;
  let pendingDelay = 0;
  // set once a !loop typewriter reaches the end of its last phrase for good —
  // resume() must not revive it (there's nothing left to type), otherwise
  // holding then releasing the pen after the eyebrow line finishes would kick
  // off a pointless tick() loop that just re-renders the same finished text
  let finished = false;

  function schedule(fn, delay) {
    pendingFn = fn;
    pendingDelay = delay;
    timeoutId = setTimeout(fn, delay);
  }

  function tick() {
    const phrase = normalized[phraseIndex];

    charIndex++;
    appendChar(phrase.text[charIndex - 1]);
    if (charIndex === phrase.text.length) {
      if (phrase.segments) {
        textEl.innerHTML = buildStyledHtml(phrase.text, phrase.segments);
        positionQuill();
      }
      onPhraseTyped?.(phrase);
      if (!loop && phraseIndex === normalized.length - 1) {
        finished = true;
        // there's nothing left to write, ever — the blinking/squiggle cursor
        // and the quill both go away for good rather than sitting there
        // blinking at a line that will never change again (see
        // .typewriter.tw-finished in style.css)
        el.classList.add('tw-finished');
        return; // fully typed, and nothing left to loop back to — stop here for good
      }
      schedule(startFade, holdTime);
      return;
    }
    schedule(tick, typeSpeed);
  }

  // Rather than backspacing character by character, the whole finished line
  // fades away together like ink drying up and disappearing — same idea as
  // the canvas ink trail's own fade, just applied to a line of text instead
  // of canvas points. See .tw-text.tw-text-fading in style.css for the
  // actual opacity transition this triggers.
  function startFade() {
    textEl.classList.add('tw-text-fading');
    schedule(finishFade, FADE_MS);
  }

  function finishFade() {
    textEl.classList.remove('tw-text-fading');
    textEl.textContent = '';
    charIndex = 0;
    phraseIndex = (phraseIndex + 1) % normalized.length;
    schedule(tick, pauseTime);
  }

  schedule(tick, typeSpeed);

  return {
    stop() {
      clearTimeout(timeoutId);
    },
    // Freezes mid-phrase exactly where it stands (charIndex/phraseIndex, and
    // whatever's mid-fade, are left untouched) — the blinking cursor itself
    // is a plain CSS animation on ::after, so it keeps blinking on its own
    // the whole time this is paused.
    pause() {
      if (paused || finished) return;
      paused = true;
      clearTimeout(timeoutId);
      timeoutId = null;
    },
    resume() {
      if (!paused || finished) return;
      paused = false;
      timeoutId = setTimeout(pendingFn, pendingDelay);
    },
  };
}
