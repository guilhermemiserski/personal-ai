# Build web (Next.js)
$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..\..\..")
$webDir = Join-Path $root "apps\web"

Push-Location $webDir
try {
    npm run build
    Write-Host "Web build OK"
}
finally {
    Pop-Location
}
