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
const FONT_SIZE = 16;
const TRAIL_LENGTH = 14;
const BRASS = '201, 161, 90';
const TEAL = '107, 156, 137';
const WORD_HIGHLIGHT = '221, 185, 117'; // brighter brass, so spelled-out words pop against the noise

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
  return {
    head: -((Math.random() * totalRows) | 0),
    speed: 4 + Math.random() * 5, // rows per second
    color: Math.random() < 0.5 ? BRASS : TEAL,
    word: Math.random() < WORD_COLUMN_CHANCE ? randomWord() : null,
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

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = `${FONT_SIZE}px "Spectral", monospace`;
    ctx.textBaseline = 'top';

    totalRows = Math.ceil(height / FONT_SIZE) + TRAIL_LENGTH;
    const columnCount = Math.ceil(width / FONT_SIZE);
    columns = Array.from({ length: columnCount }, () => makeColumn(totalRows));

    const textEl = canvas.parentElement.querySelector('.container');
    if (textEl) {
      const textRect = textEl.getBoundingClientRect();
      textZone = { left: textRect.left - rect.left, right: textRect.right - rect.left };
    }
  }

  function drawFrame() {
    ctx.clearRect(0, 0, width, height);

    columns.forEach((col, i) => {
      const x = i * FONT_SIZE;
      const zoneMult = textZoneMultiplier(x);
      for (let t = 0; t < TRAIL_LENGTH; t++) {
        const row = Math.floor(col.head) - t;
        if (row < 0 || row * FONT_SIZE > height) continue;
        const alpha = (1 - t / TRAIL_LENGTH) * (col.word ? 0.85 : 0.4) * zoneMult;
        if (alpha <= 0.01) continue;
        ctx.fillStyle = `rgba(${col.word ? WORD_HIGHLIGHT : col.color}, ${alpha.toFixed(3)})`;
        ctx.fillText(charAtRow(col, row, i), x, row * FONT_SIZE);
      }
    });
  }

  let frameId = null;
  let lastTime = 0;

  function tick(now) {
    const delta = lastTime ? (now - lastTime) / 1000 : 0;
    lastTime = now;

    columns.forEach((col) => {
      col.head += col.speed * delta;
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
