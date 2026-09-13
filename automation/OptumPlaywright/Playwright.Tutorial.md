# Optum Playwright — Tutorial

> A guide for anyone working in the `OptumPlaywright/` test suite.
> Covers what the tests do, how to run them, how each piece fits together, and how to write a
> new test from scratch.

---

## Table of Contents

1. [What This Suite Tests](#1-what-this-suite-tests)
2. [Prerequisites](#2-prerequisites)
3. [Project Structure](#3-project-structure)
4. [Run Commands](#4-run-commands)
5. [How a Test Runs — The Lifecycle](#5-how-a-test-runs--the-lifecycle)
6. [Key Building Blocks](#6-key-building-blocks)
7. [Test Categories & ID Ranges](#7-test-categories--id-ranges)
8. [Writing a New Test](#8-writing-a-new-test)
9. [The Results Dashboard](#9-the-results-dashboard)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. What This Suite Tests

This is a Playwright/C# end-to-end test suite for the public [optum.com](https://www.optum.com/en/)
site, built to demonstrate structure and conventions for automated testing of a complex,
production web application. It's a sibling to the `cypress/` suite in the same repository — this
suite favors structure (page objects, typed C#, a results dashboard, a linting/authoring guide);
Cypress is used for fast, in-your-face debugging of individual specs.

Unlike an internally-built application, optum.com is a live third-party-to-this-repo production
site: there's no mock/UAT environment, no `data-testid` automation attributes, and no login flow
for the public pages this suite covers. Every test hits the real site.

| Module | What's Tested |
|---|---|
| **Home** | Hero heading, header nav, hero CTAs, footer links, page title |
| **Customer Service** | Page heading, FAQ section, Contact us fallback link |
| **About Us** | Page heading, brand narrative section |
| **Integration** | Cross-page navigation (header nav, footer links) |

See `Test_Case_Dashboards_and_Results/test-coverage-analysis.md` for the full feature inventory
and what's still uncovered.

---

## 2. Prerequisites

| Tool | Version | Notes |
|---|---|---|
| .NET SDK | 9.0+ | `dotnet --version` to verify |
| Playwright browsers | Chromium | Installed via the step below |

### First-Time Setup

From the `OptumPlaywright/` directory:

```bash
dotnet restore
dotnet build
pwsh bin/Debug/net9.0/playwright.ps1 install chromium
```

No dev server, no credentials, no `.env` file — every test targets the live public site.

---

## 3. Project Structure

```
OptumPlaywright/
│
├── Settings/
│   ├── local.runsettings           # Default settings — headless, live site
│   └── headed-local.runsettings    # Same, but Headless=false (for debugging)
│
├── Pages/                          # Page Object Model
│   ├── HomePage.cs
│   ├── AboutUsPage.cs
│   └── CustomerServicePage.cs
│
├── Support/
│   ├── AssemblySetup.cs            # [SetUpFixture] — shared browser lifecycle
│   ├── TestBase.cs                 # [SetUp]/[TearDown] — context, tracing, results recording
│   ├── SoftAssertions.cs           # Collects assertion failures instead of failing fast
│   ├── ResultsCollector.cs         # Aggregates results; writes the results dashboard
│   └── AppConfig.cs                # Reads BASE_URL / HEADLESS from the active .runsettings
│
├── Tests/
│   ├── HomeTests.cs                 # IDs 1000-1999
│   ├── CustomerServiceTests.cs      # IDs 2000-2999
│   ├── AboutUsTests.cs              # IDs 3000-3999
│   └── NavigationTests.cs           # IDs 5000-5999 (integration)
│
├── Linting_Rules/
│   ├── test-case-setup.md          # Authoring guide — read before writing a test
│   └── test-case-template.md       # Copy-paste templates
│
├── Scripts/
│   └── run-tests.ps1               # Colorized PowerShell test runner
│
├── Test_Case_Dashboards_and_Results/
│   ├── mapping.json                 # Test ID registry — every test must be registered here
│   ├── testcases.csv                # Test case export (Gherkin steps, module, tier)
│   ├── test-coverage-analysis.md    # Feature coverage matrix + roadmap
│   └── test-results-dashboard.md    # Auto-generated after every run — do not edit by hand
│
└── OptumPlaywright.csproj           # .NET 9 — Playwright 1.49, NUnit 4.2, Allure.NUnit 2.15
```

---

## 4. Run Commands

```powershell
# From OptumPlaywright/Scripts/
./run-tests.ps1                          # smoke suite (default)
./run-tests.ps1 -Category regression
./run-tests.ps1 -Category home -Settings headed-local.runsettings   # visible browser
```

```bash
# From OptumPlaywright/ — direct dotnet test
dotnet test --filter "Category=smoke" --settings Settings/local.runsettings
dotnet test --filter "FullyQualifiedName~Test_Case_1000" --settings Settings/local.runsettings
dotnet test --filter "FullyQualifiedName~HomeTests" --settings Settings/local.runsettings
```

| Category | What Runs |
|---|---|
| `smoke` | Happy-path tests — fastest, safe for every run |
| `regression` | Broader content/behavior coverage |
| `home` / `customer-service` / `about-us` / `integration` | All tests for that module |

---

## 5. How a Test Runs — The Lifecycle

### Assembly Level (once per run)

`AssemblySetup.cs` — a `[SetUpFixture]` in the top-level `OptumPlaywright` namespace so it wraps
every test namespace in the assembly:

1. Launches a single shared Chromium instance.
2. Loads `AppConfig` from environment variables set by the active `.runsettings`.
3. On teardown, writes the results dashboard and closes the browser.

> **Namespace gotcha:** NUnit scopes a `[SetUpFixture]` to its own namespace plus descendants.
> This class originally lived in `OptumPlaywright.Support` — a sibling of `OptumPlaywright.Tests`,
> not a parent — so it silently never ran, and every test failed with a `NullReferenceException`
> on `AssemblySetup.Browser`. Moving it to the top-level `OptumPlaywright` namespace fixed it.
> Worth knowing if you ever see that exact failure mode.

### Test Level (once per test method)

`TestBase.cs`:

1. **SetUp** — creates an isolated `IBrowserContext` (1440×900 viewport), starts Playwright
   tracing, opens a fresh `IPage`, sets timeouts.
2. Test body runs.
3. **TearDown** — if `Soft.Verify()` was never called, calls it now (safety net); on failure,
   saves a screenshot + trace zip to `TestResults/`; records the outcome via `ResultsCollector`.

### Parallelism

`[Parallelizable(ParallelScope.Children)]` + `[FixtureLifeCycle(LifeCycle.InstancePerTestCase)]`
on every fixture means each parallel test case gets its own instance — no shared `Page` or
`Context` between tests running at the same time.

---

## 6. Key Building Blocks

### TestBase

```csharp
protected IPage Page;               // Use this for all browser interactions
protected AppConfig Config;         // BaseUrl, Headless, timeouts
protected SoftAssertions Soft;      // Collect assertion failures without failing fast
```

```csharp
await TestStep("Then X is visible", async () => { ... });   // Allure step + console log
await GotoAndTimeAsync(SomePage.Url);                          // navigate + record page-load time
```

### Page Objects

Two responsibilities: selectors (return `ILocator`, never a raw string in test code) and actions
(async methods combining multiple interactions).

```csharp
public ILocator HeroHeading() =>
    Page.GetByRole(AriaRole.Heading, new() { Name = "Health care you can count on", Level = 1 });

public async Task ClickCustomerServiceNavAsync() => await CustomerServiceNavLink().ClickAsync();
```

### SoftAssertions

```csharp
await Soft.ExpectVisibleAsync(home.HeroHeading());
await Soft.ExpectVisibleAsync(home.FindCareCta());
// ... more checks ...
Soft.Verify();   // throws once, at the end, with every failure collected — not just the first
```

### TestStep + Allure

```csharp
await TestStep("Then the hero heading is visible", async () =>
{
    await Soft.ExpectVisibleAsync(home.HeroHeading());
});
```

Generate an Allure report after a run:

```bash
npm install -g allure-commandline
allure generate allure-results --clean -o allure-report
allure open allure-report
```

---

## 7. Test Categories & ID Ranges

See `Linting_Rules/test-case-setup.md` section 3 for the authoritative table. Summary: 1000s Home,
2000s Customer Service, 3000s About Us, 5000s Integration; 4000s/6000s/7000s/8000s reserved for
Pharmacy, Financial, Find Care, and Accessibility respectively as coverage expands.

---

## 8. Writing a New Test

1. Read `Linting_Rules/test-case-setup.md` and `test-case-template.md`.
2. Pick the next unused ID in the right range (`Test_Case_Dashboards_and_Results/mapping.json`).
3. Copy the relevant template.
4. Write the test — `// What it Tests:` / `// Why it Matters:` comments, `Soft.*` assertions,
   `TestStep()` wrapping, `Soft.Verify()` at the end.
5. Add a page object method if the selector doesn't exist yet.
6. Register the test in `mapping.json` **and** `testcases.csv`.
7. `dotnet build` clean, then run your new test, then run the `smoke` suite to check for regressions.

---

## 9. The Results Dashboard

`Test_Case_Dashboards_and_Results/test-results-dashboard.md` is regenerated by
`ResultsCollector.WriteDashboard` after every run (`AssemblySetup.GlobalTearDownAsync`). It shows:

- Overall pass/fail summary with an ASCII progress bar.
- Defect guard status (tests tagged `[Category("bug-regression")]` — none registered yet).
- Slow tests (> 10s) and page response times, broken out by page.
- Per-module pass/fail breakdown with individual test durations.

Do not edit it by hand — it's overwritten on the next run.

---

## 10. Troubleshooting

### A locator resolves but the assertion still fails as "hidden"

**Cause:** optum.com renders duplicate elements for different breakpoints (e.g. a
mobile-only nav item hidden via CSS at desktop viewport). `.First` can resolve to the hidden copy.

**Fix:** filter to `visible=true`:
```csharp
Page.Locator("header").Locator("text=Sign in >> visible=true").First
```

### Every test fails in SetUp/TearDown with `NullReferenceException` on `AssemblySetup.Browser`

**Cause:** `AssemblySetup`'s `[SetUpFixture]` is in a namespace that isn't a parent of the test
fixtures' namespace, so its `[OneTimeSetUp]` never ran. See the callout in section 5.

**Fix:** the `[SetUpFixture]` class must live in the same namespace as the tests, or a parent of it
(e.g. the top-level `OptumPlaywright` namespace covers both `OptumPlaywright.Tests` and
`OptumPlaywright.Support`).

### `WaitForLoadStateAsync(NetworkIdle)` never resolves

**Cause:** third-party analytics/tag-manager scripts poll continuously on a real production site.

**Fix:** use `DOMContentLoaded` (the `GotoAndTimeAsync` default) or wait on a specific element.

### `HEADLESS=false` in a `.runsettings` file has no effect — tests still run headless

**Cause:** `<EnvironmentVariables>` in `.runsettings` is not reliably forwarded to the `testhost`
process by `dotnet test` with this adapter — `Environment.GetEnvironmentVariable("HEADLESS")` came
back `null` inside the test process even with the value set in the file, so `AppConfig` silently
fell back to headless. Confirmed by temporarily logging the value from `TestBase.SetUp`.

**Fix:** `AppConfig` reads from NUnit's own `TestContext.Parameters` (populated from a
`<TestRunParameters>` block in `.runsettings`), falling back to a process environment variable and
then a default. `TestRunParameters` is NUnit-native and is what actually works with `dotnet test`:

```xml
<TestRunParameters>
  <Parameter name="HEADLESS" value="false" />
</TestRunParameters>
```

Worth knowing if a future setting (a new env-style config value) silently doesn't take effect —
check `TestRunParameters` before assuming the code reading it is wrong.

### A `run-tests.ps1` edit throws a parser error about a missing string terminator

**Cause:** Windows PowerShell 5.1 reads `.ps1` files without a BOM using the system codepage, not
UTF-8 — a smart quote or em dash (`—`) written by an editor can corrupt the parse of everything
after it on that line.

**Fix:** stick to plain ASCII punctuation (`-` instead of `—`, straight quotes) in `.ps1` files.
