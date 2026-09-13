using System.Diagnostics;
using Allure.Net.Commons;
using Microsoft.Playwright;
using NUnit.Framework;
using NUnit.Framework.Interfaces;

namespace OptumPlaywright.Support;

/// <summary>
/// Abstract base class every test fixture extends. Provides <see cref="Page"/>,
/// <see cref="Config"/>, and <see cref="Soft"/>, plus SetUp/TearDown lifecycle: a fresh,
/// isolated browser context per test, Playwright tracing, failure screenshots, and result
/// recording into <see cref="ResultsCollector"/>.
/// </summary>
public abstract class TestBase
{
    protected IPage Page { get; private set; } = null!;
    protected AppConfig Config { get; private set; } = null!;
    protected SoftAssertions Soft { get; private set; } = null!;

    private IBrowserContext _context = null!;
    private readonly Stopwatch _stopwatch = new();

    [SetUp]
    public async Task SetUpAsync()
    {
        Config = AssemblySetup.Config;
        Soft = new SoftAssertions();

        _context = await AssemblySetup.Browser.NewContextAsync(new BrowserNewContextOptions
        {
            ViewportSize = new ViewportSize { Width = Config.ViewportWidth, Height = Config.ViewportHeight },
            UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) OptumPlaywright-Suite/1.0 Chrome/128.0.0.0 Safari/537.36",
        });

        await _context.Tracing.StartAsync(new TracingStartOptions { Screenshots = true, Snapshots = true, Sources = true });

        Page = await _context.NewPageAsync();
        Page.SetDefaultTimeout(Config.DefaultTimeoutMs);
        Page.SetDefaultNavigationTimeout(Config.NavigationTimeoutMs);

        _stopwatch.Restart();
    }

    [TearDown]
    public async Task TearDownAsync()
    {
        _stopwatch.Stop();

        // Safety net: a test that forgets to call Soft.Verify() would otherwise report green
        // even with recorded failures. Only run it if the test body itself didn't already fail.
        Exception? safetyNetError = null;
        if (TestContext.CurrentContext.Result.Outcome.Status != TestStatus.Failed)
        {
            try { Soft.Verify(); }
            catch (Exception ex) { safetyNetError = ex; }
        }

        var failed = TestContext.CurrentContext.Result.Outcome.Status == TestStatus.Failed || safetyNetError != null;

        if (failed)
            await CaptureFailureArtifactsAsync();
        else
            await _context.Tracing.StopAsync();

        await _context.CloseAsync();

        var categories = TestContext.CurrentContext.Test.Properties["Category"].Cast<string>().ToList();
        ResultsCollector.Record(TestContext.CurrentContext.Test.FullName, categories, !failed, _stopwatch.Elapsed.TotalSeconds);

        if (safetyNetError != null) throw safetyNetError;
    }

    /// <summary>
    /// Wraps a logical step (a group of actions/assertions) in an Allure step for report
    /// readability, and echoes it to the NUnit console output. Step descriptions should follow
    /// Given/When/Then phrasing.
    /// </summary>
    protected static async Task TestStep(string description, Func<Task> action)
    {
        TestContext.WriteLine($"  -> {description}");
        await AllureApi.Step(description, action);
    }

    /// <summary>Navigates to <paramref name="url"/> and records the page load time for the results dashboard.</summary>
    protected async Task<IResponse?> GotoAndTimeAsync(string url)
    {
        var sw = Stopwatch.StartNew();
        var response = await Page.GotoAsync(url, new PageGotoOptions { WaitUntil = WaitUntilState.DOMContentLoaded });
        sw.Stop();
        ResultsCollector.RecordApiTiming(response?.Url ?? url, response?.Status ?? 0, sw.ElapsedMilliseconds);
        return response;
    }

    private async Task CaptureFailureArtifactsAsync()
    {
        try
        {
            var testName = TestContext.CurrentContext.Test.Name;
            var invalid = Path.GetInvalidFileNameChars();
            var safeName = new string(testName.Where(c => !invalid.Contains(c)).ToArray());
            var dir = Path.Combine(TestContext.CurrentContext.WorkDirectory, "TestResults");
            Directory.CreateDirectory(dir);

            await Page.ScreenshotAsync(new PageScreenshotOptions { Path = Path.Combine(dir, $"{safeName}.png"), FullPage = true });
            await _context.Tracing.StopAsync(new TracingStopOptions { Path = Path.Combine(dir, $"{safeName}.trace.zip") });
        }
        catch (Exception ex)
        {
            TestContext.WriteLine($"  [WARN] Failed to capture failure artifacts: {ex.Message}");
        }
    }
}
