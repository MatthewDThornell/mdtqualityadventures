import './style.css';
import { initCoverScene } from './cover-scene.js';
import { initTypewriter, brandSegment } from './typewriter.js';

document.getElementById('year').textContent = new Date().getFullYear();

const coverCanvas = document.getElementById('cover-canvas');
const coverScene = initCoverScene(coverCanvas);

initTypewriter(document.getElementById('eyebrowText'), ['A journal, kept by'], { loop: false });
initTypewriter(document.getElementById('taglineText'), [
  'Software QA Engineer & Quality Advocate',
  'AI Test Engineer',
  'Human First Quality Engineer',
  'Team Builder',
  'Friend',
  {
    text: 'Former Lead QA Engineer at ConexED',
    segments: [
      brandSegment('Lead QA Engineer', 'brand-conexed', null),
      brandSegment('ConexED', 'brand-conexed', 'https://www.conexed.com/'),
    ],
  },
  {
    text: 'Former Test Automation Engineer at LeGrand',
    segments: [
      brandSegment('Test Automation Engineer', 'brand-legrand', null),
      brandSegment('LeGrand', 'brand-legrand', 'https://www.legrand.us/'),
    ],
  },
  'Colleague who genuinely cares',
  'Teller of Dad Jokes',
  'Hunter of Bugs',
  {
    text: 'Former Software Quality Engineer at Seekwell/1-800-Contacts',
    segments: [
      brandSegment('Software Quality Engineer', 'brand-seekwell', null),
      brandSegment('Seekwell/1-800-Contacts', 'brand-seekwell', null),
    ],
  },
  {
    text: 'Former Software QA Engineer and Scrum Master at Werner Enterprises',
    segments: [
      brandSegment('Software QA Engineer and Scrum Master', 'brand-werner', null),
      brandSegment('Werner Enterprises', 'brand-werner', 'https://www.werner.com/'),
    ],
  },
  {
    text: "Former QA Coach and Architect at Veteran's United Home Loans",
    segments: [
      brandSegment('QA Coach and Architect', 'brand-veterans-united', null),
      brandSegment("Veteran's United Home Loans", 'brand-veterans-united', 'https://www.veteransunited.com/'),
    ],
  },
  'QA Mentor',
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
