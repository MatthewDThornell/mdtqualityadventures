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
const WORD_COLUMN_CHANCE = 0.18;
const FONT_SIZE = 20;
const TRAIL_LENGTH = 9;
const TARGET_FPS = 30;
const FRAME_INTERVAL = 1000 / TARGET_FPS;
const TEXT_ZONE_REFRESH_FRAMES = 6; // getBoundingClientRect() forces a layout read; no need every frame
const BRASS = '201, 161, 90';
const TEAL = '107, 156, 137';
const WORD_HIGHLIGHT = '221, 185, 117'; // brighter brass, so spelled-out words pop against the noise

// word columns borrow the site's own display typeface, so the words that
// surface out of the noise read as intentional/branded rather than random
const WORD_FONT = `italic 500 ${FONT_SIZE}px "Cormorant Garamond", serif`;
// noise columns stay mostly in the familiar code-rain monospace, with an
// occasional italic/bold variant so the background isn't perfectly uniform
const NOISE_FONTS = [
  `${FONT_SIZE}px monospace`,
  `${FONT_SIZE}px monospace`,
  `${FONT_SIZE}px monospace`,
  `italic ${FONT_SIZE}px monospace`,
  `bold ${FONT_SIZE}px monospace`,
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

function randomWord() {
  return WORDS[(Math.random() * WORDS.length) | 0];
}

function makeColumn(totalRows) {
  const word = Math.random() < WORD_COLUMN_CHANCE ? randomWord() : null;
  return {
    head: -((Math.random() * totalRows) | 0),
    speed: 8 + Math.random() * 10, // rows per second (2x)
    color: Math.random() < 0.5 ? BRASS : TEAL,
    word,
    font: word ? WORD_FONT : randomNoiseFont(),
  };
}

function charAtRow(col, row, columnIndex) {
  if (!col.word) return hashChar(columnIndex * 9973 + row);
  const i = ((row % col.word.length) + col.word.length) % col.word.length;
  return col.word[i];
}

export function initCoverScene(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.style.display = 'none';
    return { pause() {}, resume() {} };
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width = 0;
  let height = 0;
  let totalRows = 0;
  let columns = [];
  let textZone = null; // { left, right } of the cover's text column, in canvas-local px

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

  const textEl = document.querySelector('.cover .container');
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
    columns = Array.from({ length: columnCount }, () => makeColumn(totalRows));
  }

  function drawFrame() {
    ctx.clearRect(0, 0, width, height);
    if (drawCount % TEXT_ZONE_REFRESH_FRAMES === 0) updateTextZone();
    drawCount++;

    columns.forEach((col, i) => {
      const x = i * FONT_SIZE;
      const zoneMult = textZoneMultiplier(x);
      ctx.font = col.font;
      for (let t = 0; t < TRAIL_LENGTH; t++) {
        const row = Math.floor(col.head) - t;
        if (row < 0 || row * FONT_SIZE > height) continue;
        const alpha = (1 - t / TRAIL_LENGTH) * (col.word ? 0.95 : 0.52) * zoneMult;
        if (alpha <= 0.01) continue;
        ctx.fillStyle = `rgba(${col.word ? WORD_HIGHLIGHT : col.color}, ${alpha.toFixed(3)})`;
        ctx.fillText(charAtRow(col, row, i), x, row * FONT_SIZE);
      }
    });
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
        Object.assign(col, makeColumn(totalRows));
      }
    });

    drawFrame();
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
    resize();
    start();
  }

  window.addEventListener('resize', resize);
  resize();

  if (prefersReducedMotion) {
    drawFrame();
  } else {
    start();
  }

  return { pause, resume };
}
