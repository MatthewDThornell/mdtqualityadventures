<#
.SYNOPSIS
    Runs the OptumPlaywright suite with colorized pass/fail output.

.EXAMPLE
    ./run-tests.ps1
    ./run-tests.ps1 -Category regression
    ./run-tests.ps1 -Category home -Settings headed-local.runsettings
#>
param(
    [string]$Category = "smoke",
    [string]$Settings = "local.runsettings"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$settingsPath = Join-Path $projectRoot "Settings/$Settings"

if (-not (Test-Path $settingsPath)) {
    Write-Host "Settings file not found: $settingsPath" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Optum Playwright - running category '$Category' with $Settings" -ForegroundColor Cyan
Write-Host ""

Push-Location $projectRoot
try {
    & dotnet test --filter "Category=$Category" --settings $settingsPath --logger "console;verbosity=normal"
    $exitCode = $LASTEXITCODE
}
finally {
    Pop-Location
}

Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "PASSED - see Test_Case_Dashboards_and_Results/test-results-dashboard.md for the full breakdown." -ForegroundColor Green
}
else {
    Write-Host "FAILED - see the output above, or the results dashboard, for details." -ForegroundColor Red
}

exit $exitCode
