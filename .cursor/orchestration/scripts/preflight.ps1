# Preflight — check toolchain and deps
$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..\..")

Write-Host "Root: $root"

# Node
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) { throw "Node.js not found. Install Node 20+." }
Write-Host "Node: $nodeVersion"

# Python
$pyVersion = python --version 2>$null
if (-not $pyVersion) { throw "Python not found. Install Python 3.12+." }
Write-Host "Python: $pyVersion"

$webDir = Join-Path $root "apps\web"
$apiDir = Join-Path $root "apps\api"

if (-not (Test-Path (Join-Path $webDir "node_modules"))) {
    Write-Host "Installing web deps..."
    Push-Location $webDir; npm install; Pop-Location
}

$venvActivate = Join-Path $apiDir ".venv\Scripts\Activate.ps1"
if (Test-Path $venvActivate) {
    . $venvActivate
}

Write-Host "Preflight OK"
