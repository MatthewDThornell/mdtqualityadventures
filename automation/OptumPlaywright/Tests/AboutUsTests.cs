using Allure.NUnit;
using NUnit.Framework;
using OptumPlaywright.Pages;
using OptumPlaywright.Support;

namespace OptumPlaywright.Tests;

[AllureNUnit]
[Parallelizable(ParallelScope.Children)]
[FixtureLifeCycle(LifeCycle.InstancePerTestCase)]
public sealed class AboutUsTests : TestBase
{
    private async Task<AboutUsPage> GoToAboutUsAsync()
    {
        var page = new AboutUsPage(Page);
        await GotoAndTimeAsync(AboutUsPage.Url);
        return page;
    }

    // What it Tests: The About Optum page heading renders on direct navigation.
    // Why it Matters: This is a common landing page for candidates, press, and investors —
    // a broken company page reflects poorly on brand trust in a healthcare context.
    [Test]
    [Category("smoke")]
    [Category("about-us")]
    public async Task Test_Case_3000_AboutUs_PageHeading_IsVisible()
    {
        var page = await GoToAboutUsAsync();

        await TestStep("Then the 'About Optum' heading is visible", async () =>
        {
            await Soft.ExpectVisibleAsync(page.PageHeading());
        });

        Soft.Verify();
    }

    // What it Tests: The "Healthy Optumism" brand-narrative section renders.
    // Why it Matters: This section carries Optum's differentiated brand messaging — a CMS content
    // regression here is easy to miss visually but shows up immediately as a missing element.
    [Test]
    [Category("regression")]
    [Category("about-us")]
    public async Task Test_Case_3001_AboutUs_HealthyOptumismSection_IsVisible()
    {
        var page = await GoToAboutUsAsync();

        await TestStep("Then the 'Healthy Optumism' section is visible", async () =>
        {
            await Soft.ExpectVisibleAsync(page.HealthyOptumismSection());
        });

        Soft.Verify();
    }
}
