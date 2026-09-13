using Microsoft.Playwright;

namespace OptumPlaywright.Pages;

/// <summary>
/// Page object for the Optum public homepage (https://www.optum.com/en/).
///
/// Selector priority for this suite (public third-party site — no data-testid/data-vu
/// automation attributes exist in the markup, unlike an internally-built app):
///   1. ARIA role + accessible name (<c>GetByRole</c>) — resilient to styling/markup changes.
///   2. Visible text (<c>GetByText</c>) — for final content assertions only.
///   3. CSS selector, scoped to a landmark (<c>header</c>/<c>footer</c>) to disambiguate
///      duplicate link text — last resort, flagged with a TODO if used outside a landmark scope.
/// </summary>
public sealed class HomePage
{
    private readonly IPage _page;

    public const string Url = "https://www.optum.com/en/";

    public HomePage(IPage page) => _page = page;

    public async Task GotoAsync() => await _page.GotoAsync(Url, new PageGotoOptions { WaitUntil = WaitUntilState.DOMContentLoaded });

    // ── Header / navigation ─────────────────────────────────────────────
    public ILocator CustomerServiceNavLink() =>
        _page.Locator("header").GetByRole(AriaRole.Link, new() { Name = "Customer service", Exact = true });

    // "Sign in" opens an audience-picker menu in the header — it isn't consistently exposed
    // with an ARIA link/button role across breakpoints, so this falls back to a text locator
    // per the selector-priority rule (ARIA role+name first, text as the documented fallback).
    // The header renders a second, CSS-hidden "Sign in" span for the mobile breakpoint, so the
    // locator is filtered to `visible=true` — otherwise `.First` can resolve to the hidden one.
    public ILocator SignInLink() =>
        _page.Locator("header").Locator("text=Sign in >> visible=true").First;

    // ── Hero ─────────────────────────────────────────────────────────────
    public ILocator HeroHeading() =>
        _page.GetByRole(AriaRole.Heading, new() { Name = "Health care you can count on", Level = 1 });

    public ILocator FindCareCta() => _page.GetByRole(AriaRole.Link, new() { Name = "Find care near you" });
    public ILocator PayBillCta() => _page.GetByRole(AriaRole.Link, new() { Name = "Pay a medical bill" });
    public ILocator ManageHsaFsaCta() => _page.GetByRole(AriaRole.Link, new() { Name = "Manage an HSA or FSA" });
    public ILocator FillPrescriptionCta() => _page.GetByRole(AriaRole.Link, new() { Name = "Fill a prescription" });

    // ── Footer ───────────────────────────────────────────────────────────
    public ILocator FooterAboutUsLink() =>
        _page.Locator("footer").GetByRole(AriaRole.Link, new() { Name = "About us", Exact = true });

    public ILocator FooterCareersLink() =>
        _page.Locator("footer").GetByRole(AriaRole.Link, new() { Name = "Careers", Exact = true });

    public ILocator FooterPrivacyPolicyLink() =>
        _page.Locator("footer").GetByRole(AriaRole.Link, new() { Name = "Privacy policy", Exact = true });

    public ILocator FooterTermsOfUseLink() =>
        _page.Locator("footer").GetByRole(AriaRole.Link, new() { Name = "Terms of use", Exact = true });

    // ── Actions ──────────────────────────────────────────────────────────
    public async Task ClickCustomerServiceNavAsync() => await CustomerServiceNavLink().ClickAsync();
    public async Task ClickFooterAboutUsAsync() => await FooterAboutUsLink().ClickAsync();
}
