using Allure.NUnit;
using Microsoft.Playwright;
using NUnit.Framework;
using OptumPlaywright.Pages;
using OptumPlaywright.Support;

namespace OptumPlaywright.Tests;

[AllureNUnit]
[Parallelizable(ParallelScope.Children)]
[FixtureLifeCycle(LifeCycle.InstancePerTestCase)]
public sealed class HomeTests : TestBase
{
    private async Task<HomePage> GoToHomeAsync()
    {
        var home = new HomePage(Page);
        await GotoAndTimeAsync(HomePage.Url);
        return home;
    }

    // What it Tests: The homepage hero heading renders on load.
    // Why it Matters: It's the first thing every visitor sees — if it's missing, the page
    // likely failed to render at all.
    [Test]
    [Category("smoke")]
    [Category("home")]
    public async Task Test_Case_1000_Home_HeroHeading_IsVisible()
    {
        var home = await GoToHomeAsync();

        await TestStep("Then the hero heading 'Health care you can count on' is visible", async () =>
        {
            await Soft.ExpectVisibleAsync(home.HeroHeading());
        });

        Soft.Verify();
    }

    // What it Tests: The header navigation links (Customer service, Sign in) are present and enabled.
    // Why it Matters: A broken header nav blocks visitors from reaching support or their account
    // from every single page on the site.
    [Test]
    [Category("smoke")]
    [Category("home")]
    public async Task Test_Case_1001_Home_HeaderNavLinks_ArePresentAndEnabled()
    {
        var home = await GoToHomeAsync();

        await TestStep("Then the Customer service nav link is visible and enabled", async () =>
        {
            await Soft.ExpectVisibleAsync(home.CustomerServiceNavLink());
            await Soft.ExpectEnabledAsync(home.CustomerServiceNavLink());
        });

        await TestStep("And the Sign in link is visible and enabled", async () =>
        {
            await Soft.ExpectVisibleAsync(home.SignInLink());
            await Soft.ExpectEnabledAsync(home.SignInLink());
        });

        Soft.Verify();
    }

    // What it Tests: All four hero CTAs (Find care, Pay a bill, Manage HSA/FSA, Fill a prescription)
    // are visible and clickable.
    // Why it Matters: These four CTAs are the primary entry points into Optum's core product
    // lines — a broken CTA silently removes an entire funnel.
    [Test]
    [Category("smoke")]
    [Category("home")]
    public async Task Test_Case_1002_Home_HeroCtas_AreVisibleAndEnabled()
    {
        var home = await GoToHomeAsync();

        await TestStep("Then each hero CTA is visible and enabled", async () =>
        {
            await Soft.ExpectVisibleAsync(home.FindCareCta());
            await Soft.ExpectEnabledAsync(home.FindCareCta());

            await Soft.ExpectVisibleAsync(home.PayBillCta());
            await Soft.ExpectEnabledAsync(home.PayBillCta());

            await Soft.ExpectVisibleAsync(home.ManageHsaFsaCta());
            await Soft.ExpectEnabledAsync(home.ManageHsaFsaCta());

            await Soft.ExpectVisibleAsync(home.FillPrescriptionCta());
            await Soft.ExpectEnabledAsync(home.FillPrescriptionCta());
        });

        Soft.Verify();
    }

    // What it Tests: The footer legal/company links (About us, Careers, Privacy policy, Terms of use)
    // are present.
    // Why it Matters: Missing legal links (Privacy policy, Terms of use) is a compliance risk on a
    // healthcare site, not just a cosmetic bug.
    [Test]
    [Category("regression")]
    [Category("home")]
    public async Task Test_Case_1003_Home_FooterLinks_ArePresent()
    {
        var home = await GoToHomeAsync();

        await TestStep("Then the footer company and legal links are visible", async () =>
        {
            await Soft.ExpectVisibleAsync(home.FooterAboutUsLink());
            await Soft.ExpectVisibleAsync(home.FooterCareersLink());
            await Soft.ExpectVisibleAsync(home.FooterPrivacyPolicyLink());
            await Soft.ExpectVisibleAsync(home.FooterTermsOfUseLink());
        });

        Soft.Verify();
    }

    // What it Tests: The homepage <title> matches the expected SEO title.
    // Why it Matters: The title tag drives search-result snippets and browser tab identification;
    // an unexpected change often signals a bad deploy or CMS misconfiguration.
    [Test]
    [Category("smoke")]
    [Category("home")]
    public async Task Test_Case_1004_Home_PageTitle_MatchesExpected()
    {
        await GoToHomeAsync();

        await TestStep("Then the page title contains 'Optum'", async () =>
        {
            await Soft.ExpectHasTitleAsync(Page, new System.Text.RegularExpressions.Regex("Optum"));
        });

        Soft.Verify();
    }
}
