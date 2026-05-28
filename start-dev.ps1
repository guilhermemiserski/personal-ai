param(
    [string]$GroqApiKey = "",
    [string]$ApiHost = "127.0.0.1",
    [int]$ApiPort = 8000,
    [int]$WebPort = 3000
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$apiDir = Join-Path $root "apps\api"
$webDir = Join-Path $root "apps\web"

if (-not (Test-Path $apiDir)) {
    throw "Diretório da API não encontrado: $apiDir"
}
if (-not (Test-Path $webDir)) {
    throw "Diretório do Web não encontrado: $webDir"
}

$apiUrl = "http://${ApiHost}:${ApiPort}"

Write-Host "Iniciando API em $apiUrl ..."
if (-not [string]::IsNullOrWhiteSpace($GroqApiKey)) {
    Write-Host "GROQ_API_KEY fornecida (modo IA completa)."
} else {
    Write-Host "GROQ_API_KEY não fornecida (fallback local de plano)."
}

$apiCommand = @"
Set-Location '$apiDir'
if (Test-Path '.\.venv\Scripts\activate.ps1') {
    . .\.venv\Scripts\activate.ps1
}
if ('$GroqApiKey' -ne '') {
    `$env:GROQ_API_KEY = '$GroqApiKey'
}
uvicorn app.main:app --reload --host $ApiHost --port $ApiPort
"@

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command", $apiCommand
) | Out-Null

Write-Host "Iniciando Web em http://localhost:$WebPort ..."

$webCommand = @"
Set-Location '$webDir'
`$env:NEXT_PUBLIC_API_URL = '$apiUrl'
npm run dev -- --hostname=localhost --port=$WebPort
"@

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command", $webCommand
) | Out-Null

Write-Host ""
Write-Host "Pronto. Serviços iniciados em janelas separadas:"
Write-Host " - API: $apiUrl"
Write-Host " - WEB: http://localhost:$WebPort"
Write-Host ""
Write-Host "Uso:"
Write-Host "  .\start-dev.ps1"
Write-Host "  .\start-dev.ps1 -GroqApiKey 'gsk_...'"
