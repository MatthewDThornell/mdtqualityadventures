# MDT Quality Adventures

A custom portfolio site built as an "adventure journal" for hiring managers — Vite + vanilla
HTML/JS/CSS, no framework. Live at [mdtqualityadventures.com](https://mdtqualityadventures.com/).

## Getting Started

```bash
npm install
npm run dev       # local dev server with hot reload
npm run build     # production build to dist/
npm run preview   # serve the dist/ build locally
```

No `.env`, no credentials, no backend — everything is static.

## Deploy

Netlify auto-builds `dist/` from `netlify.toml` on every push to `main`. There's no CI gate in
front of that yet, so a clean `npm run build` locally before pushing is the only check.

## Structure

Three pages (`index.html`, `qa-standards.html`, `test-automation-university.html`) share the same
header/nav, scroll ribbon, ink-trail cursor, and digital-rain hero background — but each page
duplicates that markup in its own HTML file rather than sharing a template, since the project has
no server-side templating. The three copies must be kept in sync by hand; each file has an inline
comment at the top of its `<nav>` saying so. Shared *behavior* (not markup) lives in
`src/chrome.js` and is imported by each page's own entry script (`src/main.js`,
`src/qa-standards.js`, `src/test-automation-university.js`).

## Automation IDs

Elements a Playwright test would plausibly need to select carry a `data-testid` attribute —
matching the locator-strategy preference documented on the [QA Standards
page](https://mdtqualityadventures.com/qa-standards.html#best-practices): prefer
`page.getByTestId(...)` on code we own, falling back to `getByRole`/text only where there's no
test-id.

**Convention:** kebab-case, `<scope>-<element>[-<slug>]`, e.g. `nav-link-experience`,
`rec-card-nathan-gearke`, `tau-course-watch-btn-playwright-advanced`. Repeated cards/rows use a
stable slug derived from their own visible content (a person's name, a company, a course's own URL
slug) rather than a numeric index, so an id doesn't silently point at the wrong item if the list
gets reordered or a new entry is inserted in the middle.

**What gets one:**
- Every nav link, toggle, and the brand link — identical `data-testid` values across all three
  pages' nav copies, same as the nav's labels/order/hrefs.
- Primary buttons/CTAs (resume/letter downloads, LinkedIn/GitHub links, contact links, code-copy
  buttons, TAU watch/hide toggles).
- Every repeated card/row with no existing unique `id` and ambiguous or duplicate visible text
  (timeline entries, accomplishment cards, recommendation cards, mentor/mentee cards, adventure
  cards, TAU course rows).
- Dynamically-created elements (the career-trail list items built in `src/main.js`, the YouTube
  embed built in `src/test-automation-university.js`) — added at creation time via
  `element.dataset.testid = '...'`.

**What doesn't:**
- Anything that already has a unique, meaningful `id` attribute (e.g. `#chapterUp`, `#aboutQuote`)
  — that id is already a stable locator; a redundant `data-testid` next to it is just noise.
  `page.locator('#chapterUp')` is fine.
- Purely decorative content with no plausible test target: `aria-hidden` images (game-strip,
  product-strip, platform badges), long flat lists whose items already have unique enough text to
  select by role/text (tech-stack tool links, skill tags, the habits list), and one-off body copy.

When you add a new interactive element, card, or button to the site, give it a `data-testid`
following this convention as part of the same change — don't wait for a later "add automation ids"
pass.
