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

## Code Style

```bash
npm run lint            # ESLint over src/**/*.js and scripts/**/*.mjs
npm run format           # Prettier — writes
npm run format:check     # Prettier — check only (what CI runs)
```

Both run in CI (`.github/workflows/ci.yml`) alongside the build. Prettier covers JS/TS/CSS/JSON/MD
but deliberately **not** HTML (see `.prettierignore`) — its HTML formatter multi-lines attribute
lists and splits inline elements across lines even for short tags, which fights the one-element-
per-line style the three page files use throughout. ESLint doesn't cover `tests/**/*.ts` either:
`typescript-eslint`'s latest stable release caps its peer range below the `typescript@7` this
project runs, so that gap will close once `typescript-eslint` catches up. Prettier still formats
those files fine in the meantime — it doesn't need type info, just the AST.

## Testing

```bash
npx playwright test           # full suite
npm run test:smoke            # @smoke-tagged tests only
npm run test:ui               # Playwright's interactive UI mode
npm run test:report           # open the HTML report from the last run
```

See `tests/AUTHORING_GUIDE.md` for the test-writing conventions (page objects, naming, locator
strategy) before adding a new test.

## Deploy

This site is **not** git-linked on Netlify — pushing to `main` only runs `.github/workflows/ci.yml`
(build + `@smoke` suite) as a GitHub check, it does not deploy anything. Ship a change with:

```bash
npm run build
netlify deploy --prod --dir=dist
```

`netlify.toml` still supplies the build environment/headers for that deploy. Run `netlify status`
first if unsure which site/account the CLI is currently linked to.

## Structure

Four pages (`index.html`, `qa-standards.html`, `test-automation-university.html`, `jobs.html`)
share the same header/nav, scroll ribbon, ink-trail cursor, and digital-rain hero background — but
each page duplicates that markup in its own HTML file rather than sharing a template, since the
project has no server-side templating. The four copies must be kept in sync by hand; each file has
an inline comment at the top of its `<nav>` saying so. Shared _behavior_ (not markup) lives in
`src/chrome.js` and is imported by each page's own entry script (`src/main.js`,
`src/qa-standards.js`, `src/test-automation-university.js`, `src/jobs.js`).

### Job listings

`scripts/fetch-jobs.mjs` pulls QA/SDET/test-automation-relevant listings from four kinds of free,
no-key sources at build time and writes them to `public/data/jobs.json`, which `src/jobs.js`
fetches client-side (same origin — no CORS or API-key exposure). It runs automatically as part of
`npm run build`; run it on its own with `npm run fetch:jobs`.

- **Remote OK, Arbeitnow, Remotive, and Jobicy** — general public job-board APIs. All four are
  fetched broadly and filtered locally by title, not by whatever `search`/`tag`/`category` param
  each API happens to expose — tested by hand against all four, and none of those params actually
  narrow results server-side (Jobicy's `tag=quality-assurance` and Remotive's own "Quality
  Assurance" `category` both just return generic unrelated results). Remotive and Jobicy each
  require crediting them with a link back wherever listings are shown, same as Remote OK — see the
  attribution links at the bottom of `jobs.html`.
- **Greenhouse, Lever, and Ashby's public "job board" APIs**, queried per-company
  (`boards-api.greenhouse.io/v1/boards/<token>/jobs`, `api.lever.co/v0/postings/<token>`,
  `api.ashbyhq.com/posting-api/job-board/<token>`) — all three are free, no-key, and explicitly
  meant for public embedding. Unlike the general boards above, the listing URL they return is the
  company's own career page (verified by hand: Stripe's resolves to `stripe.com`, Pinterest's to
  `pinterestcareers.com`), so these are genuinely direct applications. There's no "search
  everything" endpoint for any of the three, so `GREENHOUSE_COMPANIES`, `LEVER_COMPANIES`, and
  `ASHBY_COMPANIES` in `fetch-jobs.mjs` are a curated seed of real companies with verified working
  boards (~50 companies total) — add more by checking a candidate token against any of the three
  URL patterns directly. SmartRecruiters, Recruitee, and Teamtailor run similar free per-company
  APIs but had too low a hit rate guessing at tokens blindly to be worth seeding without already
  knowing specific companies that use them.
- **Himalayas was tried and dropped**: its public API ignores every filter param (`category`,
  `search`, `limit` all no-op — confirmed by hand) and always returns the same 20 generic jobs out
  of its 100k+ total, with no way to page or search into the rest for free. Not usable without a
  paid plan.

- **Filtering is title-only**, not tags — a `quality assurance` _tag_ shows up on plenty of
  unrelated ops/dev roles on these boards, but nobody titles a listing "QA Engineer" unless it
  actually is one. "Automation Engineer"/"Automation Architect" are additionally ambiguous (as
  common in industrial/PLC and business-process automation as in QA), so those two only count when
  the listing's own description also mentions QA/testing context.
- **Hardware/manufacturing QA is excluded too**: widening past software-only companies surfaced
  postings like OpenAI's "Manufacturing Quality Engineer, Datacenter Infrastructure" — a real
  match for the title keywords, but about physical hardware, not software. `HARDWARE_EXCLUSION_KEYWORDS`
  in `fetch-jobs.mjs` filters titles mentioning manufacturing/hardware/datacenter/firmware/etc.
  before the QA-title check runs.
- **Freshness is tied to deploys, not live**: this site has no backend and no scheduled rebuild, so
  listings are only ever as current as the last `npm run build` + `netlify deploy`. `jobs.html`
  shows the `fetchedAt` timestamp for exactly this reason.
- **`public/data/jobs.json` is committed**, not gitignored — a network hiccup during a build (or a
  board blocking a CI runner's IP) means the fetch script warns and leaves the file untouched
  rather than overwriting real listings with nothing.
- **Work type** (Remote/Hybrid/On-site badge on each card) is derived where a source doesn't supply
  it. Lever and Ashby both expose a genuine `workplaceType` field, used directly when present;
  everything else (Greenhouse has no such field, Remote OK/Arbeitnow/Remotive/Jobicy only have a
  `remote` boolean or none at all) falls back to a text search for "hybrid" across the
  title/description/location, then the `remote` flag — `classifyWorkType()` in `fetch-jobs.mjs`.
- **Region/country filter, defaulting to United States**: none of these sources give a clean,
  structured country field either — it's all free-text location strings ("Taipei,Taiwan",
  "Cologne (GER)", bare "Remote"), so `classifyCountry()` in `fetch-jobs.mjs` pattern-matches
  explicit country/US-state signals first, then a short list of major-city fallbacks for cities
  that actually show up in this data. It's approximate, not authoritative — an ambiguous city name
  (e.g. "Birmingham" is UK or Alabama) resolves toward whichever reading is more common on these
  particular boards. Jobs with no usable location at all classify as "Remote / Unspecified" rather
  than being guessed into a country. The filter's option list is built dynamically in `src/jobs.js`
  from whatever countries actually appear in the current build's listings (plus the two guaranteed
  baseline options, "All Regions" and "United States", hard-coded in `jobs.html` so the control
  works even before JS populates the rest). A full US-state-level breakdown isn't built — state
  data is too sparse and inconsistently reported across these sources to be worth a second filter
  axis yet.
- **No LinkedIn/Indeed listings**: neither offers a free public jobs API, and scraping either
  violates their Terms of Service, so their postings can't be imported. `jobs.html` instead links
  out to a pre-filled search on each site.
- **The apply link is honest about where it goes**: Remote OK's and Arbeitnow's public APIs both
  route 100% of listings back through their own domain — neither ever exposes the underlying
  company's actual career-page URL (checked directly against a full pull from each) — and Remotive
  and Jobicy do the same. Those buttons read "Apply via &lt;Source&gt;". Greenhouse/Lever/Ashby
  listings (`job.direct` in the data) get "Apply at &lt;Company&gt;" instead, since their URL
  really does resolve to the employer's own domain.
- The search box and work-type filter (`src/jobs.js`) both operate client-side on the already-
  fetched `jobs` array — no re-fetching, no backend.

[`automation/`](automation/) holds separate end-to-end test-automation portfolio pieces (Cypress
and a Playwright/C# framework, both targeting optum.com) referenced from the QA Standards page.
It's a self-contained subproject with its own dependencies and tooling — not built by Vite, not
covered by this repo's ESLint/Prettier/CI. See [`automation/README.md`](automation/README.md).

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

- Every nav link, toggle, and the brand link — identical `data-testid` values across all four
  pages' nav copies, same as the nav's labels/order/hrefs. The skip-link carries one too, for the
  same reason.
- Primary buttons/CTAs (resume/letter downloads, LinkedIn/GitHub links, contact links, code-copy
  buttons, TAU watch/hide toggles).
- Every repeated card/row with no existing unique `id` and ambiguous or duplicate visible text
  (timeline entries, accomplishment cards, recommendation cards, mentor/mentee cards, adventure
  cards, TAU course rows, job cards).
- Dynamically-created elements (the career-trail list items built in `src/main.js`, the YouTube
  embed built in `src/test-automation-university.js`, the job cards and empty-state message built
  in `src/jobs.js`) — added at creation time via `element.dataset.testid = '...'`.

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
