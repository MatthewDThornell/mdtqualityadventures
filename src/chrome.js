// Shared page chrome used identically across index.html, qa-standards.html, and
// test-automation-university.html (see the nav-sync comment in each file's header
// for why these three pages duplicate markup instead of sharing a template).

// Holding right-click swaps the system arrow for a quill-pen cursor (see the
// html.pen-active rule in style.css), like dipping the pen to write. Requires
// suppressing the native context menu while active so it doesn't pop up over
// the effect — desktop/fine-pointer only, since touch has no right-click.
//
// onActivate/onDeactivate are optional hooks for anything elsewhere on the
// page that should react to the pen being picked up or set down — e.g.
// main.js pauses the homepage's typewriter and quote rotator while the pen
// is off drawing ink elsewhere, on the idea that the pen can't be writing
// the page's own text and doodling in the margin at the same time.
export function initQuillCursor({ onActivate, onDeactivate } = {}) {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const root = document.documentElement;
  let active = false;

  function deactivate() {
    if (!active) return;
    active = false;
    root.classList.remove('pen-active');
    onDeactivate?.();
  }

  document.addEventListener('contextmenu', (event) => event.preventDefault());

  window.addEventListener('mousedown', (event) => {
    if (event.button !== 2 || active) return;
    active = true;
    root.classList.add('pen-active');
    onActivate?.();
  });
  window.addEventListener('mouseup', (event) => {
    if (event.button === 2) deactivate();
  });
  window.addEventListener('blur', deactivate);
  document.addEventListener('mouseleave', deactivate);
}

// Bookkeeping for the homepage's one-time cover-page flourish (see
// .intro-overlay in style.css and the inline script beside #introOverlay in
// index.html, which already handles hiding it instantly on repeat visits or
// under reduced-motion — this only runs for a visitor actually watching the
// animation play). The CSS's own intro-fade-out keyframe already ends in
// visibility: hidden, so the overlay stops blocking clicks/scroll on its own
// even if this never ran; this just tidies it out of the DOM afterward and
// records that it's been seen, so it doesn't replay on the next page within
// the same tab session. TOTAL_MS mirrors the overlay's fade-out delay (2.5s)
// plus duration (0.6s) in style.css — keep the two in sync if either changes.
export function initIntroSignature(overlay) {
  if (!overlay || overlay.style.display === 'none') return;

  const TOTAL_MS = 3200;
  window.setTimeout(() => {
    overlay.style.display = 'none';
    sessionStorage.setItem('mdt-intro-seen', '1');
  }, TOTAL_MS);
}

// Wraps every word of the page's prose in its own <span class="magic-word">
// so CSS can glow a word on hover and fade it back out slowly (see .magic-word
// in style.css) — words catching a little of the pen's magic as you read.
// Runs once at load; nothing on the page adds new prose afterward, so there's
// no need to re-run it. Desktop/fine-pointer only (hover is meaningless on
// touch) and skipped under reduced-motion, matching the rest of this file.
export function initMagicWords() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const paragraphs = document.querySelectorAll('main p');

  paragraphs.forEach((p) => {
    const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        // Company names like "Veterans United Home Loans" render via a
        // background-clip: text gradient on the <a> itself (see .brand-link/
        // .brand-veterans-united etc. in style.css), which depends on the
        // anchor owning its text directly. Splitting that text into child
        // <span> word-wraps moves the actual glyphs onto children that
        // inherit color: transparent from the anchor but not its gradient/
        // background-clip (neither property is inherited) — the text was
        // rendering, just as transparent-on-transparent, invisible. Plain
        // links in prose don't need the hover-glow either, so anchor text is
        // skipped entirely rather than special-cased just for brand-link.
        if (node.parentElement.closest('a')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) textNodes.push(node);

    textNodes.forEach((textNode) => {
      const fragment = document.createDocumentFragment();
      // capturing group keeps the whitespace runs as their own array entries,
      // so they can be re-inserted as plain text between the word spans
      textNode.nodeValue.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          fragment.appendChild(document.createTextNode(part));
        } else {
          const span = document.createElement('span');
          span.className = 'magic-word';
          span.textContent = part;
          fragment.appendChild(span);
        }
      });
      textNode.parentNode.replaceChild(fragment, textNode);
    });
  });
}

// Fills a fixed vertical ribbon along the page edge as the visitor scrolls,
// like a bookmark tracking how far into the journal they've read.
export function initScrollRibbon(fillEl) {
  if (!fillEl) return;

  let ticking = false;
  function update() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const pct = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
    fillEl.style.height = `${pct * 100}%`;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  });
  window.addEventListener('resize', update);
  update();
}

// A soft brass/teal glow that trails the mouse with a bit of lag — only while
// the quill is active (right-click held, see initQuillCursor), so the default
// cursor stays plain and this reads as something the pen does, not ambient
// page decoration. Skipped on touch devices and under reduced-motion.
export function initInkCursor(el) {
  if (!el) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const CURSOR_LAG = 0.18;
  const SETTLE_DISTANCE = 0.5; // px; how close x/y must ease to target before the idle loop stops itself

  const root = document.documentElement;
  let targetX = 0;
  let targetY = 0;
  let x = 0;
  let y = 0;
  let active = false;
  let looping = false;

  // Only keeps requestAnimationFrame going while there's actual easing left to
  // do — either the pen is still active, or it just deactivated and x/y
  // haven't finished catching up to the last target yet. Without this the
  // loop would otherwise run forever from page load on every visit, even for
  // the vast majority of visitors who never right-click to use the pen.
  function tick() {
    x += (targetX - x) * CURSOR_LAG;
    y += (targetY - y) * CURSOR_LAG;
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;

    if (!active && Math.abs(targetX - x) < SETTLE_DISTANCE && Math.abs(targetY - y) < SETTLE_DISTANCE) {
      looping = false;
      return;
    }
    requestAnimationFrame(tick);
  }

  function startLoop() {
    if (looping) return;
    looping = true;
    requestAnimationFrame(tick);
  }

  function hide() {
    active = false;
    el.classList.remove('is-active');
  }

  window.addEventListener('mousemove', (event) => {
    if (!root.classList.contains('pen-active')) return;
    targetX = event.clientX;
    targetY = event.clientY;
    if (!active) {
      active = true;
      x = targetX;
      y = targetY;
      el.classList.add('is-active');
      startLoop();
    }
  });

  document.addEventListener('mouseleave', hide);
  window.addEventListener('mouseup', (event) => {
    if (event.button === 2) hide();
  });
  // Alt-Tabbing away while the right mouse button is still held never fires
  // mouseup, so without this the glow is left stuck fully opaque on screen —
  // initQuillCursor's own deactivate() already handles this same blur path
  // for the pen-active class itself.
  window.addEventListener('blur', hide);
}

// A trail of small falling code glyphs (mostly 0/1, with an occasional
// bracket/symbol) that streams out along the cursor's path, like the page's
// own digital-rain background (see cover-scene.js, which this reuses the
// brass/teal palette from) responding to the pen. Only accumulates points
// while the quill is active (right-click held, see initQuillCursor) — points
// already laid down keep fading naturally after release, like the pen lifting
// off the page. Also keeps dripping a glyph at the last known spot on an
// interval while held even if the mouse doesn't move, rather than only
// landing characters in response to movement. Same desktop/fine-pointer +
// reduced-motion gating as initInkCursor.
//
// Each point remembers when it landed and holds full opacity for HOLD_MS
// before fading over FADE_MS — every frame the whole trail is cleared and
// redrawn from the point buffer with per-glyph opacity based on that point's
// own age, rather than eroding the whole canvas uniformly every frame (which
// made even just-drawn glyphs start dimming immediately instead of staying
// crisp). Once past HOLD_MS a point also eases downward (fallOffset), so the
// tail of the trail visibly sinks as it fades, echoing the rain falling
// behind it rather than just fading in place.
//
// A handful of smaller sparkle glyphs also spawn per trail point and per
// drip, drifting down with a touch of gravity and fading over their own short
// life — stray characters flaking off the main trail, whether the pen is
// moving or just held still.
//
// New trail points are only spawned once the pointer has moved roughly one
// character-cell's width (MIN_POINT_SPACING) since the last one, rather than
// on every mousemove — mousemove fires far more often than that, and without
// the throttle the glyphs would land close enough to overlap into an
// unreadable smear instead of reading as a spaced-out string of characters.
//
// Points are remembered in page coordinates (event.pageX/pageY) so glyphs
// stay put at whatever spot on the page they landed — but the canvas itself
// stays viewport-sized and fixed (cheap to clear every frame), translating
// each point by the *current* scroll offset only at draw time. An earlier
// version instead sized the canvas to the whole ~18,000px document, which
// blew its backing store up to tens of millions of pixels — past typical GPU
// texture-size limits on some hardware, and expensive to recomposite on every
// scroll/frame regardless. That version also only ever cleared a
// viewport-sized rect each frame, so ink below the first screen of content
// was never erased and stopped fading entirely. Keeping the canvas small
// fixes both at once.
export function initInkTrail(canvas) {
  if (!canvas) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d');
  const HOLD_MS = 400;
  const FADE_MS = 1400;
  const FALL_DISTANCE = 40; // how far a point has sagged by the time it fully fades, in CSS px
  const TRAIL_FONT_SIZE = 13;
  const MIN_POINT_SPACING = 16; // px between trail glyphs, roughly one character cell

  // Same brass/teal duo the digital-rain background (cover-scene.js) draws
  // its own columns in, so this reads as the same effect rather than a
  // clashing second color scheme layered on top.
  const TRAIL_BRASS = '221, 185, 117'; // --brass-bright
  const TRAIL_TEAL = '107, 156, 137'; // --teal-bright
  // weighted toward 0/1 with a handful of code-ish symbols mixed in
  const TRAIL_CHARS = ['0', '1', '0', '1', '0', '1', '0', '1', '0', '1', '{', '}', '<', '>'];

  function randomTrailChar() {
    return TRAIL_CHARS[(Math.random() * TRAIL_CHARS.length) | 0];
  }

  function randomTrailColor() {
    return Math.random() < 0.55 ? TRAIL_BRASS : TRAIL_TEAL;
  }

  // eased droop running across the point's *entire* life (not gated behind
  // HOLD_MS like the fade is) — gravity pulling each glyph down the page as
  // it fades, same spirit as the sparkles' fall. Deliberately on its own
  // clock rather than tied to the fade-out progress: tying the two together
  // made the sag only become noticeable once the glyph was already too faint
  // to see it happening.
  function fallOffset(age) {
    const progress = Math.max(0, Math.min(1, age / (HOLD_MS + FADE_MS)));
    return progress * progress * FALL_DISTANCE;
  }

  // canvas.width/height are backing-store (device) pixels; drawing calls stay
  // in CSS pixels via setTransform so the trail's line width/coords don't
  // need separate dpr math sprinkled through every draw call below
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  let points = [];
  let sparkles = [];

  function spawnSparkles(x, y) {
    const count = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      sparkles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 0.4,
        vy: 0.35 + Math.random() * 0.45,
        size: 8 + Math.random() * 3,
        char: randomTrailChar(),
        t: performance.now(),
        life: 650 + Math.random() * 450,
        color: randomTrailColor(),
      });
    }
  }

  // tracked regardless of pen-active, so whatever position the pen was last
  // known at is ready the instant it activates, even before the next real move
  let lastX = 0;
  let lastY = 0;
  let lastDripTime = 0;
  const DRIP_INTERVAL_MS = 90;

  function spawnGlyphPoint(x, y) {
    points.push({ x, y, t: performance.now(), char: randomTrailChar(), color: randomTrailColor() });
  }

  // last spot a trail glyph actually landed, distinct from lastX/lastY (every
  // mousemove) — spawnGlyphPoint only fires once the pointer has moved past
  // MIN_POINT_SPACING from here, so the trail reads as spaced-out characters
  let lastSpawnX = 0;
  let lastSpawnY = 0;
  let hasSpawned = false;

  window.addEventListener('mousemove', (event) => {
    lastX = event.pageX;
    lastY = event.pageY;
    if (!document.documentElement.classList.contains('pen-active')) return;
    const dx = lastX - lastSpawnX;
    const dy = lastY - lastSpawnY;
    if (hasSpawned && dx * dx + dy * dy < MIN_POINT_SPACING * MIN_POINT_SPACING) return;
    spawnGlyphPoint(lastX, lastY);
    spawnSparkles(lastX, lastY);
    lastSpawnX = lastX;
    lastSpawnY = lastY;
    hasSpawned = true;
    lastDripTime = performance.now();
  });

  document.addEventListener('mouseleave', () => {
    points = [];
    sparkles = [];
  });

  // draw() below stops rescheduling itself once there's nothing left to
  // animate (pen inactive and every point/sparkle has faded) — without this
  // the loop would otherwise run forever from page load on every visit, doing
  // a full clearRect plus two array filters every frame, even for the vast
  // majority of visitors who never right-click to use the pen. Right-mousedown
  // is tracked directly here (same trigger initQuillCursor itself listens
  // for) rather than threaded through as a callback, so this stays self-
  // contained instead of requiring every caller to wire it up.
  let looping = false;
  function startDraw() {
    if (looping) return;
    looping = true;
    requestAnimationFrame(draw);
  }
  window.addEventListener('mousedown', (event) => {
    if (event.button === 2) startDraw();
  });

  function drawSparkle(s, now, scrollX, scrollY) {
    const age = now - s.t;
    const lifeRatio = Math.max(0, 1 - age / s.life);
    if (lifeRatio <= 0) return;

    s.x += s.vx;
    s.y += s.vy;
    s.vy += 0.012;

    const rx = s.x - scrollX;
    const ry = s.y - scrollY;
    ctx.font = `700 ${s.size.toFixed(1)}px "JetBrains Mono", ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgba(${s.color}, ${lifeRatio.toFixed(3)})`;
    ctx.shadowColor = `rgba(${s.color}, ${(0.7 * lifeRatio).toFixed(3)})`;
    ctx.shadowBlur = 4;
    ctx.fillText(s.char, rx, ry);
  }

  function draw() {
    const now = performance.now();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    // holding the pen still (no mousemove) would otherwise mean no new points
    // ever land, since those only used to come from the mousemove listener —
    // this keeps the tip "leaking" a glyph at the last known spot on an
    // interval, so the trail keeps growing even without moving the mouse
    if (document.documentElement.classList.contains('pen-active') && now - lastDripTime > DRIP_INTERVAL_MS) {
      spawnGlyphPoint(lastX, lastY);
      spawnSparkles(lastX, lastY);
      lastDripTime = now;
    }

    points = points.filter((point) => now - point.t < HOLD_MS + FADE_MS);
    sparkles = sparkles.filter((s) => now - s.t < s.life);

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.font = `700 ${TRAIL_FONT_SIZE}px "JetBrains Mono", ui-monospace, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    points.forEach((point) => {
      const age = now - point.t;
      const opacity = age <= HOLD_MS ? 1 : Math.max(0, 1 - (age - HOLD_MS) / FADE_MS);
      if (opacity <= 0) return;

      const fall = fallOffset(age);
      const rx = point.x - scrollX;
      const ry = point.y - scrollY + fall;
      ctx.fillStyle = `rgba(${point.color}, ${(0.9 * opacity).toFixed(3)})`;
      ctx.shadowColor = `rgba(${point.color}, ${(0.55 * opacity).toFixed(3)})`;
      ctx.shadowBlur = 5;
      ctx.fillText(point.char, rx, ry);
    });

    sparkles.forEach((s) => drawSparkle(s, now, scrollX, scrollY));

    const stillPenActive = document.documentElement.classList.contains('pen-active');
    if (!stillPenActive && points.length === 0 && sparkles.length === 0) {
      looping = false;
      return;
    }
    requestAnimationFrame(draw);
  }
}
