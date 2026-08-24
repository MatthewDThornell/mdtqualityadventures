import './style.css';

document.getElementById('year').textContent = new Date().getFullYear();

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
