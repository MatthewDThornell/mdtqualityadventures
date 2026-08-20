import './style.css';
import { initCoverScene } from './cover-scene.js';
import { initTypewriter, brandSegment } from './typewriter.js';

document.getElementById('year').textContent = new Date().getFullYear();

const coverCanvas = document.getElementById('cover-canvas');
const coverScene = initCoverScene(coverCanvas);

initTypewriter(document.getElementById('eyebrowText'), ['A journal, kept by'], { loop: false });
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
    text: 'Former Test Automation Engineer at\nLeGrand',
    segments: [
      brandSegment('Test Automation Engineer', 'brand-legrand', null),
      brandSegment('LeGrand', 'brand-legrand', 'https://www.legrand.us/', '/images/logos/legrand.png', true),
    ],
  },
  'AI Test Engineer',
  'Human First Quality Engineer',
  'Team Builder',
  'QA Mentor',
  'Friend',
  'Colleague who genuinely cares',
  'Teller of Dad Jokes',
  'Hunter of Bugs',
]);

const coverObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        coverScene.resume();
      } else {
        coverScene.pause();
      }
    });
  },
  { threshold: 0 }
);
coverObserver.observe(document.getElementById('top'));

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
    { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
  );

  chapters.forEach((chapter) => observer.observe(chapter));
}
