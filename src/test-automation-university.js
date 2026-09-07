import './style.css';
import { initCoverScene } from './cover-scene.js';
import { initScrollRibbon, initInkCursor, initInkTrail, initQuillCursor, initMagicWords } from './chrome.js';

document.getElementById('year').textContent = new Date().getFullYear();

initScrollRibbon(document.getElementById('scrollRibbonFill'));
initInkCursor(document.getElementById('inkCursor'));
initInkTrail(document.getElementById('inkTrailCanvas'));
initQuillCursor();
initMagicWords();

const TAU_CODE_SNIPPETS = [
  '[TESTAUTOMATIONU]', '[PLAYWRIGHT]', '[CYPRESS]', '[SELENIUM]', '[ROBOT FRAMEWORK]',
  "AWAIT PAGE.GOTO('/LOGIN')", "AWAIT PAGE.GETBYROLE('BUTTON').CLICK()",
  'AWAIT EXPECT(LOCATOR).TOBEVISIBLE()', "CY.GET('[DATA-CY=SUBMIT]').CLICK()",
  "DRIVER.FINDELEMENT(BY.ID('SUBMIT'))", 'WAIT.UNTIL(ELEMENTTOBECLICKABLE(BTN))',
  'KEYWORD TEST CASE', 'SUITE SETUP', "[NUNIT] [TEST]",
];

const coverCanvas = document.getElementById('cover-canvas');
const coverScene = initCoverScene(coverCanvas, {
  codeSnippets: TAU_CODE_SNIPPETS,
  textZoneSelector: '.standards-hero .container',
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    coverScene.pause();
  } else {
    coverScene.resume();
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

// videos load only on click (not up front) so 18 embeds don't all fetch at once,
// and unmounting the iframe on "Hide" actually stops playback instead of just hiding it
document.querySelectorAll('.tau-course-toggle').forEach((button) => {
  const row = button.closest('.tau-course-row');
  const courseName = row.querySelector('.tau-course-name').textContent;
  const videoContainer = row.nextElementSibling;

  button.addEventListener('click', () => {
    const isOpen = button.getAttribute('aria-expanded') === 'true';
    if (isOpen) {
      videoContainer.hidden = true;
      videoContainer.innerHTML = '';
      button.textContent = 'Watch';
      button.setAttribute('aria-expanded', 'false');
      return;
    }

    const videoId = button.dataset.videoId;
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}`;
    iframe.title = courseName;
    // scoped per video-id rather than a single shared id, since a viewer can
    // have more than one course's embed open at once
    iframe.dataset.testid = `tau-video-embed-${videoId}`;
    iframe.loading = 'lazy';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    videoContainer.replaceChildren(iframe);
    videoContainer.hidden = false;
    button.textContent = 'Hide';
    button.setAttribute('aria-expanded', 'true');
  });
});
