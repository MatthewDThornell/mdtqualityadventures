using Microsoft.Playwright;

namespace OptumPlaywright.Pages;

/// <summary>Page object for the Customer Service page (https://www.optum.com/en/customer-support.html).</summary>
public sealed class CustomerServicePage
{
    private readonly IPage _page;

    public const string Url = "https://www.optum.com/en/customer-support.html";

    public CustomerServicePage(IPage page) => _page = page;

    public async Task GotoAsync() => await _page.GotoAsync(Url, new PageGotoOptions { WaitUntil = WaitUntilState.DOMContentLoaded });

    public ILocator PageHeading() =>
        _page.GetByRole(AriaRole.Heading, new() { Name = "Customer service", Level = 1, Exact = true });

    public ILocator CommonQuestionsSection() =>
        _page.GetByText("Common service questions", new() { Exact = false });

    public ILocator ContactUsLink() =>
        _page.GetByRole(AriaRole.Link, new() { Name = "Contact us" }).First;

    public ILocator PatientPortalLink() =>
        _page.GetByRole(AriaRole.Link, new() { Name = "View patient portal" });
}
