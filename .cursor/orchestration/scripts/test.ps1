# E2E — Playwright starts API + web (see playwright.config.ts webServer)
$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..\..")
$webDir = Join-Path $root "apps\web"

Push-Location $webDir
try {
    $env:CI = "true"
    npm run test:e2e
    Write-Host "E2E OK"
}
finally {
    Pop-Location
}
