using NUnit.Framework;

namespace OptumPlaywright.Support;

/// <summary>
/// Runtime configuration sourced from NUnit <c>TestRunParameters</c> in the active .runsettings
/// file (falls back to a process environment variable of the same name, then to a default).
/// Falls back to public optum.com defaults so the suite runs out of the box with no setup —
/// there are no secrets to configure since every test targets the public site.
///
/// Deliberately NOT read from &lt;EnvironmentVariables&gt; in .runsettings: that section is not
/// reliably forwarded to the testhost process under `dotnet test` with this adapter (verified —
/// it silently comes back null, which made every "headed" run launch headless). TestRunParameters
/// is NUnit's own supported mechanism and works consistently.
/// </summary>
public sealed class AppConfig
{
    public string BaseUrl { get; }
    public bool Headless { get; }
    public int DefaultTimeoutMs { get; }
    public int NavigationTimeoutMs { get; }
    public int ViewportWidth { get; }
    public int ViewportHeight { get; }

    public AppConfig()
    {
        BaseUrl = GetParam("BASE_URL", "https://www.optum.com/en/");
        Headless = !string.Equals(GetParam("HEADLESS", "true"), "false", StringComparison.OrdinalIgnoreCase);
        DefaultTimeoutMs = 15000;
        NavigationTimeoutMs = 30000;
        ViewportWidth = 1440;
        ViewportHeight = 900;
    }

    private static string GetParam(string name, string defaultValue)
    {
        if (TestContext.Parameters.Exists(name))
            return TestContext.Parameters[name]!;

        return Environment.GetEnvironmentVariable(name) ?? defaultValue;
    }
}
