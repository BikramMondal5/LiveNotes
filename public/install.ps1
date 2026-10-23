# LiveNotes CLI Installer for Windows PowerShell
# Run via: irm https://livenotes.vercel.app/install.ps1 | iex

$ErrorActionPreference = "Stop"

$installDir = "$env:LOCALAPPDATA\LiveNotes"
if (-not (Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
}

$baseUrl = "https://livenotes.vercel.app"
$expectedHash = "09003d627ce6b802745b52bdebc31f257759c5c781a6102d87e96ecfb964008a"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "         LiveNotes Windows CLI Installer                " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$exePath = Join-Path $installDir "livenotes.exe"
$cmdPath = Join-Path $installDir "livenotes.cmd"

try {
    Write-Host "[LiveNotes] Downloading standalone CLI release..." -ForegroundColor Gray
    
    $localExe = Join-Path $PSScriptRoot "bin\livenotes.exe"
    if (-not (Test-Path $localExe)) {
        $localExe = Join-Path $PSScriptRoot "livenotes.exe"
    }

    if (Test-Path $localExe) {
        Copy-Item -Path $localExe -Destination $exePath -Force
    } else {
        Invoke-WebRequest -Uri "$baseUrl/bin/livenotes.exe" -OutFile $exePath -UseBasicParsing
    }

    Write-Host "[LiveNotes] Verifying package integrity (SHA-256)..." -ForegroundColor Gray
    $actualHash = (Get-FileHash -Path $exePath -Algorithm SHA256).Hash.ToLower()

    if ($actualHash -ne $expectedHash) {
        Remove-Item $exePath -Force -ErrorAction SilentlyContinue
        throw "Checksum verification failed! Expected: $expectedHash, Actual: $actualHash"
    }
    Write-Host "[LiveNotes] Checksum verified: $actualHash" -ForegroundColor Green

    $localCmd = Join-Path $PSScriptRoot "livenotes.cmd"
    if (Test-Path $localCmd) {
        Copy-Item -Path $localCmd -Destination $cmdPath -Force
    } else {
        Invoke-WebRequest -Uri "$baseUrl/livenotes.cmd" -OutFile $cmdPath -UseBasicParsing
    }

    # Add to User PATH if not already present
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($currentPath -notmatch [regex]::Escape($installDir)) {
        Write-Host "[LiveNotes] Adding $installDir to user PATH..." -ForegroundColor Gray
        $newPath = if ($currentPath) { "$currentPath;$installDir" } else { $installDir }
        [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    } else {
        Write-Host "[LiveNotes] Installation directory is already in user PATH." -ForegroundColor Gray
    }

    $env:PATH += ";$installDir"

    Write-Host ""
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host "  [OK] LiveNotes CLI installed successfully!            " -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host "  Installed location: $installDir" -ForegroundColor White
    Write-Host ""
    Write-Host "  You can now run from any directory:" -ForegroundColor White
    Write-Host "    livenotes --help" -ForegroundColor Yellow
    Write-Host "    livenotes -r <room_name>" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Example:" -ForegroundColor Gray
    Write-Host "    livenotes -r 291026" -ForegroundColor Cyan
    Write-Host "========================================================" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Error "[LiveNotes] Installation failed: $_"
}
