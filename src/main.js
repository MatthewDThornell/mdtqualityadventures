import './style.css';
import { initCoverScene } from './cover-scene.js';
import { initTypewriter } from './typewriter.js';

document.getElementById('year').textContent = new Date().getFullYear();

const coverCanvas = document.getElementById('cover-canvas');
const coverScene = initCoverScene(coverCanvas);

initTypewriter(document.getElementById('eyebrowText'), ['A journal, kept by']);
initTypewriter(document.getElementById('taglineText'), [
  'Software QA Engineer & Quality Advocate',
  'AI Test Engineer',
  'Human First Quality Engineer',
  'Team Builder',
  'Friend',
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
