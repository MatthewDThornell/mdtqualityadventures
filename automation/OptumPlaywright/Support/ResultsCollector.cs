using System.Globalization;

namespace OptumPlaywright.Support;

/// <summary>
/// Thread-safe static store that collects test results across the entire parallel run.
/// <see cref="TestBase"/> TearDown records each result via <see cref="Record"/>;
/// <c>AssemblySetup.OneTimeTearDown</c> calls <see cref="WriteDashboard"/> to emit the
/// markdown results dashboard.
/// </summary>
public static class ResultsCollector
{
    private sealed record TestResult(
        string TestName,
        IReadOnlyList<string> Categories,
        bool Passed,
        double ElapsedSeconds);

    private sealed record ApiTimingRecord(string Host, string Endpoint, int StatusCode, long DurationMs);

    private static readonly (string Category, string Label)[] ModuleDefinitions =
    {
        ("home",              "🏠 Home"),
        ("navigation",        "🧭 Navigation"),
        ("customer-service",  "🎧 Customer Service"),
        ("about-us",          "🏢 About Us"),
        ("integration",       "🔗 Integration"),
        ("e2e",               "🚀 End-to-End"),
    };

    private static readonly List<TestResult> Results = new();
    private static readonly List<ApiTimingRecord> ApiTimings = new();
    private static readonly object Lock = new();
    private static DateTime? _suiteStartedAt;

    private static readonly string[] KnownThirdPartyDomains =
        ["googletagmanager.com", "google-analytics.com", "doubleclick.net", "adobedtm.com", "hotjar.com"];

    /// <summary>
    /// Records the outcome of a single test. Thread-safe — may be called concurrently
    /// from multiple parallel test workers.
    /// </summary>
    public static void Record(string testName, IEnumerable<string> categories, bool passed, double elapsedSeconds)
    {
        lock (Lock)
        {
            _suiteStartedAt ??= DateTime.UtcNow;
            Results.Add(new TestResult(testName, categories.ToList(), passed, elapsedSeconds));
        }
    }

    /// <summary>
    /// Records the timing of a single network response. Thread-safe — called from Playwright's
    /// response event handler which may fire on background threads.
    /// </summary>
    public static void RecordApiTiming(string url, int statusCode, long durationMs)
    {
        lock (Lock)
        {
            var (host, endpoint) = ParseUrl(url);
            ApiTimings.Add(new ApiTimingRecord(host, endpoint, statusCode, durationMs));
        }
    }

    /// <summary>
    /// Writes the aggregated test results to <c>Test_Case_Dashboards_and_Results/test-results-dashboard.md</c>.
    /// Does nothing if no results have been recorded.
    /// </summary>
    public static void WriteDashboard(AppConfig config)
    {
        List<TestResult> snapshot;
        List<ApiTimingRecord> apiSnapshot;
        lock (Lock)
        {
            snapshot = Results.ToList();
            apiSnapshot = ApiTimings.ToList();
        }

        if (snapshot.Count == 0) return;

        var projectRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", ".."));
        var path = Path.Combine(projectRoot, "Test_Case_Dashboards_and_Results", "test-results-dashboard.md");
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);

        var passed = snapshot.Count(r => r.Passed);
        var failed = snapshot.Count(r => !r.Passed);
        var total = snapshot.Count;
        var passRate = total > 0 ? (int)Math.Round((double)passed / total * 100) : 0;

        var nowUtc = DateTime.UtcNow;

        TimeSpan suiteDuration;
        lock (Lock)
        {
            suiteDuration = _suiteStartedAt.HasValue ? nowUtc - _suiteStartedAt.Value : TimeSpan.Zero;
        }
        var durationLabel = suiteDuration.TotalHours >= 1
            ? $"{(int)suiteDuration.TotalHours}h {suiteDuration.Minutes}m {suiteDuration.Seconds}s"
            : suiteDuration.TotalMinutes >= 1
                ? $"{(int)suiteDuration.TotalMinutes}m {suiteDuration.Seconds}s"
                : $"{suiteDuration.Seconds}s";

        var healthBanner = passRate >= 95
            ? "🟢 All Systems Green 🟢"
            : passRate >= 80
                ? "🟡 Degraded — some tests failing 🟡"
                : "🔴 Critical — significant test failures 🔴";

        using var writer = new StreamWriter(path, false);

        writer.WriteLine("# Optum Playwright — Test Results Dashboard");
        writer.WriteLine();
        writer.WriteLine($"## {healthBanner}");
        writer.WriteLine();
        writer.WriteLine($"> **Last Updated:** {nowUtc:yyyy-MM-dd HH:mm} UTC");
        writer.WriteLine($"> **Suite Duration:** {durationLabel}");
        writer.WriteLine($"> **Target:** `{config.BaseUrl}`");
        writer.WriteLine($"> **Run By:** `{Environment.UserName}`");
        writer.WriteLine();
        writer.WriteLine("---");
        writer.WriteLine();

        writer.WriteLine("## Overall Summary");
        writer.WriteLine();
        writer.WriteLine("| Metric | Count |");
        writer.WriteLine("|---|---|");
        writer.WriteLine($"| ✅ Passed | **{passed}** |");
        writer.WriteLine($"| ❌ Failed | **{failed}** |");
        writer.WriteLine($"| **Total** | **{total}** |");
        writer.WriteLine();
        writer.WriteLine("### Pass Rate");
        writer.WriteLine();
        writer.WriteLine("```");
        writer.WriteLine($"All Tests   {BuildBar(passRate)}  {passRate}%   {passed}/{total}");
        writer.WriteLine("```");
        writer.WriteLine();
        writer.WriteLine("---");
        writer.WriteLine();

        // Defect guard status
        var defectGuards = snapshot
            .Where(r => r.Categories.Any(c => c.Equals("bug-regression", StringComparison.OrdinalIgnoreCase)))
            .OrderBy(r => r.TestName)
            .ToList();

        writer.WriteLine("## 🛡️ Defect Guard Status 🛡️");
        writer.WriteLine();

        if (defectGuards.Count == 0)
        {
            writer.WriteLine("> No defect guard tests registered yet.");
            writer.WriteLine("> Tag a test with `[Category(\"bug-regression\")]` to monitor a previously reported bug.");
        }
        else
        {
            var guardsPassed = defectGuards.Count(r => r.Passed);
            var guardsFailed = defectGuards.Count(r => !r.Passed);
            var guardsTotal = defectGuards.Count;

            writer.WriteLine(guardsFailed == 0
                ? $"✅ **No previously reported bugs reintroduced** — {guardsPassed}/{guardsTotal} defect guard{(guardsTotal == 1 ? "" : "s")} passing."
                : $"❌ **{guardsFailed} regression{(guardsFailed == 1 ? "" : "s")} detected** — a previously resolved bug may have been reintroduced.");

            writer.WriteLine();
            WriteAlignedTable(writer,
                ["Test", "Result", "Duration"],
                defectGuards.Select(r => new[] { $"`{r.TestName}`", r.Passed ? "✅ Pass" : "❌ Fail", $"{r.ElapsedSeconds:F1}s" }).ToList());
        }

        writer.WriteLine();
        writer.WriteLine("---");
        writer.WriteLine();

        // Slow tests
        const double SlowTestThresholdSeconds = 10.0;
        var slowTests = snapshot
            .Where(r => r.ElapsedSeconds > SlowTestThresholdSeconds)
            .OrderByDescending(r => r.ElapsedSeconds)
            .ToList();

        writer.WriteLine("## ⚠️ Performance — Slow Tests ⚠️");
        writer.WriteLine();
        if (slowTests.Count == 0)
        {
            writer.WriteLine($"✅ No tests exceeded the {SlowTestThresholdSeconds:F0}s threshold.");
        }
        else
        {
            writer.WriteLine($"> Tests exceeding {SlowTestThresholdSeconds:F0}s may indicate a slow page load or a wait-strategy problem.");
            writer.WriteLine();
            WriteAlignedTable(writer,
                ["Test", "Duration", "Module"],
                slowTests.Select(r =>
                {
                    var match = ModuleDefinitions.FirstOrDefault(m => r.Categories.Any(c => c.Equals(m.Category, StringComparison.OrdinalIgnoreCase)));
                    return new[] { $"`{r.TestName}`", $"{r.ElapsedSeconds:F1}s", match != default ? match.Label : "—" };
                }).ToList());
        }
        writer.WriteLine();
        writer.WriteLine("---");
        writer.WriteLine();

        // Network response times
        const long SlowRequestThresholdMs = 2000L;
        var internalCalls = new List<ApiTimingRecord>();
        var thirdPartyCalls = new List<ApiTimingRecord>();
        foreach (var t in apiSnapshot)
        {
            if (KnownThirdPartyDomains.Any(d => t.Host.Contains(d, StringComparison.OrdinalIgnoreCase)))
                thirdPartyCalls.Add(t);
            else
                internalCalls.Add(t);
        }

        var pageStats = internalCalls
            .GroupBy(t => t.Endpoint)
            .Select(g => (Endpoint: g.Key, Count: g.Count(), AvgMs: (long)g.Average(t => t.DurationMs), MaxMs: g.Max(t => t.DurationMs), HasErrors: g.Any(t => t.StatusCode >= 400)))
            .OrderByDescending(s => s.MaxMs)
            .ToList();

        var thirdPartyStats = thirdPartyCalls
            .GroupBy(t => t.Host)
            .Select(g => (Service: g.Key, Count: g.Count(), AvgMs: (long)g.Average(t => t.DurationMs), MaxMs: g.Max(t => t.DurationMs), HasErrors: g.Any(t => t.StatusCode >= 400)))
            .OrderBy(s => s.Service)
            .ToList();

        writer.WriteLine("## ⚡ Page Response Times ⚡");
        writer.WriteLine();

        if (pageStats.Count == 0)
        {
            writer.WriteLine("> No page navigations were recorded during this run.");
        }
        else
        {
            var hasSlow = pageStats.Any(s => s.MaxMs >= SlowRequestThresholdMs);
            writer.WriteLine(hasSlow
                ? $"⚠️ Some page loads exceeded the {SlowRequestThresholdMs}ms threshold."
                : $"✅ All page loads responded within {SlowRequestThresholdMs}ms.");
            writer.WriteLine();
            WriteAlignedTable(writer,
                ["Page", "Loads", "Avg", "Max", "Status"],
                pageStats.Select(s => new[]
                {
                    $"`{s.Endpoint}`", s.Count.ToString(), $"{s.AvgMs}ms", $"{s.MaxMs}ms",
                    s.HasErrors ? "⚠️ Errors" : s.MaxMs >= SlowRequestThresholdMs ? "⚠️ Slow" : "✅"
                }).ToList());
        }

        if (thirdPartyStats.Count > 0)
        {
            writer.WriteLine();
            writer.WriteLine("### Third-Party Scripts");
            writer.WriteLine();
            WriteAlignedTable(writer,
                ["Service", "Calls", "Avg", "Max", "Status"],
                thirdPartyStats.Select(s => new[]
                {
                    s.Service, s.Count.ToString(), $"{s.AvgMs}ms", $"{s.MaxMs}ms",
                    s.HasErrors ? "⚠️ Errors" : s.MaxMs >= SlowRequestThresholdMs ? "⚠️ Slow" : "✅"
                }).ToList());
        }

        writer.WriteLine();
        writer.WriteLine("---");
        writer.WriteLine();

        // Failed tests
        if (failed > 0)
        {
            writer.WriteLine("## ❌ Failed Tests ❌");
            writer.WriteLine();
            foreach (var (category, label) in ModuleDefinitions)
            {
                var moduleFailures = snapshot
                    .Where(r => !r.Passed && r.Categories.Any(c => c.Equals(category, StringComparison.OrdinalIgnoreCase)))
                    .OrderBy(r => r.TestName)
                    .ToList();
                if (moduleFailures.Count == 0) continue;

                writer.WriteLine($"### {label}");
                writer.WriteLine();
                WriteAlignedTable(writer,
                    ["Test", "Result", "Duration"],
                    moduleFailures.Select(r => new[] { $"`{r.TestName}`", "❌ Fail", $"{r.ElapsedSeconds:F1}s" }).ToList());
                writer.WriteLine();
            }
            writer.WriteLine("---");
            writer.WriteLine();
        }

        // Per-module breakdown
        writer.WriteLine("## Results by Module");
        writer.WriteLine();

        var summaryRows = new List<(string Label, int P, int F, int T, int Rate)>();

        foreach (var (category, label) in ModuleDefinitions)
        {
            var moduleTests = snapshot.Where(r => r.Categories.Any(c => c.Equals(category, StringComparison.OrdinalIgnoreCase))).ToList();
            if (moduleTests.Count == 0) continue;

            var mp = moduleTests.Count(r => r.Passed);
            var mf = moduleTests.Count(r => !r.Passed);
            var mt = moduleTests.Count;
            var mr = mt > 0 ? (int)Math.Round((double)mp / mt * 100) : 0;

            writer.WriteLine($"### {label}  `{mt} test{(mt == 1 ? "" : "s")}`");
            writer.WriteLine();
            writer.WriteLine($"**Pass Rate: {mr}%** — {mp}/{mt}");
            writer.WriteLine();
            WriteAlignedTable(writer,
                ["Test", "Result", "Duration"],
                moduleTests.OrderBy(r => r.TestName).Select(r => new[] { $"`{r.TestName}`", r.Passed ? "✅ Pass" : "❌ Fail", $"{r.ElapsedSeconds:F1}s" }).ToList());
            writer.WriteLine();
            writer.WriteLine("---");
            writer.WriteLine();

            summaryRows.Add((label, mp, mf, mt, mr));
        }

        writer.WriteLine("## Full Coverage Breakdown");
        writer.WriteLine();
        writer.WriteLine("| Health | Module | Tests | ✅ Pass | ❌ Fail | Pass Rate |");
        writer.WriteLine("|---|---|---|---|---|---|");
        foreach (var (label, mp, mf, mt, mr) in summaryRows)
        {
            var health = mr >= 95 ? "🟢" : mr >= 80 ? "🟡" : "🔴";
            writer.WriteLine($"| {health} | {label} | {mt} | {mp} | {mf} | {mr}% |");
        }
        var overallHealth = passRate >= 95 ? "🟢" : passRate >= 80 ? "🟡" : "🔴";
        writer.WriteLine($"| {overallHealth} | **Total** | **{total}** | **{passed}** | **{failed}** | **{passRate}%** |");
        writer.WriteLine();
        writer.WriteLine("---");
        writer.WriteLine();
        writer.WriteLine("## Status Key");
        writer.WriteLine();
        writer.WriteLine("| Status | Meaning |");
        writer.WriteLine("|---|---|");
        writer.WriteLine("| ✅ Pass | Test executed and all assertions passed |");
        writer.WriteLine("| ❌ Fail | Test executed and one or more assertions failed |");
        writer.WriteLine("| 🟢 | Module pass rate ≥ 95% |");
        writer.WriteLine("| 🟡 | Module pass rate 80-94% |");
        writer.WriteLine("| 🔴 | Module pass rate < 80% |");
        writer.WriteLine("| 🛡️ | Defect guard — written to confirm a previously reported bug stays fixed |");
        writer.WriteLine();
        writer.WriteLine("---");
        writer.WriteLine();
        writer.WriteLine("*This file is auto-generated after every test run. Do not edit manually.*");
    }

    private static string BuildBar(int percent)
    {
        var filled = (int)Math.Round(percent / 5.0);
        var empty = 20 - filled;
        return new string('█', Math.Max(0, filled)) + new string('░', Math.Max(0, empty));
    }

    private static (string Host, string Endpoint) ParseUrl(string url)
    {
        try
        {
            var uri = new Uri(url);
            var host = uri.Host.ToLowerInvariant();
            var path = string.IsNullOrEmpty(uri.AbsolutePath) || uri.AbsolutePath == "/" ? "/ (home)" : uri.AbsolutePath;
            return (host, path);
        }
        catch (UriFormatException) { return ("unknown", url); }
    }

    private static void WriteAlignedTable(StreamWriter writer, string[] headers, IList<string[]> rows)
    {
        var widths = headers.Select((h, i) => Math.Max(VisualWidth(h), rows.Count > 0 ? rows.Max(r => VisualWidth(r[i])) : 0)).ToArray();
        writer.WriteLine("| " + string.Join(" | ", headers.Select((h, i) => PadRightVisual(h, widths[i]))) + " |");
        writer.WriteLine("|" + string.Join("|", widths.Select(w => new string('-', w + 2))) + "|");
        foreach (var row in rows)
            writer.WriteLine("| " + string.Join(" | ", row.Select((cell, i) => PadRightVisual(cell, widths[i]))) + " |");
    }

    private static int VisualWidth(string s)
    {
        var width = 0;
        var e = StringInfo.GetTextElementEnumerator(s);
        while (e.MoveNext())
        {
            var element = (string)e.Current;
            width += element.EnumerateRunes().Any(r => r.Value > 0x2000) ? 2 : element.Length;
        }
        return width;
    }

    private static string PadRightVisual(string s, int targetWidth)
    {
        var deficit = targetWidth - VisualWidth(s);
        return deficit > 0 ? s + new string(' ', deficit) : s;
    }
}
