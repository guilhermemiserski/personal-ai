$ErrorActionPreference = "Stop"
$apiDir = Resolve-Path (Join-Path $PSScriptRoot "..\..\api")
Set-Location $apiDir

if (Test-Path ".venv\Scripts\Activate.ps1") {
    . ".venv\Scripts\Activate.ps1"
}

$env:DATABASE_URL = "sqlite+aiosqlite:///./personal_ai_e2e.db"
$env:JWT_SECRET = "e2e-test-secret"
$env:CORS_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000"

Write-Host "Starting API for e2e on http://127.0.0.1:8000 ..."
uvicorn app.main:app --host 127.0.0.1 --port 8000
