using System.Text.RegularExpressions;
using Microsoft.Playwright;
using NUnit.Framework;

namespace OptumPlaywright.Support;

/// <summary>
/// Collects Playwright and NUnit assertion failures during a test and reports them all together
/// at the end instead of stopping at the first failure. Call <see cref="RecordAsync"/> to
/// capture individual assertions and <see cref="Verify"/> at the end of each test to throw
/// if any failures were recorded.
/// </summary>
public sealed class SoftAssertions
{
    private readonly List<Exception> _errors = new();

    /// <summary>
    /// Executes <paramref name="assertion"/> and records any exception it throws rather than
    /// re-throwing immediately. Logs a PASS or FAIL line to the NUnit test output.
    /// </summary>
    public async Task RecordAsync(Func<Task> assertion, string description = "")
    {
        try
        {
            await assertion();
            var label = string.IsNullOrEmpty(description) ? "Assertion" : description;
            TestContext.WriteLine($"  [PASS] {label}");
        }
        catch (Exception ex)
        {
            var label = string.IsNullOrEmpty(description) ? ex.Message : $"{description} -> {ex.Message}";
            TestContext.WriteLine($"  [FAIL] {label}");
            _errors.Add(ex);
        }
    }

    public Task ExpectVisibleAsync(ILocator locator) =>
        RecordAsync(() => Assertions.Expect(locator).ToBeVisibleAsync(), $"{locator} is visible");

    public Task ExpectHiddenAsync(ILocator locator) =>
        RecordAsync(() => Assertions.Expect(locator).ToBeHiddenAsync(), $"{locator} is hidden");

    public Task ExpectEnabledAsync(ILocator locator) =>
        RecordAsync(() => Assertions.Expect(locator).ToBeEnabledAsync(), $"{locator} is enabled");

    public Task ExpectEditableAsync(ILocator locator) =>
        RecordAsync(() => Assertions.Expect(locator).ToBeEditableAsync(), $"{locator} is editable");

    public Task ExpectDisabledAsync(ILocator locator) =>
        RecordAsync(() => Assertions.Expect(locator).ToBeDisabledAsync(), $"{locator} is disabled");

    public Task ExpectCheckedAsync(ILocator locator) =>
        RecordAsync(() => Assertions.Expect(locator).ToBeCheckedAsync(), $"{locator} is checked");

    public Task ExpectUncheckedAsync(ILocator locator) =>
        RecordAsync(() => Assertions.Expect(locator).ToBeCheckedAsync(new LocatorAssertionsToBeCheckedOptions { Checked = false }),
            $"{locator} is unchecked");

    public Task ExpectTextAsync(ILocator locator, string expected) =>
        RecordAsync(() => Assertions.Expect(locator).ToHaveTextAsync(expected), $"{locator} has text \"{expected}\"");

    public Task ExpectContainsTextAsync(ILocator locator, string expected, LocatorAssertionsToContainTextOptions? options = null) =>
        RecordAsync(() => Assertions.Expect(locator).ToContainTextAsync(expected, options),
            $"{locator} contains text \"{expected}\"");

    public Task ExpectContainsTextAsync(ILocator locator, Regex pattern) =>
        RecordAsync(() => Assertions.Expect(locator).ToContainTextAsync(pattern), $"{locator} contains text matching \"{pattern}\"");

    public Task ExpectHasAttributeAsync(ILocator locator, string name, Regex pattern) =>
        RecordAsync(() => Assertions.Expect(locator).ToHaveAttributeAsync(name, pattern),
            $"{locator} has attribute \"{name}\" matching \"{pattern}\"");

    public Task ExpectHasUrlAsync(IPage page, Regex pattern) =>
        RecordAsync(() => Assertions.Expect(page).ToHaveURLAsync(pattern), $"page URL matches \"{pattern}\"");

    public Task ExpectHasTitleAsync(IPage page, Regex pattern) =>
        RecordAsync(() => Assertions.Expect(page).ToHaveTitleAsync(pattern), $"page title matches \"{pattern}\"");

    public Task ExpectCountAsync(ILocator locator, int expected) =>
        RecordAsync(() => Assertions.Expect(locator).ToHaveCountAsync(expected), $"{locator} count equals {expected}");

    public Task ExpectEqualsAsync(int actual, int expected) =>
        RecordAsync(() =>
        {
            if (actual != expected)
                throw new AssertionException($"Expected {expected} but was {actual}.");
            return Task.CompletedTask;
        },
            $"count equals {expected} (actual: {actual})");

    /// <summary>
    /// Throws an <see cref="AggregateException"/> containing all recorded failures if any exist,
    /// then clears the failure list. Call this at the end of every test to surface collected failures.
    /// </summary>
    public void Verify()
    {
        var errors = _errors.ToList();
        _errors.Clear();
        if (errors.Count > 0)
            throw new AggregateException("One or more soft assertions failed.", errors);
    }

    public bool HasFailures => _errors.Count > 0;

    public IReadOnlyList<Exception> Failures => _errors.AsReadOnly();
}
