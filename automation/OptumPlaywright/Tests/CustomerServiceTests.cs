using Allure.NUnit;
using NUnit.Framework;
using OptumPlaywright.Pages;
using OptumPlaywright.Support;

namespace OptumPlaywright.Tests;

[AllureNUnit]
[Parallelizable(ParallelScope.Children)]
[FixtureLifeCycle(LifeCycle.InstancePerTestCase)]
public sealed class CustomerServiceTests : TestBase
{
    private async Task<CustomerServicePage> GoToCustomerServiceAsync()
    {
        var page = new CustomerServicePage(Page);
        await GotoAndTimeAsync(CustomerServicePage.Url);
        return page;
    }

    // What it Tests: The Customer Service page heading renders on direct navigation.
    // Why it Matters: This page is the primary self-service destination linked from every other
    // page's header nav — if it 404s or fails to render, support-seeking visitors have nowhere to go.
    [Test]
    [Category("smoke")]
    [Category("customer-service")]
    public async Task Test_Case_2000_CustomerService_PageHeading_IsVisible()
    {
        var page = await GoToCustomerServiceAsync();

        await TestStep("Then the 'Customer service' heading is visible", async () =>
        {
            await Soft.ExpectVisibleAsync(page.PageHeading());
        });

        Soft.Verify();
    }

    // What it Tests: The "Common service questions" FAQ section renders.
    // Why it Matters: The FAQ section deflects a large share of support contacts (sign-in help,
    // bill pay, patient portal) — if it silently fails to load, support volume spikes with no
    // visible signal to the team.
    [Test]
    [Category("regression")]
    [Category("customer-service")]
    public async Task Test_Case_2001_CustomerService_CommonQuestionsSection_IsVisible()
    {
        var page = await GoToCustomerServiceAsync();

        await TestStep("Then the 'Common service questions' section is visible", async () =>
        {
            await Soft.ExpectVisibleAsync(page.CommonQuestionsSection());
        });

        Soft.Verify();
    }

    // What it Tests: The "Contact us" link is present and enabled for visitors who don't find
    // their answer in the FAQ.
    // Why it Matters: This is the final fallback for unresolved support questions — a broken
    // link here means the visitor has no remaining path to get help.
    [Test]
    [Category("smoke")]
    [Category("customer-service")]
    public async Task Test_Case_2002_CustomerService_ContactUsLink_IsPresentAndClickable()
    {
        var page = await GoToCustomerServiceAsync();

        await TestStep("Then the 'Contact us' link is visible and enabled", async () =>
        {
            await Soft.ExpectVisibleAsync(page.ContactUsLink());
            await Soft.ExpectEnabledAsync(page.ContactUsLink());
        });

        Soft.Verify();
    }
}
