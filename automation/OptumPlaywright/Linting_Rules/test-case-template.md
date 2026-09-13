# Test Template (OptumPlaywright)

Copy/paste starting point for a new test. See `test-case-setup.md` for the full rules.

```csharp
// What it Tests: <feature-specific sentence>
// Why it Matters: <business/risk sentence>
[Test]
[Category("smoke")]           // tier — required
[Category("<module>")]        // module — required, e.g. home, customer-service, about-us, integration
public async Task Test_Case_####_<Feature>_<Element>_<Behavior>()
{
    var page = await GoTo<Feature>Async();

    await TestStep("Then <expected outcome is visible/present>", async () =>
    {
        await Soft.ExpectVisibleAsync(page.SomeLocator());
        // additional assertions
    });

    Soft.Verify();
}
```

> Keep test IDs in the reserved range for the module (see the table in `test-case-setup.md`).
> Keep assertions in `Soft` where possible and call `Soft.Verify()` at the end.

---

## Cross-Page Navigation Template

Use this for tests that click through from one page to another (module category `integration`,
ID range 5000–5999).

```csharp
// What it Tests: Clicking <link> on <source page> lands on <destination page>.
// Why it Matters: <why this specific path matters — traffic volume, conversion funnel, etc.>
[Test]
[Category("smoke")]           // or regression, depending on how critical the path is
[Category("integration")]
public async Task Test_Case_5###_Navigation_<Source>To<Destination>_<LinkDescription>RoutesCorrectly()
{
    var source = await GoTo<Source>Async();
    var destination = new <Destination>Page(Page);

    await TestStep("When I click <link>", async () =>
    {
        await source.Click<Link>Async();
        await Page.WaitForLoadStateAsync(Microsoft.Playwright.LoadState.DOMContentLoaded);
    });

    await TestStep("Then the URL and heading confirm the destination page loaded", async () =>
    {
        await Soft.ExpectHasUrlAsync(Page, new System.Text.RegularExpressions.Regex("<url-fragment>"));
        await Soft.ExpectVisibleAsync(destination.PageHeading());
    });

    Soft.Verify();
}
```

---

## Accessibility Template

Use when asserting ARIA attributes on interactive elements. Not yet used in this suite (see
`test-coverage-analysis.md` roadmap) — included here so the pattern is ready when accessibility
work starts.

```csharp
// What it Tests: The <Element> has an accessible label for screen reader users.
// Why it Matters: Elements without accessible names are invisible to screen readers (WCAG 4.1.2) —
// a compliance requirement on a healthcare site.
[Test]
[Category("regression")]
[Category("accessibility")]
[Category("<module>")]
public async Task Test_Case_8###_<Feature>_<Element>_HasAccessibleLabel()
{
    var page = await GoTo<Feature>Async();

    await TestStep("Then <Element> has a non-empty accessible name", async () =>
    {
        var label = await page.<Element>().GetAttributeAsync("aria-label");
        Assert.That(label, Is.Not.Null.And.Not.Empty,
            "<Element> must have an accessible name for screen reader users.");
    });

    Soft.Verify();
}
```

> Never tag accessibility tests as `smoke` — they're regression-tier by convention here.

---

## A Note on Network Mocking

This suite has no `ApiMockService` — every test hits the real, live optum.com site (there's no
UAT/mock environment for a public marketing site, unlike an internally-built app). If a future
test needs to simulate an error state (e.g. a slow or failed network response), use Playwright's
route interception directly in the test:

```csharp
await Page.RouteAsync("**/some-endpoint**", route => route.AbortAsync());
```

Keep this scoped to the single test that needs it — don't register a global mock in `TestBase`,
since every other test in the suite depends on real responses from the live site.
