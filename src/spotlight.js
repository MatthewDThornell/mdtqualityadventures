// Arrow controls for a scroll-snapped card rail (the mentee "Where Are They
// Now?" spotlight). The rail already pages correctly on its own — swipe,
// shift-scroll and the keyboard all work through native overflow scrolling, so
// this only adds the buttons, the counter, and arrow-key shortcuts on top. If
// this never runs, the section degrades to a plain horizontal scroller.
export function initSpotlight(root) {
  if (!root) return;

  const track = root.querySelector('[data-spotlight-track]');
  const prevBtn = root.querySelector('[data-spotlight-prev]');
  const nextBtn = root.querySelector('[data-spotlight-next]');
  const pager = root.querySelector('[data-spotlight-pager]');
  const slides = track ? Array.from(track.children) : [];

  if (!track || slides.length === 0) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Which slide is showing is derived from scrollLeft rather than tracked in a
  // variable, so a swipe or a trackpad flick updates the arrows and counter the
  // same way a button press does.
  const currentIndex = () => {
    const middle = track.scrollLeft + track.clientWidth / 2;
    let index = 0;
    slides.forEach((slide, i) => {
      if (slide.offsetLeft - track.offsetLeft < middle) index = i;
    });
    return index;
  };

  const goTo = (index) => {
    const target = slides[Math.max(0, Math.min(slides.length - 1, index))];
    if (!target) return;
    track.scrollTo({
      left: target.offsetLeft - track.offsetLeft,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  const sync = () => {
    const index = currentIndex();
    if (prevBtn) prevBtn.disabled = index <= 0;
    if (nextBtn) nextBtn.disabled = index >= slides.length - 1;
    if (pager) {
      const name = slides[index].dataset.spotlightName;
      pager.textContent = `${index + 1} / ${slides.length}`;
      // the visible counter is terse; assistive tech gets the person's name
      pager.setAttribute(
        'aria-label',
        name ? `${name}, story ${index + 1} of ${slides.length}` : '',
      );
    }
  };

  if (prevBtn) prevBtn.addEventListener('click', () => goTo(currentIndex() - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(currentIndex() + 1));

  track.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    goTo(currentIndex() + (event.key === 'ArrowRight' ? 1 : -1));
  });

  let ticking = false;
  track.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      sync();
      ticking = false;
    });
  });

  // slide widths are a percentage of the rail, so a resize moves the snap points
  window.addEventListener('resize', sync);

  sync();
}
