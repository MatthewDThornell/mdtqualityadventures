# Automation

End-to-end test automation portfolio pieces, kept here as evidence of the testing practices
documented on the [QA Standards page](https://mdtqualityadventures.com/qa-standards.html). Two
frameworks, both targeting the same live public site ([optum.com](https://www.optum.com/en/)) —
there's no shared code between them, and neither is wired into this repo's own build, lint, or
test tooling (see the root [README](../README.md#structure)); each manages its own dependencies.

- **[`cypress/`](cypress/)** — fast, in-your-face E2E testing. Good for quickly authoring and
  debugging a spec against a running browser.
- **[`OptumPlaywright/`](OptumPlaywright/)** — Playwright + C#/NUnit, built around structure:
  typed page objects, soft assertions, an authoring guide with enforced naming/category
  conventions, and an auto-generated results dashboard for transparent test metrics. See
  [`OptumPlaywright/Playwright.Tutorial.md`](OptumPlaywright/Playwright.Tutorial.md) for the full
  walkthrough.

## Cypress Setup

```
cd automation
npm install
npm run cypress:open   # interactive runner
npm run cypress:run    # headless run
```

## AI-assisted authoring

This project has the official [Cypress AI Toolkit](https://github.com/cypress-io/ai-toolkit) installed (`.agents/skills/`). Three skills are available in Claude Code when run from this `automation/` directory:

- **cypress-author** — creates, updates, or fixes specs. Trigger with prompts like "write a test for..." or "fix this flaky test."
- **cypress-explain** — explains or critiques an existing test without changing code.
- **cypress-docs** — looks up Cypress API/behavior directly from `docs.cypress.io` instead of relying on memory.

There is currently no official live-browser MCP for selector scanning (the `@cypress/mcp` proposal is still open as of this writing). Until one ships, verify real selectors by inspecting the live site in DevTools and feeding them back into the relevant Page Object (e.g. [`cypress/fixtures/OptumHomePage.js`](cypress/fixtures/OptumHomePage.js)).

## Page Objects (Cypress)

Page objects live in `cypress/fixtures/` (e.g. `OptumHomePage.js`). Each exposes an `elements` map of selector functions plus small action methods (`visit()`, `goToNav()`, etc.) so specs read like plain English instead of raw selector soup.

```js
import optumHome from '../fixtures/OptumHomePage';

optumHome.visit().goToNav('pharmacy');
```

## Writing a test case (Cypress)

Every `it()` block should read like a short story: what the user does, and what should happen. Right above the test body, add two comment lines explaining *why the feature matters* and *what the test checks* — this is what makes the suite skimmable for anyone who didn't write it.

**Format:**

```js
describe('<Feature area>', () => {
  it('<action> → <expected result>', () => {
    // Why this feature matters: <business/user reason this exists>
    // What it tests: <the specific behavior/assertion being verified>

    // ...test steps...
  });
});
```

**Example:**

```js
describe('Homepage hero CTAs', () => {
  it('Clicking "Find care near you" navigates to the provider search flow', () => {
    // Why this feature matters: Finding a provider is the #1 task members
    // come to the homepage to do; a broken CTA blocks that entirely.
    // What it tests: The hero CTA is visible, clickable, and routes to the
    // provider-search page without a client-side error.

    optumHome.visit();
    optumHome.elements.ctaFindCare().should('be.visible').click();

    cy.url().should('include', '/find-care');
    cy.contains('h1', 'Find a provider').should('be.visible');
  });
});
```

## Useful commands cheat sheet (Cypress)

**Navigation**
```js
cy.visit('/');                 // use baseUrl + relative path, not full URLs
cy.go('back');
cy.reload();
```

**Selectors** (in priority order — see `.agents/skills/cypress-author/references/author/author-rules.md`)
```js
cy.get('[data-cy="submit-btn"]');   // 1. data-cy / data-test / data-testid / data-qa
cy.get('#zip-code');                // 2. id / name
cy.contains('Find care near you');  // 3. visible text
cy.get('nav button').eq(0);         // 4. element type/order (last resort)
```

**Assertions**
```js
cy.get('[data-cy="hero-heading"]').should('be.visible').and('contain.text', 'Health care');
cy.url().should('include', '/find-care');
```

**Network stubbing / waiting on requests** (never use arbitrary `cy.wait(ms)`)
```js
cy.intercept('GET', '/api/providers*').as('getProviders');
cy.visit('/find-care');
cy.wait('@getProviders');
```

**State setup** (skip the UI when the UI isn't what's under test)
```js
cy.request('POST', '/api/test/seed-member').then((res) => { ... });
cy.session('memberLogin', () => { /* log in once, reuse across specs */ });
```

**Custom commands** — add reusable steps to `cypress/support/commands.js` and call as `cy.yourCommand()`.

**Secrets** — never hardcode credentials; use `cy.env('SOME_KEY')` backed by `cypress.env.json` (gitignored) or CI secrets.

## Test structure rules (Cypress)

- Tests must be independent — no test should depend on state left by another.
- Prefer `beforeEach()` for shared setup over repeating it in every `it()`.
- Prefer fewer tests with multiple meaningful assertions over many single-assertion tests.
- Reset state before a test runs rather than cleaning up after.

## Playwright / C# Quick Start

```powershell
cd automation/OptumPlaywright
dotnet restore
dotnet build
pwsh bin/Debug/net9.0/playwright.ps1 install chromium

# Run the smoke suite
./Scripts/run-tests.ps1

# Or directly:
dotnet test --filter "Category=smoke" --settings Settings/local.runsettings
```

Full walkthrough (project structure, lifecycle, conventions, troubleshooting):
[`OptumPlaywright/Playwright.Tutorial.md`](OptumPlaywright/Playwright.Tutorial.md). Authoring
rules and copy-paste templates: [`OptumPlaywright/Linting_Rules/`](OptumPlaywright/Linting_Rules/).
Live pass/fail results: [`OptumPlaywright/Test_Case_Dashboards_and_Results/test-results-dashboard.md`](OptumPlaywright/Test_Case_Dashboards_and_Results/test-results-dashboard.md)
(regenerated on every run).
