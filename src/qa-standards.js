import './style.css';
import { initCoverScene } from './cover-scene.js';
import { initScrollRibbon, initInkCursor, initInkTrail, initQuillCursor, initMagicWords } from './chrome.js';

document.getElementById('year').textContent = new Date().getFullYear();

initScrollRibbon(document.getElementById('scrollRibbonFill'));
initInkCursor(document.getElementById('inkCursor'));
initInkTrail(document.getElementById('inkTrailCanvas'));
initQuillCursor();
initMagicWords();

// fresh, original snippets in the actual syntax of the three frameworks this
// page is about, so the rain reads as "the code being written" rather than
// the homepage's generic flavor text
const QA_STANDARDS_CODE_SNIPPETS = [
  '[PLAYWRIGHT]', '[CYPRESS]', '[SELENIUM]', '[TEST]',
  "AWAIT PAGE.GOTO('/LOGIN')", "AWAIT PAGE.GETBYROLE('BUTTON').CLICK()",
  'AWAIT EXPECT(LOCATOR).TOBEVISIBLE()', "AWAIT PAGE.FILL('#EMAIL', USER)",
  "CY.GET('[DATA-CY=SUBMIT]').CLICK()", "CY.VISIT('/CART')",
  "CY.SHOULD('BE.VISIBLE')", "CY.INTERCEPT('GET', '/API/USER')",
  "DRIVER.FINDELEMENT(BY.ID('SUBMIT'))", 'WAIT.UNTIL(ELEMENTTOBECLICKABLE(BTN))',
  "DRIVER.GET('HTTPS://APP.EXAMPLE.COM')", 'ACTIONS.MOVETOELEMENT(EL).PERFORM()',
];

const coverCanvas = document.getElementById('cover-canvas');
const coverScene = initCoverScene(coverCanvas, {
  codeSnippets: QA_STANDARDS_CODE_SNIPPETS,
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

document.querySelectorAll('.code-copy-btn').forEach((button) => {
  const code = button.closest('.code-block').querySelector('code');
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(code.textContent);
      const original = button.textContent;
      button.textContent = 'Copied';
      button.classList.add('copied');
      setTimeout(() => {
        button.textContent = original;
        button.classList.remove('copied');
      }, 1500);
    } catch {
      // clipboard permission denied or unavailable — button just won't confirm
    }
  });
});
