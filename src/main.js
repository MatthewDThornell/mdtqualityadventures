import './style.css';
import { initCoverScene } from './cover-scene.js';
import { initTypewriter, brandSegment } from './typewriter.js';
import { initQuoteRotator } from './quote-rotator.js';

document.getElementById('year').textContent = new Date().getFullYear();

const coverCanvas = document.getElementById('cover-canvas');
const coverScene = initCoverScene(coverCanvas);

const coverQuoteEl = document.getElementById('coverQuote');
const quoteRotator = initQuoteRotator(coverQuoteEl, [
  'Quality isn’t something we test in. It’s something we build in.',
  'Quality is a choice, not a checklist.',
  'The details aren’t the work. The details are what make the work.',
  'Good enough is easy. Good work takes intention.',
  'A good QA engineer finds problems. A great one helps the team solve them.',
  'Quality belongs to everyone who touches the product.',
  'Do good work, treat people well, and leave things better than you found them.',
  'The quality of a life is shaped by the choices made every day.',
]);
coverQuoteEl.addEventListener('mouseenter', () => quoteRotator.pause());
coverQuoteEl.addEventListener('mouseleave', () => quoteRotator.resume());

initTypewriter(
  document.getElementById('eyebrowText'),
  ['A career portfolio, written by', 'A career built around quality'],
  { loop: false }
);
initTypewriter(document.getElementById('taglineText'), [
  'Software QA Engineer & Quality Advocate',
  {
    text: 'Former QA Coach and Architect at\nVeterans United',
    segments: [
      brandSegment('QA Coach and Architect', 'brand-veterans-united', null),
      brandSegment(
        'Veterans United',
        'brand-veterans-united',
        'https://www.veteransunited.com/',
        '/images/logos/veterans-united.png',
        true
      ),
    ],
  },
  {
    text: 'Former Software Quality Engineer at\nSeekwell/1-800-Contacts',
    segments: [
      brandSegment('Software Quality Engineer', 'brand-seekwell', null),
      brandSegment('Seekwell/1-800-Contacts', 'brand-seekwell', null, '/images/logos/1800contacts.png', true),
    ],
  },
  {
    text: 'Former Sr. Software QA Engineer at\nWerner Enterprises',
    segments: [
      brandSegment('Sr. Software QA Engineer', 'brand-werner', null),
      brandSegment('Werner Enterprises', 'brand-werner', 'https://www.werner.com/', '/images/logos/werner.png', true),
    ],
  },
  {
    text: 'Former Lead QA Engineer at\nConexED',
    segments: [
      brandSegment('Lead QA Engineer', 'brand-conexed', null),
      brandSegment('ConexED', 'brand-conexed', 'https://www.conexed.com/', '/images/logos/conexed.png', true),
    ],
  },
  {
    text: 'Former Test Automation Engineer at\nLegrand',
    segments: [
      brandSegment('Test Automation Engineer', 'brand-legrand', null),
      brandSegment('Legrand', 'brand-legrand', 'https://www.legrand.us/', '/images/logos/legrand.png', true),
    ],
  },
  'AI Test Engineer',
  'Human First Quality Engineer',
  'Team Builder',
  'QA Mentor',
  'Teller of Dad Jokes',
  'Reliable by nature. Relentless about quality.',
  'I break code first, so our customers don’t.',
  'I don’t test to say no. I test to make yes possible.',
  'Break some code here, add tests there, build confidence everywhere.',
]);

// the rain now runs as a fixed background across the whole site, so pause it
// only when the tab itself isn't visible (saves battery/CPU in a background tab)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    coverScene.pause();
    quoteRotator.pause();
  } else {
    coverScene.resume();
    quoteRotator.resume();
  }
});

const navToggle = document.getElementById('navToggle');
const siteNav = document.getElementById('siteNav');

navToggle.addEventListener('click', () => {
  const isOpen = siteNav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

siteNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    siteNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const chapters = document.querySelectorAll('.chapter');

if (prefersReducedMotion) {
  chapters.forEach((chapter) => chapter.classList.add('in-view'));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    // threshold: 0 fires as soon as any part of a chapter enters the viewport, so this
    // works regardless of how tall a chapter's content is (a percentage-based threshold
    // like 0.15 can never be reached for chapters taller than ~7x the viewport height)
    { threshold: 0, rootMargin: '0px 0px -10% 0px' }
  );

  chapters.forEach((chapter) => observer.observe(chapter));
}

// floating up/down control so long chapters (Recommendations, Professional
// Experience) don't require manual scrolling to jump between sections
const chapterNav = document.querySelector('.chapter-nav');
const chapterUpBtn = document.getElementById('chapterUp');
const chapterDownBtn = document.getElementById('chapterDown');

if (chapterNav && chapterUpBtn && chapterDownBtn) {
  const stops = [document.getElementById('top'), ...chapters];
  const HEADER_OFFSET = 88;

  const currentStopIndex = () => {
    // a short final section can never scroll its top past HEADER_OFFSET (there's
    // nothing left below it to scroll), so treat "maxed out scroll" as the last stop
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (atBottom) return stops.length - 1;

    let idx = 0;
    stops.forEach((stop, i) => {
      if (stop.getBoundingClientRect().top - HEADER_OFFSET <= 0) idx = i;
    });
    return idx;
  };

  const goToStop = (index) => {
    const target = stops[index];
    if (!target) return;
    target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
  };

  const updateChapterNav = () => {
    const idx = currentStopIndex();
    chapterUpBtn.disabled = idx <= 0;
    chapterDownBtn.disabled = idx >= stops.length - 1;
    chapterNav.classList.toggle('is-visible', window.scrollY > 80);
  };

  chapterUpBtn.addEventListener('click', () => goToStop(currentStopIndex() - 1));
  chapterDownBtn.addEventListener('click', () => goToStop(currentStopIndex() + 1));

  let navTicking = false;
  window.addEventListener('scroll', () => {
    if (navTicking) return;
    navTicking = true;
    requestAnimationFrame(() => {
      updateChapterNav();
      navTicking = false;
    });
  });

  updateChapterNav();
}
