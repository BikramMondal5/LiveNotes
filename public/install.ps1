# LiveNotes CLI Instant 1-Second Installer for Windows
# Run via: irm https://livenotes.vercel.app/install.ps1 | iex

$ErrorActionPreference = "Stop"

$appDataPath = "$env:LOCALAPPDATA\Microsoft\WindowsApps"
$destFile = Join-Path $appDataPath "livenotes.cmd"
$sourceUrl = "https://livenotes.vercel.app/livenotes.cmd"

# Local fallback if run from repository
$localScript = Join-Path $PSScriptRoot "livenotes.cmd"

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "       LiveNotes CLI Installer         " -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

try {
    if (Test-Path $localScript) {
        Copy-Item -Path $localScript -Destination $destFile -Force
    } else {
        Invoke-WebRequest -Uri $sourceUrl -OutFile $destFile -UseBasicParsing
    }

    Write-Host "[OK] LiveNotes CLI installed successfully!" -ForegroundColor Green
    Write-Host "[OK] Installed to: $destFile" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "You can now run directly from any CMD or PowerShell:" -ForegroundColor White
    Write-Host "  livenotes -r <room_name>" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Example:" -ForegroundColor DarkGray
    Write-Host "  livenotes -r 291026" -ForegroundColor Cyan
    Write-Host ""
} catch {
    Write-Error "Installation failed: $_"
}

