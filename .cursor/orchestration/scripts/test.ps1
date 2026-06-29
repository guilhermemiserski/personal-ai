# E2E smoke (optional — requires API + web running)
$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..\..")
$webDir = Join-Path $root "apps\web"

$apiUrl = $env:NEXT_PUBLIC_API_URL
if (-not $apiUrl) { $apiUrl = "http://localhost:8000" }

try {
    $health = Invoke-RestMethod -Uri "$apiUrl/health" -TimeoutSec 5
    Write-Host "API health: $($health | ConvertTo-Json -Compress)"
} catch {
    Write-Warning "API not reachable at $apiUrl — skipping e2e. Start with .\start-dev.ps1"
    exit 0
}

Push-Location $webDir
try {
    $env:NEXT_PUBLIC_API_URL = $apiUrl
    npm run test:e2e
    Write-Host "E2E OK"
}
finally {
    Pop-Location
}
