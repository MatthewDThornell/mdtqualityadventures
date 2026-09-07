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

// A soft ink-glow that trails the mouse with a bit of lag — only while the
// quill is active (right-click held, see initQuillCursor), so the default
// cursor stays plain and this reads as something the pen does, not ambient
// page decoration. Skipped on touch devices and under reduced-motion.
export function initInkCursor(el) {
  if (!el) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const root = document.documentElement;
  let targetX = 0;
  let targetY = 0;
  let x = 0;
  let y = 0;
  let active = false;

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
    }
  });

  document.addEventListener('mouseleave', hide);
  window.addEventListener('mouseup', (event) => {
    if (event.button === 2) hide();
  });

  function raf() {
    x += (targetX - x) * 0.18;
    y += (targetY - y) * 0.18;
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}

// A brass ink stroke that draws itself along the cursor's path and fades like
// wet ink drying, rather than a single glow dot. Only accumulates points while
// the quill is active (right-click held, see initQuillCursor) — points already
// laid down keep fading naturally after release, like lifting the pen off the
// page. Also keeps dripping a point at the last known spot on an interval
// while held even if the mouse doesn't move, like a leaking nib, rather than
// only landing ink in response to movement. Same desktop/fine-pointer +
// reduced-motion gating as initInkCursor.
//
// Each point remembers when it landed and holds full opacity for HOLD_MS
// before fading over FADE_MS — every frame the whole trail is cleared and
// redrawn from the point buffer with per-segment opacity based on that point's
// own age, rather than eroding the whole canvas uniformly every frame (which
// made even just-drawn ink start dimming immediately instead of staying wet).
// Once past HOLD_MS a point also eases downward (fallOffset), so the tail of
// the trail visibly sags/drips as it dries rather than fading in place.
//
// A handful of small sparkle particles also spawn per mousemove and per drip,
// drifting down with a touch of gravity and fading over their own short life —
// the "magic" falling out of the pen tip alongside the ink itself, whether the
// pen is moving or just held still.
//
// Every point is stamped with the id of the stroke it belongs to (bumped on
// each right-mousedown), and a segment is only drawn between two points that
// share a stroke id — otherwise a point still fading from a previous stroke
// (drawn, released, and then the pen pressed again elsewhere before it fully
// fades) would get connected to the new stroke with a straight line across
// the page, reading as one continuous scribble instead of two separate marks.
//
// Points are remembered in page coordinates (event.pageX/pageY) so ink stays
// put at whatever spot on the page it was drawn — but the canvas itself
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

  // eased droop running across the point's *entire* life (not gated behind
  // HOLD_MS like the fade is) — gravity pulling the wet ink down the page as
  // it dries, same spirit as the sparkles' fall. Deliberately on its own
  // clock rather than tied to the fade-out progress: tying the two together
  // made the sag only become noticeable once the ink was already too faint
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
  const SPARKLE_COLORS = ['221,185,117', '243,234,217']; // brass-bright, parchment

  function spawnSparkles(x, y) {
    const count = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      sparkles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 0.4,
        vy: 0.3 + Math.random() * 0.4,
        size: 1.5 + Math.random() * 2,
        t: performance.now(),
        life: 700 + Math.random() * 500,
        color: SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)],
      });
    }
  }

  // tracked regardless of pen-active, so whatever position the pen was last
  // known at is ready the instant it activates, even before the next real move
  let lastX = 0;
  let lastY = 0;
  let lastDripTime = 0;
  const DRIP_INTERVAL_MS = 90;

  // bumped every time the pen is freshly pressed down (right-mousedown, same
  // trigger as initQuillCursor's activation) and stamped onto every point as
  // it lands. Two points only get a line drawn between them if they share a
  // stroke id — otherwise a still-fading point from a previous stroke (e.g.
  // one drawn, released, scrolled away from, then the pen pressed again
  // somewhere else on the page while it's within its ~1.8s fade window) would
  // get a straight line connecting it to wherever the new stroke starts,
  // looking like one continuous scribble across two unrelated drawings.
  let strokeId = 0;
  window.addEventListener('mousedown', (event) => {
    if (event.button === 2) strokeId++;
  });

  window.addEventListener('mousemove', (event) => {
    lastX = event.pageX;
    lastY = event.pageY;
    if (!document.documentElement.classList.contains('pen-active')) return;
    points.push({ x: lastX, y: lastY, t: performance.now(), stroke: strokeId });
    spawnSparkles(lastX, lastY);
    lastDripTime = performance.now();
  });

  document.addEventListener('mouseleave', () => {
    points = [];
    sparkles = [];
  });

  function drawSparkle(s, now, scrollX, scrollY) {
    const age = now - s.t;
    const lifeRatio = Math.max(0, 1 - age / s.life);
    if (lifeRatio <= 0) return;

    s.x += s.vx;
    s.y += s.vy;
    s.vy += 0.012;

    const size = s.size * (0.4 + 0.6 * lifeRatio);
    const rx = s.x - scrollX;
    const ry = s.y - scrollY;
    ctx.save();
    ctx.globalAlpha = lifeRatio;
    ctx.strokeStyle = `rgb(${s.color})`;
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.shadowColor = `rgb(${s.color})`;
    ctx.shadowBlur = 3;
    ctx.beginPath();
    ctx.moveTo(rx - size, ry);
    ctx.lineTo(rx + size, ry);
    ctx.moveTo(rx, ry - size);
    ctx.lineTo(rx, ry + size);
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    const now = performance.now();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    // holding the pen still (no mousemove) would otherwise mean no new points
    // ever land, since those only used to come from the mousemove listener —
    // this keeps the tip "leaking" a drip at the last known spot on an
    // interval, so the ink keeps landing even without moving the mouse
    if (document.documentElement.classList.contains('pen-active') && now - lastDripTime > DRIP_INTERVAL_MS) {
      points.push({ x: lastX, y: lastY, t: now, stroke: strokeId });
      spawnSparkles(lastX, lastY);
      lastDripTime = now;
    }

    points = points.filter((point) => now - point.t < HOLD_MS + FADE_MS);
    sparkles = sparkles.filter((s) => now - s.t < s.life);

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      const prev = points[i - 1];
      if (point.stroke !== prev.stroke) continue;

      const age = now - point.t;
      const opacity = age <= HOLD_MS ? 1 : Math.max(0, 1 - (age - HOLD_MS) / FADE_MS);
      if (opacity <= 0) continue;

      const prevFall = fallOffset(now - prev.t);
      const fall = fallOffset(age);
      ctx.beginPath();
      ctx.moveTo(prev.x - scrollX, prev.y - scrollY + prevFall);
      ctx.lineTo(point.x - scrollX, point.y - scrollY + fall);
      ctx.lineCap = 'round';
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = `rgba(221, 185, 117, ${0.3 * opacity})`;
      ctx.shadowColor = `rgba(201, 161, 90, ${0.35 * opacity})`;
      ctx.shadowBlur = 4;
      ctx.stroke();
    }

    sparkles.forEach((s) => drawSparkle(s, now, scrollX, scrollY));

    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}
