using Allure.NUnit;
using NUnit.Framework;
using OptumPlaywright.Pages;
using OptumPlaywright.Support;

namespace OptumPlaywright.Tests;

/// <summary>Cross-page navigation flows — clicking a link on one page and verifying the
/// destination page loads correctly. Distinct from the single-page suites, which only verify
/// a page renders correctly on direct navigation.</summary>
[AllureNUnit]
[Parallelizable(ParallelScope.Children)]
[FixtureLifeCycle(LifeCycle.InstancePerTestCase)]
public sealed class NavigationTests : TestBase
{
    private async Task<HomePage> GoToHomeAsync()
    {
        var home = new HomePage(Page);
        await GotoAndTimeAsync(HomePage.Url);
        return home;
    }

    // What it Tests: Clicking the header "Customer service" nav link from the homepage lands on
    // the Customer Service page.
    // Why it Matters: This is the single most-used support path from the homepage — a broken
    // link here silently strands every visitor looking for help.
    [Test]
    [Category("smoke")]
    [Category("integration")]
    public async Task Test_Case_5000_Navigation_HomeToCustomerService_HeaderNavLinkRoutesCorrectly()
    {
        var home = await GoToHomeAsync();
        var customerService = new CustomerServicePage(Page);

        await TestStep("When I click the Customer service nav link", async () =>
        {
            await home.ClickCustomerServiceNavAsync();
            await Page.WaitForLoadStateAsync(Microsoft.Playwright.LoadState.DOMContentLoaded);
        });

        await TestStep("Then the URL and heading confirm the Customer Service page loaded", async () =>
        {
            await Soft.ExpectHasUrlAsync(Page, new System.Text.RegularExpressions.Regex("customer-support"));
            await Soft.ExpectVisibleAsync(customerService.PageHeading());
        });

        Soft.Verify();
    }

    // What it Tests: Clicking the footer "About us" link from the homepage lands on the About Us page.
    // Why it Matters: Footer navigation is shared across every page on the site — a single broken
    // footer link is a site-wide regression, not a one-page issue.
    [Test]
    [Category("regression")]
    [Category("integration")]
    public async Task Test_Case_5001_Navigation_HomeToAboutUs_FooterLinkRoutesCorrectly()
    {
        var home = await GoToHomeAsync();
        var aboutUs = new AboutUsPage(Page);

        await TestStep("When I click the footer About us link", async () =>
        {
            await home.ClickFooterAboutUsAsync();
            await Page.WaitForLoadStateAsync(Microsoft.Playwright.LoadState.DOMContentLoaded);
        });

        await TestStep("Then the URL and heading confirm the About Us page loaded", async () =>
        {
            await Soft.ExpectHasUrlAsync(Page, new System.Text.RegularExpressions.Regex("about-us"));
            await Soft.ExpectVisibleAsync(aboutUs.PageHeading());
        });

        Soft.Verify();
    }
}
