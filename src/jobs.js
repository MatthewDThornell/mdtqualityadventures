import './style.css';
import { initCoverScene } from './cover-scene.js';
import {
  initScrollRibbon,
  initInkCursor,
  initInkTrail,
  initQuillCursor,
  initMagicWords,
} from './chrome.js';

document.getElementById('year').textContent = new Date().getFullYear();

initScrollRibbon(document.getElementById('scrollRibbonFill'));
initInkCursor(document.getElementById('inkCursor'));
initInkTrail(document.getElementById('inkTrailCanvas'));
initQuillCursor();
initMagicWords();

const JOBS_CODE_SNIPPETS = [
  '[QA ENGINEER]',
  '[SDET]',
  '[TEST AUTOMATION]',
  '[QUALITY ENGINEER]',
  '[SOFTWARE TESTER]',
  "FETCH('/JOBS')",
  "FILTER(ROLE => ROLE.MATCHES('QA'))",
  'STATUS: OPEN',
  'SOURCE: REMOTE OK',
  'SOURCE: ARBEITNOW',
];

const coverCanvas = document.getElementById('cover-canvas');
const coverScene = initCoverScene(coverCanvas, {
  codeSnippets: JOBS_CODE_SNIPPETS,
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

// --- Job listings ---
// Rendered from public/data/jobs.json (written at build time by
// scripts/fetch-jobs.mjs). Every field below originates from a third-party,
// employer/user-submitted job posting — built as DOM nodes with textContent
// throughout, never innerHTML, and with the apply link's URL scheme checked
// before use, so a hostile posting can't inject markup or a javascript: URL.

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function isSafeHttpUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const parsed = new URL(value, window.location.origin);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function renderEmptyState(message) {
  const empty = document.createElement('p');
  empty.className = 'jobs-empty';
  empty.dataset.testid = 'jobs-empty';
  empty.textContent = message;
  return empty;
}

function workTypeBadgeClass(workType) {
  switch (workType) {
    case 'Remote':
      return 'job-badge-remote';
    case 'Hybrid':
      return 'job-badge-hybrid';
    default:
      return 'job-badge-onsite';
  }
}

function renderJobCard(job) {
  const card = document.createElement('article');
  card.className = 'job-card';
  card.dataset.testid = `job-card-${slugify(`${job.company}-${job.title}`)}`;
  // Not shown visibly (the badge above is workType, not country) — exists so
  // tests can verify the country filter without guessing at rendered text.
  card.dataset.country = job.country;

  const head = document.createElement('div');
  head.className = 'job-card-head';

  const heading = document.createElement('h3');
  heading.textContent = job.title;
  head.appendChild(heading);

  if (job.workType) {
    const badge = document.createElement('span');
    badge.className = `job-badge ${workTypeBadgeClass(job.workType)}`;
    badge.textContent = job.workType;
    head.appendChild(badge);
  }

  const footer = document.createElement('div');
  footer.className = 'job-card-footer';

  const meta = document.createElement('p');
  meta.className = 'job-meta';

  const company = document.createElement('span');
  company.textContent = job.company;
  meta.appendChild(company);

  if (job.location) {
    const location = document.createElement('span');
    location.textContent = job.location;
    meta.appendChild(location);
  }

  footer.appendChild(meta);

  // Remote OK's and Arbeitnow's public APIs never expose the underlying
  // company's own career-page URL — every listing routes back through the
  // board itself. Greenhouse/Lever listings (job.direct) are the opposite:
  // their URL resolves to the company's own domain (verified by hand — see
  // README.md#job-listings) — so the label is honest either way rather than
  // a blanket "Apply Directly" that would overstate the board-routed ones.
  if (isSafeHttpUrl(job.url)) {
    const applyLink = document.createElement('a');
    applyLink.className = 'job-apply-btn';
    applyLink.href = job.url;
    applyLink.target = '_blank';
    applyLink.rel = 'noopener';
    applyLink.textContent = job.direct ? `Apply at ${job.company}` : `Apply via ${job.source}`;
    footer.appendChild(applyLink);
  }

  card.append(head, footer);
  return card;
}

let allJobs = [];

function currentlyFilteredJobs() {
  const searchInput = document.querySelector('[data-testid="jobs-search"]');
  const workTypeSelect = document.querySelector('[data-testid="jobs-filter-worktype"]');
  const countrySelect = document.querySelector('[data-testid="jobs-filter-country"]');
  const query = searchInput.value.trim().toLowerCase();
  const workType = workTypeSelect.value;
  const country = countrySelect.value;

  return allJobs.filter((job) => {
    const matchesQuery =
      !query ||
      job.title.toLowerCase().includes(query) ||
      job.company.toLowerCase().includes(query);
    const matchesWorkType = workType === 'all' || job.workType === workType;
    const matchesCountry = country === 'all' || job.country === country;
    return matchesQuery && matchesWorkType && matchesCountry;
  });
}

// The "All Regions"/"United States" options are hard-coded in jobs.html so
// the filter works before this runs; every other country actually present
// in this build's listings gets appended here, sorted alphabetically.
function populateCountryFilter() {
  const countrySelect = document.querySelector('[data-testid="jobs-filter-country"]');
  const existing = new Set(Array.from(countrySelect.options, (option) => option.value));

  const otherCountries = [...new Set(allJobs.map((job) => job.country))]
    .filter((country) => !existing.has(country))
    .sort();

  for (const country of otherCountries) {
    const option = document.createElement('option');
    option.value = country;
    option.textContent = country;
    countrySelect.appendChild(option);
  }
}

function renderFilteredJobs() {
  const listEl = document.querySelector('[data-testid="jobs-list"]');
  listEl.replaceChildren();

  const filtered = currentlyFilteredJobs();
  if (filtered.length === 0) {
    listEl.appendChild(
      renderEmptyState(
        'No listings match that search — try a different title, company, work type, or region.',
      ),
    );
    return;
  }

  for (const job of filtered) {
    listEl.appendChild(renderJobCard(job));
  }
}

async function loadJobs() {
  const listEl = document.querySelector('[data-testid="jobs-list"]');
  const updatedEl = document.querySelector('[data-testid="jobs-updated"]');
  const controlsEl = document.querySelector('.jobs-controls');

  try {
    const res = await fetch('/data/jobs.json');
    if (!res.ok) throw new Error(`jobs.json responded ${res.status}`);
    const { fetchedAt, jobs } = await res.json();

    if (fetchedAt) {
      updatedEl.textContent = `Job listings last refreshed: ${dateFormatter.format(new Date(fetchedAt))}`;
    }

    allJobs = jobs || [];

    if (allJobs.length === 0) {
      controlsEl.hidden = true;
      listEl.appendChild(
        renderEmptyState(
          'No QA-relevant openings came up in this update — check the links below for more.',
        ),
      );
      return;
    }

    populateCountryFilter();

    const searchInput = document.querySelector('[data-testid="jobs-search"]');
    const workTypeSelect = document.querySelector('[data-testid="jobs-filter-worktype"]');
    const countrySelect = document.querySelector('[data-testid="jobs-filter-country"]');
    searchInput.addEventListener('input', renderFilteredJobs);
    workTypeSelect.addEventListener('change', renderFilteredJobs);
    countrySelect.addEventListener('change', renderFilteredJobs);

    renderFilteredJobs();
  } catch {
    controlsEl.hidden = true;
    listEl.appendChild(
      renderEmptyState(
        "Job listings couldn't be loaded right now — check the links below instead.",
      ),
    );
  }
}

loadJobs();
