// The incident cards — Quaid, who fails, and the Anonymous User, who is
// blocked — are the recommendations that never pass on purpose. Once a card's
// quote has "decrypted" into its error (src/quote-decrypt.js flips the card's
// data-status to its outcome and fires quote-decrypted), this types out the
// investigation line by line — root cause or security protocol, the missing
// test case, and the Playwright test it generates — like a terminal thinking
// out loud.
//
// The report's full text is in the markup; this only hides it and reveals it
// again progressively, so without JS, or under reduced motion, the card reads
// exactly as written. Typing is paced by the clock rather than per frame,
// the same as the decrypt, so a slow frame just reveals more at once.
import { typeInto, wait } from './type-into.js';

const MS_PER_CHAR = 11; // log lines
const MS_PER_CODE_CHAR = 4; // the generated test — long, and a reader skims code
const LINE_PAUSE = 220;

export function initIncidentReport(card) {
  if (!card) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const report = card.querySelector('.qa-report');
  if (!report) return;

  // every line, and every fold (a bug report, the generated test), waits its turn
  const steps = Array.from(report.querySelectorAll('.qa-line, .qa-fold'));
  report.classList.add('is-typing');

  card.addEventListener(
    'quote-decrypted',
    async () => {
      for (const step of steps) {
        const fold = step.matches('.qa-fold');
        if (fold) {
          // a fold opens to be written into, then closes on its answer — the
          // arrow is there for anyone who wants it back
          step.open = true;
          step.classList.add('is-shown');
          const body = step.querySelector('.qa-code, .qa-bug');
          await typeInto(body, body.matches('.qa-code') ? MS_PER_CODE_CHAR : MS_PER_CHAR);
        } else {
          await typeInto(step, MS_PER_CHAR);
        }
        step.classList.add('is-done', 'is-waiting');
        await wait(Number(step.dataset.pause) || LINE_PAUSE);
        step.classList.remove('is-waiting');
        if (fold) step.open = false;
      }
      report.classList.remove('is-typing');
      report.classList.add('is-complete');
    },
    { once: true },
  );
}
