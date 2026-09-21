// Every recommendation runs its own test case before its quote is allowed to
// decrypt. The test lives in a closed <details> above the quote, readable any
// time; while the card decodes, a copy of its code types out in a terminal
// laid exactly over the quote's box — which is only binary at that point —
// the summary flips from running to passed, the terminal lifts, and only then
// does the binary start to resolve. src/quote-decrypt.js calls runPrecheck and
// waits on it.
//
// The terminal is an overlay rather than the <details> opening because an
// opening block would grow the card and shove every card below it down the
// page — under a reader who had just scrolled to one of them. Laid over the
// quote, the run changes nothing about the card's size. Without JS, or under
// reduced motion, the card simply carries its closed, readable test.
import { typeInto, wait } from './type-into.js';

const MS_PER_CHAR = 2;
const PASSED_PAUSE = 350; // long enough to read "passed" before the terminal lifts

export function runPrecheck(card) {
  const test = card?.querySelector('.rec-test');
  const quote = card?.querySelector('blockquote');
  if (!test || !quote) return Promise.resolve();
  const status = test.querySelector('.rec-test-status');

  // a copy of the test's code, laid over the quote inside its own box (the
  // same positioned box the binary overlay fills); the original stays whole
  // inside the <details> for anyone who unfolds it
  const run = test.querySelector('.qa-code').cloneNode(true);
  run.classList.add('rec-test-run');
  run.setAttribute('aria-hidden', 'true');
  quote.appendChild(run);

  test.classList.add('is-running');
  if (status) status.textContent = 'running';

  return typeInto(run, MS_PER_CHAR)
    .then(() => {
      test.classList.remove('is-running');
      test.classList.add('is-passed');
      if (status) status.textContent = 'passed';
      return wait(PASSED_PAUSE);
    })
    .then(() => {
      run.remove();
    });
}
