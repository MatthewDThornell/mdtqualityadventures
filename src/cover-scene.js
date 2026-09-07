const CHARSET = '01{}<>/\\=+*✓✗ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const WORDS = [
  'JAVASCRIPT', 'TYPESCRIPT', 'PYTHON', 'PLAYWRIGHT', 'CYPRESS', 'SELENIUM',
  'APPIUM', 'POSTMAN', 'JENKINS', 'DOCKER', 'GITHUB', 'AZURE', 'AUTOMATION',
  'REGRESSION', 'COVERAGE', 'QUALITY', 'SCRUM', 'CI/CD', 'API', 'QA',
  'QA MENTOR', 'FRIEND', 'CONTINUAL LEARNING', 'TROUBLE SHOOTER',
  'SEEKS FIRST TO UNDERSTAND', 'BUG HUNTER',
  'SOFTWARE DEVELOPMENT ENGINEER IN TEST', 'PROACTIVE HUMANIZATION',
  'WEB AUTOMATION', 'IOS AUTOMATION',
];
// fresh, original test-code flavor text (not pulled from any real test suite)
// so a couple of the columns read as "code being written" rather than words
const CODE_SNIPPETS = [
  '[TEST]', '[CATEGORY("QUALITY")]', '[CATEGORY("ASSURANCE")]',
  'ASYNC TASK', 'AWAIT PAGE.GOTOASYNC()', 'SOFT.EXPECTVISIBLE()',
  'SOFT.VERIFY()', 'HELLOANDWELCOME_ISVISIBLE()', 'FORUSERTOSEEPORTFOLIO',
  'PERSONISGREETED()', 'HR REP OR HIRING MANAGER GREETED',
  'THANKS FOR VISITING',
];
const WORD_COLUMN_CHANCE = 0.15;
const CODE_COLUMN_CHANCE = 0.12;
const FONT_SIZE = 20;
const TRAIL_LENGTH = 9;
const TARGET_FPS = 30;
const FRAME_INTERVAL = 1000 / TARGET_FPS;
const TEXT_ZONE_REFRESH_FRAMES = 6; // getBoundingClientRect() forces a layout read; no need every frame
const BRASS = '201, 161, 90';
const TEAL = '107, 156, 137';
const WORD_HIGHLIGHT = '221, 185, 117'; // brighter brass, so spelled-out words pop against the noise
const CODE_HIGHLIGHT = '150, 210, 185'; // brighter teal, so "code" columns pop with a cooler tone than words

// word columns borrow the site's own display typeface, so the words that
// surface out of the noise read as intentional/branded rather than random
const WORD_FONT = `italic 500 ${FONT_SIZE}px "Cormorant Garamond", serif`;
// code columns use the same mono the QA Standards page uses for real code,
// tying the two together
const CODE_FONT = `600 ${FONT_SIZE}px "JetBrains Mono", monospace`;
// noise columns stay mostly in the familiar code-rain monospace, with an
// occasional italic/bold variant, plus a dash of cursive for texture, so the
// background isn't perfectly uniform
const NOISE_FONTS = [
  `${FONT_SIZE}px monospace`,
  `${FONT_SIZE}px monospace`,
  `${FONT_SIZE}px monospace`,
  `italic ${FONT_SIZE}px monospace`,
  `bold ${FONT_SIZE}px monospace`,
  `600 ${FONT_SIZE * 1.15}px "Caveat", cursive`,
  `600 ${FONT_SIZE * 1.15}px "Caveat", cursive`,
];

function randomNoiseFont() {
  return NOISE_FONTS[(Math.random() * NOISE_FONTS.length) | 0];
}

// deterministic pseudo-random char, stable per (column, row) so nothing
// flickers — the only motion cue is the actual scroll, kept consistent
// across every column whether it's spelling a word or not
function hashChar(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  const frac = x - Math.floor(x);
  return CHARSET[(frac * CHARSET.length) | 0];
}

function randomWord(words) {
  return words[(Math.random() * words.length) | 0];
}

function randomCodeSnippet(codeSnippets) {
  return codeSnippets[(Math.random() * codeSnippets.length) | 0];
}

// Flanking skyline, drawn directly onto the same canvas/rAF loop as the rain
// so both share one real parallax system instead of a canvas plus a
// separately-animated DOM/CSS layer. Buildings are silhouettes — fillRect
// calls plus one gradient object per layer (see buildingsGradient below), no
// per-building shadowBlur/filter work — so a full set on both sides costs
// less per frame than the rain columns already running (each building is a
// couple of fillRect calls, versus every rain column doing TRAIL_LENGTH
// fillText calls with real font rasterization every frame). See
// initCoverScene's skylineHeroSelector option: only the homepage passes one,
// so qa-standards/TAU pay literally nothing for this.
const WINDOW_COLOR = '201, 161, 90'; // matches --brass
const BUILDING_MARGIN_MAX = 320; // px, matches the old CSS version's cap on ultra-wide monitors
const BUILDING_MARGIN_PAD = 32;
const WIN_W = 4;
const WIN_H = 5;
const WIN_GAP_X = 11;
const WIN_GAP_Y = 14;
const FAR_PARALLAX_PX = 26; // matches the old DOM version's far/near offsets, for continuity
const NEAR_PARALLAX_PX = 70;

// Local coordinates with the ground at y=0 — buildings extend upward into
// negative y, so drawing just adds whatever the *current* on-screen ground
// position is (the hero's live bottom edge, see updateHeroRect) without
// needing to regenerate anything as that position moves under scroll.
//
// Each building is 1-3 stacked "tiers" rather than one flat-top rectangle —
// a setback zoning silhouette (each tier narrower and centered on the one
// below, same idea as the Empire State Building's stepped profile) reads as
// far more like an actual skyscraper than a plain box, for one or two extra
// fillRect calls. Returns the tallest total height reached (base + tiers +
// spire) alongside the buildings, so the caller can size a single gradient
// that spans the whole layer rather than one per building.
function generateSkylineBuildings(marginWidth, maxHeight) {
  const buildings = [];
  let x = 0;
  let layerMaxHeight = 0;

  while (x < marginWidth) {
    const baseW = 40 + Math.random() * 55;
    const baseH = maxHeight * (0.3 + Math.random() * 0.5);
    const tiers = [{ x, w: baseW, yTop: -baseH, yBottom: 0 }];

    const tierRoll = Math.random();
    const tierCount = tierRoll < 0.15 ? 2 : tierRoll < 0.55 ? 1 : 0;
    for (let t = 0; t < tierCount; t++) {
      const prev = tiers[tiers.length - 1];
      const tierH = maxHeight * (0.12 + Math.random() * 0.22);
      const tierW = prev.w * (0.5 + Math.random() * 0.25);
      const tierX = prev.x + (prev.w - tierW) / 2;
      tiers.push({ x: tierX, w: tierW, yTop: prev.yTop - tierH, yBottom: prev.yTop });
    }

    const topTier = tiers[tiers.length - 1];
    const hasSpire = Math.random() < 0.22;
    const spireHeight = hasSpire ? 20 + Math.random() * 36 : 0;
    layerMaxHeight = Math.max(layerMaxHeight, -topTier.yTop + spireHeight);

    const windows = [];
    for (const tier of tiers) {
      for (let wy = tier.yTop + 10; wy < tier.yBottom - 8; wy += WIN_GAP_Y) {
        for (let wx = tier.x + 6; wx < tier.x + tier.w - 6 - WIN_W; wx += WIN_GAP_X) {
          if (Math.random() < 0.4) {
            windows.push({
              x: wx,
              y: wy,
              alpha: 0.18 + Math.random() * 0.47,
              flicker: Math.random() < 0.12,
              flickerSeed: Math.random() * 1000,
            });
          }
        }
      }
    }

    buildings.push({
      tiers,
      spireHeight,
      spireX: topTier.x + topTier.w / 2,
      spireTop: topTier.yTop,
      windows,
    });
    x += baseW + (Math.random() * 10 - 4);
  }

  return { buildings, maxHeight: layerMaxHeight };
}

function makeColumn(totalRows, words, codeSnippets) {
  const roll = Math.random();
  const kind = roll < WORD_COLUMN_CHANCE ? 'word' : roll < WORD_COLUMN_CHANCE + CODE_COLUMN_CHANCE ? 'code' : 'noise';
  const text = kind === 'word' ? randomWord(words) : kind === 'code' ? randomCodeSnippet(codeSnippets) : null;
  const font = kind === 'word' ? WORD_FONT : kind === 'code' ? CODE_FONT : randomNoiseFont();
  return {
    head: -((Math.random() * totalRows) | 0),
    speed: 8 + Math.random() * 10, // rows per second (2x)
    color: Math.random() < 0.5 ? BRASS : TEAL,
    kind,
    text,
    font,
  };
}

function charAtRow(col, row, columnIndex) {
  if (!col.text) return hashChar(columnIndex * 9973 + row);
  const i = ((row % col.text.length) + col.text.length) % col.text.length;
  return col.text[i];
}

export function initCoverScene(canvas, options = {}) {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.style.display = 'none';
    return { pause() {}, resume() {} };
  }

  const words = options.words ?? WORDS;
  const codeSnippets = options.codeSnippets ?? CODE_SNIPPETS;
  const textZoneSelector = options.textZoneSelector ?? '.cover .container';
  // opt-in only — omitted entirely by qa-standards.js/test-automation-university.js,
  // so every skyline-related read/generate/draw below short-circuits to nothing
  // for those two pages, not just "disabled but still checked"
  const heroEl = options.skylineHeroSelector ? document.querySelector(options.skylineHeroSelector) : null;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // read once rather than hardcoding 1100 a second time — stays in sync with
  // :root's --max-width (the same value driving the text column's own
  // centering) without this file needing to know that number independently
  const maxTextWidth = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--max-width')) || 1100;

  let width = 0;
  let height = 0;
  let totalRows = 0;
  let columns = [];
  let textZone = null; // { left, right } of the cover's text column, in canvas-local px

  let marginWidth = 0; // px available beside the text column for buildings; 0 = hidden
  let farBuildings = [];
  let nearBuildings = [];
  let farMaxHeight = 0; // tallest building in each layer, so drawSkylineLayer can size its gradient
  let nearMaxHeight = 0;
  let heroGroundY = null; // hero's live bottom edge in viewport px, or null while off-screen/disabled
  let heroProgress = 0; // 0..1 through the hero's own height, drives the parallax offset
  let heroOpacity = 1; // fades out as the ground line scrolls above the viewport, see updateHeroRect

  const TEXT_ZONE_PAD = 40; // breathing room beyond the measured text edges
  const TEXT_ZONE_FADE = 100; // width of the soft transition back to full brightness
  const TEXT_ZONE_MIN = 0.08; // how dim the rain gets directly behind the text

  function textZoneMultiplier(x) {
    if (!textZone) return 1;
    const left = textZone.left - TEXT_ZONE_PAD;
    const right = textZone.right + TEXT_ZONE_PAD;
    if (x >= left && x <= right) return TEXT_ZONE_MIN;
    const distOut = x < left ? left - x : x - right;
    if (distOut >= TEXT_ZONE_FADE) return 1;
    const t = distOut / TEXT_ZONE_FADE;
    const eased = t * t * (3 - 2 * t); // smoothstep
    return TEXT_ZONE_MIN + (1 - TEXT_ZONE_MIN) * eased;
  }

  const textEl = document.querySelector(textZoneSelector);
  let drawCount = 0;

  function updateTextZone() {
    if (!textEl) return;
    const textRect = textEl.getBoundingClientRect();
    // only dim behind the cover text while it's actually on screen; once the
    // visitor scrolls past it, textRect.bottom < 0 and the zone stops applying
    if (textRect.bottom < 0 || textRect.top > height) {
      textZone = null;
      return;
    }
    textZone = { left: textRect.left, right: textRect.right };
  }

  // Matches .cover's min-height: 92vh in style.css. The hero's actual
  // rect.bottom is NOT safe to anchor to — its content keeps the career-trail
  // list (see careerTrailList in main.js) appending new entries the whole
  // time the typewriter cycles, so the section's real height keeps growing
  // long after the visible "hero" part of it has scrolled by. A visitor who
  // lingers on the page sees that height grow past several viewports, which
  // made the old rect.bottom-based off-screen check never trigger — the
  // buildings kept rendering (anchored to the now-very-distant real bottom
  // edge) far down into completely unrelated chapters. rect.top, by
  // contrast, only reflects scroll position and is unaffected by content
  // growing below it, so anchoring off that instead fixes this at the root.
  const HERO_VIEWPORT_FRACTION = 0.92;

  // Same throttled-read idea as updateTextZone (getBoundingClientRect forces
  // layout, no need every frame) — the hero's live top edge in viewport px,
  // plus a fixed fraction of the viewport height, becomes the buildings'
  // "ground line" each frame, so they scroll with the page exactly like real
  // content would despite living on a fixed canvas; heroProgress (0 at the
  // top of the hero, 1 by its bottom) is what the parallax offset in
  // drawSkyline is scaled by.
  function updateHeroRect() {
    if (!heroEl || marginWidth <= 0) {
      heroGroundY = null;
      return;
    }
    const rect = heroEl.getBoundingClientRect();
    const groundY = rect.top + height * HERO_VIEWPORT_FRACTION;

    // Fades out over one viewport's worth of scroll once the ground line
    // rises above the top of the screen, rather than an abrupt on/off cutoff
    // — reads as the skyline scrolling away and sinking out of view, not
    // snapping out of existence mid-scroll. Below the fold (not reached yet)
    // still just skips outright — there's nothing to fade in from there,
    // it's simply not on screen yet.
    let opacity = 1;
    if (groundY < 0) {
      opacity = Math.max(0, 1 + groundY / height);
    } else if (groundY > height * 2) {
      opacity = 0;
    }
    if (opacity <= 0.01) {
      heroGroundY = null;
      return;
    }

    heroGroundY = groundY;
    heroOpacity = opacity;
    heroProgress = prefersReducedMotion ? 0 : Math.min(1, Math.max(0, -rect.top / (height * HERO_VIEWPORT_FRACTION)));
  }

  function resize() {
    // capped at 1: this is a decorative background of scrambled single
    // characters, not legible text — retina sharpness isn't worth 4x the
    // pixels (and fillText/GPU cost) on a high-DPI display
    const dpr = 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // plain monospace, not the "Spectral" webfont: system fonts rasterize
    // noticeably cheaper per glyph, and at this size nobody can tell
    ctx.font = `${FONT_SIZE}px monospace`;
    ctx.textBaseline = 'top';

    totalRows = Math.ceil(height / FONT_SIZE) + TRAIL_LENGTH;
    const columnCount = Math.ceil(width / FONT_SIZE);
    columns = Array.from({ length: columnCount }, () => makeColumn(totalRows, words, codeSnippets));

    // same self-hiding math as the old CSS clamp() version: however much
    // margin is actually left over beside the centered --max-width text
    // column, minus a little breathing room, capped on ultra-wide monitors —
    // guarantees buildings can never overlap the text at any viewport width
    if (heroEl) {
      marginWidth = Math.max(0, Math.min(BUILDING_MARGIN_MAX, (width - maxTextWidth) / 2 - BUILDING_MARGIN_PAD));
      if (marginWidth > 0) {
        ({ buildings: farBuildings, maxHeight: farMaxHeight } = generateSkylineBuildings(marginWidth, height * 0.46));
        ({ buildings: nearBuildings, maxHeight: nearMaxHeight } = generateSkylineBuildings(marginWidth, height * 0.66));
      } else {
        farBuildings = [];
        nearBuildings = [];
      }
    }
  }

  // A real tower doesn't catch light evenly — flat solid fill was the
  // biggest "obviously a rectangle" tell after the rooflines themselves, so
  // each layer gets one vertical gradient (lighter near the roofline, darker
  // toward the grounded/shadowed base) instead of one flat color. Built fresh
  // each call since groundY moves under scroll/parallax, but it's a single
  // cheap object with two color stops — far less work than the fillText
  // calls the rain is already doing every frame. The far layer's stops carry
  // their own alpha (not just a dimmer color), so it stays slightly
  // translucent — hazy enough that rain can faintly show through, which
  // reads as atmospheric distance rather than just "a smaller rectangle."
  function buildingsGradient(groundY, maxHeight, muted) {
    const grad = ctx.createLinearGradient(0, groundY - maxHeight, 0, groundY);
    if (muted) {
      grad.addColorStop(0, 'rgba(52, 64, 82, 0.55)');
      grad.addColorStop(1, 'rgba(6, 7, 9, 0.75)');
    } else {
      grad.addColorStop(0, '#1c2430');
      grad.addColorStop(1, '#07080a');
    }
    return grad;
  }

  // Drawn on top of the rain (after the columns loop below), within just the
  // narrow margin strips on each side — rain rendered directly behind a
  // building is simply overpainted by its silhouette, the same visual result
  // as the old DOM version's buildings sitting in front of the canvas, but
  // now both are one draw pass instead of a canvas plus a separately
  // z-indexed CSS layer. Each building is drawn as its stack of tiers (see
  // generateSkylineBuildings) rather than one rectangle, for the stepped
  // setback silhouette real towers actually have.
  function drawSkylineLayer(buildings, groundY, maxHeight, mirror, muted, now) {
    const baseX = mirror ? width - marginWidth : 0;
    ctx.fillStyle = buildingsGradient(groundY, maxHeight, muted);
    for (const b of buildings) {
      for (const tier of b.tiers) {
        const localX = mirror ? marginWidth - tier.x - tier.w : tier.x;
        ctx.fillRect(baseX + localX, groundY + tier.yTop, tier.w, tier.yBottom - tier.yTop);
      }
      if (b.spireHeight > 0) {
        const localSpireX = mirror ? marginWidth - b.spireX : b.spireX;
        ctx.fillRect(baseX + localSpireX - 1, groundY + b.spireTop - b.spireHeight, 2, b.spireHeight);
      }
    }
    // separate pass so the fillStyle only needs setting per-window (which
    // varies with alpha) rather than thrashing it back and forth with the
    // gradient fill above for every single building. win.x/win.y are already
    // absolute within the margin strip (same coordinate space as tier.x), so
    // they mirror the same simple way the tiers themselves do just above —
    // not relative to their own building or tier.
    for (const b of buildings) {
      for (const win of b.windows) {
        let alpha = win.alpha;
        if (win.flicker) alpha *= 0.5 + 0.5 * Math.sin(now / 900 + win.flickerSeed);
        const winX = mirror ? marginWidth - win.x - WIN_W : win.x;
        ctx.fillStyle = `rgba(${WINDOW_COLOR}, ${(alpha * (muted ? 0.7 : 1)).toFixed(3)})`;
        ctx.fillRect(baseX + winX, groundY + win.y, WIN_W, WIN_H);
      }
    }
  }

  function drawSkyline(now) {
    if (heroGroundY === null || marginWidth <= 0) return;
    const farY = heroGroundY + heroProgress * FAR_PARALLAX_PX;
    const nearY = heroGroundY + heroProgress * NEAR_PARALLAX_PX;
    // globalAlpha carries the scroll-fade from updateHeroRect — reset to 1
    // once done rather than leaving it set, since drawFrame's rain columns
    // (drawn every frame regardless of the skyline) would otherwise inherit
    // whatever alpha the skyline last left on the shared canvas context
    ctx.globalAlpha = heroOpacity;
    drawSkylineLayer(farBuildings, farY, farMaxHeight, false, true, now);
    drawSkylineLayer(farBuildings, farY, farMaxHeight, true, true, now);
    drawSkylineLayer(nearBuildings, nearY, nearMaxHeight, false, false, now);
    drawSkylineLayer(nearBuildings, nearY, nearMaxHeight, true, false, now);
    ctx.globalAlpha = 1;
  }

  function drawFrame(now) {
    ctx.clearRect(0, 0, width, height);
    if (drawCount % TEXT_ZONE_REFRESH_FRAMES === 0) {
      updateTextZone();
      updateHeroRect();
    }
    drawCount++;

    columns.forEach((col, i) => {
      const x = i * FONT_SIZE;
      const zoneMult = textZoneMultiplier(x);
      ctx.font = col.font;
      const highlight = col.kind === 'word' ? WORD_HIGHLIGHT : col.kind === 'code' ? CODE_HIGHLIGHT : null;
      for (let t = 0; t < TRAIL_LENGTH; t++) {
        const row = Math.floor(col.head) - t;
        if (row < 0 || row * FONT_SIZE > height) continue;
        const alpha = (1 - t / TRAIL_LENGTH) * (highlight ? 0.92 : 0.52) * zoneMult;
        if (alpha <= 0.01) continue;
        ctx.fillStyle = `rgba(${highlight || col.color}, ${alpha.toFixed(3)})`;
        ctx.fillText(charAtRow(col, row, i), x, row * FONT_SIZE);
      }
    });

    drawSkyline(now);
  }

  let frameId = null;
  let lastTime = 0;
  let accumulator = 0;

  function tick(now) {
    const delta = lastTime ? now - lastTime : 0;
    lastTime = now;
    accumulator += delta;

    // decouples actual redraw work from the monitor's native refresh rate —
    // on a 120/144Hz display the un-throttled loop was doing 2-4x the
    // fillText/layout work of a 60Hz one for a visual effect that doesn't
    // benefit from it, which is most of where the reported GPU load came from
    if (accumulator < FRAME_INTERVAL) {
      frameId = requestAnimationFrame(tick);
      return;
    }
    const stepSeconds = accumulator / 1000;
    accumulator = 0;

    columns.forEach((col) => {
      col.head += col.speed * stepSeconds;
      if ((col.head - TRAIL_LENGTH) * FONT_SIZE > height) {
        Object.assign(col, makeColumn(totalRows, words, codeSnippets));
      }
    });

    drawFrame(now);
    frameId = requestAnimationFrame(tick);
  }

  function start() {
    if (frameId === null && !prefersReducedMotion) {
      lastTime = 0;
      accumulator = 0;
      frameId = requestAnimationFrame(tick);
    }
  }

  function pause() {
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }
  }

  function resume() {
    // resize() rebuilds every column with fresh random words/snippets, so
    // only pay for that when the viewport actually changed while hidden —
    // otherwise every tab-switch-back re-randomizes the whole rain for no
    // visible reason.
    if (window.innerWidth !== width || window.innerHeight !== height) {
      resize();
    }
    start();
  }

  // dragging a window edge fires resize dozens of times a second; resize()
  // rebuilds every column (Array.from + makeColumn per column) each time,
  // which is real layout/GC work for a purely cosmetic background. Debounce
  // to one rebuild after the drag settles — the canvas just stretches via
  // its CSS width/height in between, imperceptible during a fast drag.
  const RESIZE_DEBOUNCE_MS = 150;
  let resizeTimer = null;
  function scheduleResize() {
    if (resizeTimer !== null) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizeTimer = null;
      resize();
    }, RESIZE_DEBOUNCE_MS);
  }

  window.addEventListener('resize', scheduleResize);
  resize();

  if (prefersReducedMotion) {
    drawFrame(0);
  } else {
    start();
  }

  return { pause, resume };
}
