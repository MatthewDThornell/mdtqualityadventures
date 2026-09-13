using Microsoft.Playwright;

namespace OptumPlaywright.Pages;

/// <summary>Page object for the "About Optum" page (https://www.optum.com/en/about-us.html).</summary>
public sealed class AboutUsPage
{
    private readonly IPage _page;

    public const string Url = "https://www.optum.com/en/about-us.html";

    public AboutUsPage(IPage page) => _page = page;

    public async Task GotoAsync() => await _page.GotoAsync(Url, new PageGotoOptions { WaitUntil = WaitUntilState.DOMContentLoaded });

    public ILocator PageHeading() =>
        _page.GetByRole(AriaRole.Heading, new() { Name = "About Optum", Level = 1 });

    public ILocator HealthyOptumismSection() =>
        _page.GetByText("Healthy Optumism", new() { Exact = false });
}
