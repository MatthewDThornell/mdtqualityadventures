// Counts the "by the numbers" strip up from zero the first time it scrolls
// into view. The markup already carries each final value ("7+", "80%"), so
// without JS — or under reduced motion — the real numbers simply sit there;
// this only borrows them for a second and hands them back.
export function initFigures(root) {
  if (!root) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const numbers = Array.from(root.querySelectorAll('[data-count]'));
  if (numbers.length === 0) return;

  const DURATION = 1200;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  const countUp = (el) => {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / DURATION);
      el.textContent = `${Math.round(easeOut(progress) * target)}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      numbers.forEach(countUp);
    },
    { threshold: 0.4 },
  );
  observer.observe(root);
}
