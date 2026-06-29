# Lint web
$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..\..")
$webDir = Join-Path $root "apps\web"

Push-Location $webDir
try {
    npm run lint
    Write-Host "Lint OK"
}
finally {
    Pop-Location
}
