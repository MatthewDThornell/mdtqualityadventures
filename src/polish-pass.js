// Tyler details cars; his card details itself.
//
// Once the testimony has finished typing (src/type-reveal.js, with his van for
// a cursor), a microfibre rag passes across the card and leaves the shine
// behind it — the same thing he does to a paint job, done to the words about
// him. Everything visible here is CSS; this only waits for the last line to
// land, starts the pass, and marks the card polished when the rag is done.
//
// The rag is decorative and aria-hidden: nothing it does changes a word of the
// card, so a screen reader, a crawler or a test sees the finished testimony
// whether the pass runs, is still running, or never runs at all.
export function initPolishPass(body, lines) {
  const targets = Array.from(lines ?? []);
  if (!body || targets.length === 0) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const pass = document.createElement('span');
  pass.className = 'polish-pass';
  pass.setAttribute('aria-hidden', 'true');
  pass.innerHTML = '<span class="polish-rag"></span>';
  body.appendChild(pass);

  // type-revealed bubbles from each line as it finishes; the pass waits for
  // the last of them rather than counting, so it stays right if a line is
  // added to the card or the order changes
  body.addEventListener('type-revealed', () => {
    if (!targets.every((el) => el.classList.contains('tw-written'))) return;
    if (body.classList.contains('is-polishing') || body.classList.contains('is-polished')) return;
    body.classList.add('is-polishing');
    pass.addEventListener(
      'animationend',
      () => {
        body.classList.remove('is-polishing');
        body.classList.add('is-polished');
        body.dispatchEvent(new CustomEvent('polished', { bubbles: true }));
      },
      { once: true },
    );
  });
}
