// Plays a real game out on the Quality Knights card, on two boards at once:
// the same game seen from each player's side of the table, the way the two
// knights on the crest above it face each other.
//
// It knows no chess. scripts/generate-chess-replay.mjs did the thinking at
// build time and left behind, for every ply, the square the piece left, the
// square it arrived at, and the whole position afterwards. So this file slides
// one piece for the look of the thing and then sets the position it was handed
// — which is why castling, en passant and promotion all come out right without
// a rule being written here.
//
// One clock drives both boards, rather than two players running side by side,
// so they cannot drift apart.
import { GAME } from './chess-replay-game.js';

// The solid glyphs (U+265A-265F) for both armies, coloured apart in CSS. The
// outline set (U+2654-2659) is drawn thinner, so a board mixing the two has
// White looking spindly next to Black at this size; one shape per piece and a
// fill colour reads cleanly at 20px.
const GLYPHS = {
  k: '♚',
  q: '♛',
  r: '♜',
  b: '♝',
  n: '♞',
  p: '♟',
};

const SLIDE_MS = 300;

// 'e2' -> 52: a8 is 0 and h1 is 63, the order the position strings are written in.
function indexOf(square) {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]);
  return (8 - rank) * 8 + file;
}

// A board is 64 cells in display order plus a way back to the position index
// each one stands for. Flipping the board only changes that mapping: the
// squares keep their colours and the pieces keep their squares, the reader
// has just walked round the table.
function buildBoard(mount, flipped) {
  mount.classList.add('chess-board');
  mount.setAttribute('aria-hidden', 'true');
  const pieces = new Array(64);
  const cells = new Array(64);
  const slotOf = flipped ? (position) => 63 - position : (position) => position;

  for (let slot = 0; slot < 64; slot++) {
    const position = flipped ? 63 - slot : slot;
    const cell = document.createElement('span');
    // the colour belongs to the square itself, so it is read off the position
    // rather than the slot — a1 stays dark from either side of the board
    const dark = ((position >> 3) + (position & 7)) % 2 === 1;
    cell.className = `chess-square ${dark ? 'is-dark' : 'is-light'}`;
    const piece = document.createElement('span');
    piece.className = 'chess-piece';
    cell.appendChild(piece);
    mount.appendChild(cell);
    cells[position] = cell;
    pieces[position] = piece;
  }

  return { cells, pieces, slotOf };
}

export function initChessReplay(root, options = {}) {
  if (!root) return null;
  const mounts = root.querySelectorAll('[data-chess-board]');
  if (mounts.length === 0) return null;
  const msPerPly = options.msPerPly ?? 900;

  const boards = [...mounts].map((mount) =>
    buildBoard(mount, mount.hasAttribute('data-chess-flipped')),
  );

  // the position currently painted, so each ply only touches the two to four
  // squares that actually changed rather than rewriting all sixty-four
  let painted = '';
  function paint(position) {
    for (let i = 0; i < 64; i++) {
      if (position[i] === painted[i]) continue;
      const code = position[i];
      const glyph = code === '.' ? '' : GLYPHS[code.toLowerCase()];
      const white = code !== '.' && code === code.toUpperCase();
      const black = code !== '.' && code === code.toLowerCase();
      for (const board of boards) {
        const piece = board.pieces[i];
        piece.textContent = glyph;
        piece.classList.toggle('is-white', white);
        piece.classList.toggle('is-black', black);
      }
    }
    painted = position;
  }

  // How far through the game the boards are: no longer written anywhere a
  // reader can see, but it is the one honest handle a test has on a replay
  // whose only output is pictures.
  function markPly(index) {
    root.dataset.ply = String(index);
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) {
    // the finished game, stated rather than performed
    paint(GAME.plies[GAME.plies.length - 1][3]);
    markPly(GAME.plies.length);
    return { pause() {}, resume() {} };
  }

  paint(GAME.start);
  markPly(0);

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
      schedule(() => {
        clearHighlights();
        ply = 0;
        paint(GAME.start);
        markPly(0);
        schedule(step, msPerPly);
      }, msPerPly * 4);
      return;
    }

    const [, from, to, position] = GAME.plies[ply];
    const fromIndex = indexOf(from);
    const toIndex = indexOf(to);

    clearHighlights();
    const movers = [];
    for (const board of boards) {
      highlighted.push(board.cells[fromIndex], board.cells[toIndex]);
      board.cells[fromIndex].classList.add('is-last-move');
      board.cells[toIndex].classList.add('is-last-move');

      // one cell is 100% of a piece's own box, so the travel is just the
      // difference in file and rank between the two slots — no measuring, and
      // it survives a resize. On the flipped board both differences invert,
      // which falls out of the slot mapping on its own.
      const fromSlot = board.slotOf(fromIndex);
      const toSlot = board.slotOf(toIndex);
      const dx = (toSlot & 7) - (fromSlot & 7);
      const dy = (toSlot >> 3) - (fromSlot >> 3);
      const mover = board.pieces[fromIndex];
      mover.classList.add('is-sliding');
      mover.style.transform = `translate(${dx * 100}%, ${dy * 100}%)`;
      movers.push(mover);
    }

    ply += 1;
    markPly(ply);

    schedule(() => {
      for (const mover of movers) {
        mover.classList.remove('is-sliding');
        mover.style.transform = '';
      }
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
