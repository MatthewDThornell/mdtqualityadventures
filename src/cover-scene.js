const CHARSET = '01{}<>/\\=+*✓✗ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const FONT_SIZE = 16;
const TRAIL_LENGTH = 14;
const BRASS = '201, 161, 90';
const TEAL = '107, 156, 137';

function randomChar() {
  return CHARSET[(Math.random() * CHARSET.length) | 0];
}

function makeColumn(totalRows) {
  return {
    head: -((Math.random() * totalRows) | 0),
    speed: 4 + Math.random() * 5, // rows per second
    color: Math.random() < 0.5 ? BRASS : TEAL,
  };
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
  }

  function drawFrame() {
    ctx.clearRect(0, 0, width, height);

    columns.forEach((col, i) => {
      const x = i * FONT_SIZE;
      for (let t = 0; t < TRAIL_LENGTH; t++) {
        const row = Math.floor(col.head) - t;
        if (row < 0 || row * FONT_SIZE > height) continue;
        const alpha = (1 - t / TRAIL_LENGTH) * 0.4;
        if (alpha <= 0.01) continue;
        ctx.fillStyle = `rgba(${col.color}, ${alpha.toFixed(3)})`;
        ctx.fillText(randomChar(), x, row * FONT_SIZE);
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
