# Test Authoring Guide (mdtqualityadventures)

Read this before writing a new test. It adapts the conventions from the
[OptumPlaywright](../../OptumPlaywright/Linting_Rules/test-case-setup.md) suite (page objects,
`Test_Case_{ID}_...` naming, soft assertions, no hard sleeps) to this site's actual stack:
TypeScript + `@playwright/test`, testing a site we own — not a third-party production site — so
`data-testid` locators are the default rather than the exception.

---

## 1. Stack

- **`@playwright/test`**, TypeScript, no NUnit/C# — this is a Vite/JS site, so the test suite stays
  in the same language as the app.
- Native `expect.soft()` and `test.step()` stand in for OptumPlaywright's custom `SoftAssertions`
  and `TestStep()` helpers — Playwright Test already does both natively, so there's no equivalent
  infrastructure to build here.
- `playwright.config.ts` boots a server automatically via `webServer` — no separate step needed
  before `npm test`. Locally that's the Vite **dev server** (`npm run dev`), for fast hot-reloading
  authoring; in CI (`.github/workflows/ci.yml`, which sets `CI=true`) it's a real **production
  build** served via `npm run build && npm run preview`, so CI runs against what actually gets
  deployed rather than the dev server.

## 2. File Structure

```
tests/
├── pages/            # Page Object Model — one class per page/URL
│   ├── BasePage.ts       # shared nav, common to all four page objects
│   ├── HomePage.ts       # index.html
│   ├── QaStandardsPage.ts
│   ├── TauPage.ts
│   └── JobsPage.ts
├── specs/            # test files, one per module, named <id-range>-<module>.spec.ts
└── AUTHORING_GUIDE.md
```

## 3. Locator Strategy

This site's own [QA Standards page](https://mdtqualityadventures.com/qa-standards.html#best-practices)
documents the priority order for code we control:

| Priority                          | Use When                                                                                                                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `page.getByTestId(...)`           | Default choice for anything interactive or repeated — see the site repo's `README.md#automation-ids` for the full `data-testid` convention and what does/doesn't get one. |
| `page.getByRole(role, name)`      | Fine where there's no test-id and the accessible name is already unique (e.g. page `<h1>`s).                                                                              |
| CSS selector scoped to a landmark | Last resort, and only with a `// TODO:` comment explaining why testid/role didn't work.                                                                                   |

Every page object method returns a `Locator`, never a raw string — same rule as OptumPlaywright.
Selectors for repeated cards/rows take the item's own slug as a parameter (e.g.
`home.recCard('nathan-gearke')`) rather than one named method per item, since the count of cards
changes over time and a parameterized method doesn't need editing when it does.

## 4. Test Naming Convention

```
Test_Case_{ID}_{Feature}_{Element}_{Behavior}
```

### ID Ranges

| Range       | Module                              | Status  |
| ----------- | ----------------------------------- | ------- |
| 1000–1999   | Home — Nav & Hero                   | covered |
| 2000–2999   | Professional Experience             | covered |
| 3000–3999   | Accomplishments                     | covered |
| 4000–4999   | Recommendations                     | covered |
| 5000–5999   | About Me                            | covered |
| 6000–6999   | Mentors                             | covered |
| 7000–7999   | Mentees                             | covered |
| 8000–8999   | Adventures                          | covered |
| 9000–9999   | Contact                             | covered |
| 10000–10999 | QA Standards page                   | covered |
| 11000–11999 | Test Automation University page     | covered |
| 12000–12999 | Integration (cross-page navigation) | covered |
| 13000–13999 | Accessibility                       | covered |
| 14000–14999 | Jobs page                           | covered |

"Reserved" ranges have page-object support already in place (`HomePage.ts` has
`accomplishmentCard()`, `mentorCard()`, `menteeCard()`, `adventureCard()`, `contactLink()`, etc.) —
writing that module's spec file is mostly composing existing locators, not building new ones.

Before using an ID, grep `tests/specs/` for it to confirm it isn't already taken — there's no
separate `mapping.json` registry to keep in sync (see §7 for why).

## 5. Tags Instead of NUnit Categories

```ts
test('Test_Case_1000_...', { tag: '@smoke' }, async ({ page }) => { ... });
```

- `@smoke` — critical-path, must pass every run.
- `@regression` — broader coverage, secondary flows.

Run a subset with `npx playwright test --grep @smoke`. A test can carry both tags
(`{ tag: ['@smoke', '@regression'] }`) if it belongs in both.

## 6. Test Body Pattern

```ts
test('Test_Case_XXXX_Feature_Element_Behavior', { tag: '@smoke' }, async ({ page }) => {
  const home = new HomePage(page);
  await home.goto();

  await test.step('Then element is visible and correct', async () => {
    await expect.soft(home.someLocator).toBeVisible();
    await expect.soft(home.someLocator).toHaveAttribute('href', '...');
  });
});
```

**Rules:**

- Always use `expect.soft(...)` for assertions, not bare `expect(...)`, unless a failure means
  continuing the test is pointless (e.g. the page navigated to the wrong URL entirely — see the
  hard `expect(page).toHaveURL(...)` calls in `12000-integration-navigation.spec.ts`). Soft
  failures are collected automatically and reported together at the end of the test — no
  equivalent of OptumPlaywright's `Soft.Verify()` call is needed.
- Always wrap logically distinct steps in `test.step(...)` — same reasoning as OptumPlaywright's
  `TestStep()`: it shows up in the HTML report and trace viewer so a failure is legible without
  opening the test file.
- **Never** use `page.waitForTimeout(...)`. Every `expect(...)`/`expect.soft(...)` call already
  auto-retries until it passes or times out — if something needs to "finish" first (like the
  typewriter reaching a particular phrase), assert on the real DOM state with a longer timeout
  instead (see `Test_Case_1011` for a live example).

## 7. No Separate Test Registry

OptumPlaywright registers every test in both `mapping.json` and `testcases.csv`. This suite skips
that: `--list` (`npx playwright test --list`) already enumerates every test with its full
`Test_Case_ID_...` name from the spec files themselves, so a second hand-maintained registry would
just be a second place to forget to update. If this suite grows enough contributors that drifting
out of sync becomes a real risk, revisit this.

## 8. Before Committing

```bash
npx tsc --noEmit                          # type-check the suite
npx playwright test --grep @smoke         # smoke suite must not regress
npx playwright test tests/specs/<your-new-file>.spec.ts   # your new test(s), on their own
```

## 9. Adding a New Module (e.g. Accomplishments, 3000s)

1. Pick the next unused ID in that module's range.
2. `HomePage.ts` likely already has the locator method you need (`accomplishmentCard(slug)`, etc.)
   — check before adding a new one.
3. Write the spec in `tests/specs/`, following §4–§6 above.
4. Update the ID-range table in this file from "reserved" to "covered" once the module has real
   coverage.
