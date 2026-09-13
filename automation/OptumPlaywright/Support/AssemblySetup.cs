using Microsoft.Playwright;
using NUnit.Framework;
using OptumPlaywright.Support;

// Deliberately in the top-level OptumPlaywright namespace, not OptumPlaywright.Support: NUnit
// scopes a [SetUpFixture] to its own namespace plus descendants, and OptumPlaywright.Tests is a
// sibling of OptumPlaywright.Support, not a child — a SetUpFixture placed in .Support would never
// wrap the test fixtures and Browser/Config would stay null.
namespace OptumPlaywright;

/// <summary>
/// Runs once for the entire assembly: launches a single shared Chromium instance before any
/// test starts, and closes it (plus writes the results dashboard) after the last test finishes.
/// Individual tests never launch their own browser — see <see cref="TestBase"/> for the
/// per-test context/page that is created from this shared browser.
/// </summary>
[SetUpFixture]
public class AssemblySetup
{
    internal static IPlaywright PlaywrightDriver { get; private set; } = null!;
    internal static IBrowser Browser { get; private set; } = null!;
    internal static AppConfig Config { get; private set; } = null!;

    [OneTimeSetUp]
    public async Task GlobalSetUpAsync()
    {
        Config = new AppConfig();
        PlaywrightDriver = await Playwright.CreateAsync();
        Browser = await PlaywrightDriver.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
        {
            Headless = Config.Headless,
        });
    }

    [OneTimeTearDown]
    public async Task GlobalTearDownAsync()
    {
        ResultsCollector.WriteDashboard(Config);
        await Browser.CloseAsync();
        PlaywrightDriver.Dispose();
    }
}
