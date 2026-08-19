export function initTypewriter(el, phrases, options = {}) {
  const { typeSpeed = 55, deleteSpeed = 28, holdTime = 1600, pauseTime = 350 } = options;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion || phrases.length === 0) {
    el.textContent = phrases[0] ?? '';
    return { stop() {} };
  }

  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;
  let timeoutId = null;

  function tick() {
    const phrase = phrases[phraseIndex];

    if (!deleting) {
      charIndex++;
      el.textContent = phrase.slice(0, charIndex);
      if (charIndex === phrase.length) {
        deleting = true;
        timeoutId = setTimeout(tick, holdTime);
        return;
      }
      timeoutId = setTimeout(tick, typeSpeed);
      return;
    }

    charIndex--;
    el.textContent = phrase.slice(0, charIndex);
    if (charIndex === 0) {
      deleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      timeoutId = setTimeout(tick, pauseTime);
      return;
    }
    timeoutId = setTimeout(tick, deleteSpeed);
  }

  timeoutId = setTimeout(tick, typeSpeed);

  return {
    stop() {
      clearTimeout(timeoutId);
    },
  };
}
