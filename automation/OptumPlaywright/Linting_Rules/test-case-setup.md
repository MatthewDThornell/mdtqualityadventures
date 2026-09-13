# Test Authoring Guide (OptumPlaywright)

Read this before writing a new test. It defines the conventions the suite is built around —
skipping any of these makes a test inconsistent with the rest of the codebase, even if it passes.

---

## 1. File-Scoped Namespaces

All `.cs` files use file-scoped namespaces (C# 10+). No curly braces around the namespace.

```csharp
namespace OptumPlaywright.Tests;    // Tests
namespace OptumPlaywright.Pages;    // Page objects
namespace OptumPlaywright.Support;  // Support / infrastructure
```

---

## 2. Test Class Structure

```csharp
using Allure.NUnit;
using NUnit.Framework;
using OptumPlaywright.Pages;
using OptumPlaywright.Support;

namespace OptumPlaywright.Tests;

[AllureNUnit]
[Parallelizable(ParallelScope.Children)]
[FixtureLifeCycle(LifeCycle.InstancePerTestCase)]
public sealed class <Feature>Tests : TestBase
{
    // 1. Private "GoTo<Feature>Async" helper (navigates, returns typed page object)
    // 2. Test methods ordered by ID
}
```

**Rules:**
- Always `sealed` — no test class inheritance beyond `TestBase`.
- Always `[AllureNUnit]`, `[Parallelizable(ParallelScope.Children)]`, and
  `[FixtureLifeCycle(LifeCycle.InstancePerTestCase)]`. The lifecycle attribute is required, not
  optional — without it, parallel test cases within the same fixture share one `Page`/`Context`
  instance and corrupt each other's state. See `Support/TestBase.cs`.
- Always extend `TestBase` — it provides `Page`, `Config`, `Soft`, `TestStep()`, `GotoAndTimeAsync()`,
  and the SetUp/TearDown lifecycle.

---

## 3. Test Method Naming Convention

```
Test_Case_{ID}_{Feature}_{Element}_{Behavior}
```

### ID Ranges

| Range | Module |
|-------|--------|
| 1000–1999 | Home |
| 2000–2999 | Customer Service |
| 3000–3999 | About Us |
| 4000–4999 | (reserved — Pharmacy) |
| 5000–5999 | Integration (cross-page navigation) |
| 6000–6999 | (reserved — Financial / HSA-FSA) |
| 7000–7999 | (reserved — Find Care / Provider Search) |
| 8000–8999 | (reserved — Accessibility) |

Before using an ID, check `Test_Case_Dashboards_and_Results/mapping.json` to confirm it isn't
already taken.

**Examples:**
- `Test_Case_1000_Home_HeroHeading_IsVisible`
- `Test_Case_2002_CustomerService_ContactUsLink_IsPresentAndClickable`
- `Test_Case_5000_Navigation_HomeToCustomerService_HeaderNavLinkRoutesCorrectly`

---

## 4. Test Categories

Every test must have at least one **tier** category and one **module** category.

**Tier categories** (pick one or more):
- `smoke` — critical-path tests that must pass on every run.
- `regression` — broader coverage, secondary flows and content sections.
- `e2e` — full multi-page user journeys.

**Module categories:** `home`, `customer-service`, `about-us`, `integration`.

```csharp
[Test]
[Category("smoke")]
[Category("home")]
public async Task Test_Case_1000_Home_HeroHeading_IsVisible()
```

---

## 5. Selector Priority

optum.com is a public third-party site — there are **no `data-testid`/automation attributes** in
its markup (unlike an internally-built application you control). Priority order:

| Priority | Use When |
|----------|----------|
| `GetByRole(role, name)` | Default choice — resilient to styling/markup changes, matches how a screen reader sees the page |
| `GetByText(...)` | User-visible text, for final content assertions or when role can't disambiguate |
| CSS selector scoped to a landmark (`header`, `footer`, `main`) | Needed to disambiguate duplicate text/role matches across the page — always scope it, never a bare global CSS selector |
| CSS selector, unscoped | Last resort — must include a `// TODO:` comment explaining why role/text didn't work |

**Real example from this suite:** the homepage renders a second, CSS-hidden "Sign in" element for
the mobile breakpoint. `GetByText("Sign in").First` resolved to the *hidden* one and failed. Fix:
`Locator("text=Sign in >> visible=true")`. Always verify a new locator resolves to exactly one
**visible** element before trusting it — run the test headed if the result is surprising.

---

## 6. Test Body Pattern

```csharp
public async Task Test_Case_XXXX_Feature_Element_Behavior()
{
    // Arrange: navigate via the private helper
    var page = await GoTo<Feature>Async();

    // Act + Assert: wrap each logical step in TestStep()
    await TestStep("Then element is visible and enabled", async () =>
    {
        await Soft.ExpectVisibleAsync(page.SomeLocator());
        await Soft.ExpectEnabledAsync(page.SomeLocator());
    });

    // Always call Soft.Verify() at the end
    Soft.Verify();
}
```

**Rules:**
- Always use `Soft.*` assertions (not raw `Assert.That`) unless checking something where
  continuing the test makes no sense (e.g. the page navigated to the wrong URL entirely).
- Always call `Soft.Verify()` as the last line. `TestBase.TearDown` also calls it as a safety
  net if you forget — but the test will fail with a less informative "TearDown" error instead of
  a clean test-body failure, so don't rely on the safety net.
- Always wrap steps in `TestStep()` — every step description shows up in the console log and (via
  `[AllureNUnit]`) in the Allure report.
- **Never** use `Thread.Sleep`, `Task.Delay`, or `Page.WaitForTimeoutAsync` — use Playwright's
  built-in auto-waiting (`Soft.ExpectVisibleAsync` already retries) or explicit state waits
  (`Page.WaitForLoadStateAsync`).
- **Never** use `WaitForLoadStateAsync(LoadState.NetworkIdle)` on optum.com — third-party
  analytics/tag-manager scripts poll continuously and it will not resolve reliably. Use
  `DOMContentLoaded` (the default in `GotoAndTimeAsync`) or wait on a specific element instead.

---

## 7. GoTo Helper Pattern

Each test class has a private helper that navigates to the page under test and returns its typed
page object:

```csharp
private async Task<CustomerServicePage> GoToCustomerServiceAsync()
{
    var page = new CustomerServicePage(Page);
    await GotoAndTimeAsync(CustomerServicePage.Url);
    return page;
}
```

`GotoAndTimeAsync` (defined on `TestBase`) navigates and records the page-load duration into
`ResultsCollector` for the "Page Response Times" section of the results dashboard — always use it
instead of calling `Page.GotoAsync` directly in a test.

For cross-page flows (see `NavigationTests.cs`), start from one page object's action method
(e.g. `home.ClickFooterAboutUsAsync()`) rather than navigating directly — the point of an
integration test is exercising the link, not just landing on the destination URL.

---

## 8. Registering a New Test

A test isn't complete until it's registered in **both**:

- `Test_Case_Dashboards_and_Results/mapping.json` — `{ testKey, methodName, filePath }`
- `Test_Case_Dashboards_and_Results/testcases.csv` — full row with Given/When/Then and expected result

A test present in one but not the other is considered unregistered.

---

## 9. Before Committing

```bash
dotnet build                                                          # must be clean
dotnet test --filter "FullyQualifiedName~Test_Case_XXXX" --settings Settings/local.runsettings  # your new test
dotnet test --filter "Category=smoke" --settings Settings/local.runsettings                      # smoke suite must not regress
```
