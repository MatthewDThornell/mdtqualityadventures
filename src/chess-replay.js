// Plays a real game back on a small board, move by move.
//
// It knows no chess. scripts/generate-chess-replay.mjs did the thinking at
// build time and left behind, for every ply, the square the piece left, the
// square it arrived at, and the whole position afterwards. So this file slides
// one piece for the look of the thing and then sets the position it was handed
// — which is why castling, en passant and promotion all come out right without
// a rule being written here.
import { GAME } from './chess-replay-game.js';

// The solid glyphs (U+265A-265F) for both armies, coloured apart in CSS. The
// outline set (U+2654-2659) is drawn thinner, so a board mixing the two has
// White looking spindly next to Black at this size; one shape per piece and a
// fill colour reads cleanly at 24px.
const GLYPHS = {
  k: '♚',
  q: '♛',
  r: '♜',
  b: '♝',
  n: '♞',
  p: '♟',
};

const SLIDE_MS = 300;

// 'e2' -> 52: a8 is 0 and h1 is 63, the order the board is drawn in.
function indexOf(square) {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]);
  return (8 - rank) * 8 + file;
}

export function initChessReplay(root, options = {}) {
  if (!root) return null;
  const msPerPly = options.msPerPly ?? 900;

  const board = document.createElement('div');
  board.className = 'chess-board';
  board.setAttribute('aria-hidden', 'true');

  const cells = [];
  const pieces = [];
  for (let i = 0; i < 64; i++) {
    const cell = document.createElement('span');
    // a dark square wherever file and rank share a parity
    cell.className = `chess-square ${((i >> 3) + (i & 7)) % 2 ? 'is-dark' : 'is-light'}`;
    const piece = document.createElement('span');
    piece.className = 'chess-piece';
    cell.appendChild(piece);
    board.appendChild(cell);
    cells.push(cell);
    pieces.push(piece);
  }
  root.prepend(board);

  const moveEl = root.querySelector('[data-chess-move]');

  // the position currently painted, so each ply only touches the two to four
  // squares that actually changed rather than rewriting all sixty-four
  let painted = '';
  function paint(position) {
    for (let i = 0; i < 64; i++) {
      if (position[i] === painted[i]) continue;
      const code = position[i];
      const piece = pieces[i];
      piece.textContent = code === '.' ? '' : GLYPHS[code.toLowerCase()];
      piece.classList.toggle('is-white', code !== '.' && code === code.toUpperCase());
      piece.classList.toggle('is-black', code !== '.' && code === code.toLowerCase());
    }
    painted = position;
  }

  function showMove(index) {
    if (!moveEl) return;
    if (index < 0) {
      moveEl.textContent = GAME.result;
      return;
    }
    const [san] = GAME.plies[index];
    const number = Math.floor(index / 2) + 1;
    moveEl.textContent = index % 2 === 0 ? `${number}. ${san}` : `${number}... ${san}`;
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) {
    // the finished game, stated rather than performed
    paint(GAME.plies[GAME.plies.length - 1][3]);
    showMove(-1);
    return { pause() {}, resume() {} };
  }

  paint(GAME.start);
  showMove(-1);

  let ply = 0;
  let timer = null;
  let pauseCount = 0;
  let pending = null;
  let pendingDelay = 0;
  let highlighted = [];

  function schedule(fn, delay) {
    pending = fn;
    pendingDelay = delay;
    if (pauseCount > 0) return;
    timer = setTimeout(fn, delay);
  }

  function clearHighlights() {
    for (const cell of highlighted) cell.classList.remove('is-last-move');
    highlighted = [];
  }

  function step() {
    if (ply >= GAME.plies.length) {
      showMove(-1);
      schedule(() => {
        clearHighlights();
        ply = 0;
        paint(GAME.start);
        showMove(-1);
        schedule(step, msPerPly);
      }, msPerPly * 4);
      return;
    }

    const [, from, to, position] = GAME.plies[ply];
    const fromIndex = indexOf(from);
    const toIndex = indexOf(to);
    const mover = pieces[fromIndex];

    clearHighlights();
    highlighted = [cells[fromIndex], cells[toIndex]];
    for (const cell of highlighted) cell.classList.add('is-last-move');

    // one cell is 100% of a piece's own box, so the travel is just the
    // difference in file and rank — no measuring, and it survives a resize
    const dx = (toIndex & 7) - (fromIndex & 7);
    const dy = (toIndex >> 3) - (fromIndex >> 3);
    mover.classList.add('is-sliding');
    mover.style.transform = `translate(${dx * 100}%, ${dy * 100}%)`;

    showMove(ply);
    ply += 1;

    schedule(() => {
      mover.classList.remove('is-sliding');
      mover.style.transform = '';
      paint(position);
      schedule(step, msPerPly - SLIDE_MS);
    }, SLIDE_MS);
  }

  schedule(step, msPerPly);

  // A count rather than a flag, for the reason typewriter.js keeps one: the
  // tab going hidden and the card scrolling out of view pause this
  // independently, and whichever lets go first must not restart it underneath
  // the other.
  return {
    pause() {
      pauseCount += 1;
      if (pauseCount > 1) return;
      clearTimeout(timer);
      timer = null;
    },
    resume() {
      if (pauseCount === 0) return;
      pauseCount -= 1;
      if (pauseCount > 0 || !pending) return;
      timer = setTimeout(pending, pendingDelay);
    },
  };
}
