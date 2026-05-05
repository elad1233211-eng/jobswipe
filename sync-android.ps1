#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Syncs the Capacitor Android project to C:\android-jobswipe (ASCII-safe path).

.DESCRIPTION
    Android Gradle Plugin rejects paths with non-ASCII characters. The project lives at
    a Hebrew path, so we maintain a clean copy at C:\android-jobswipe.

    This script:
      1. Optionally runs 'npx cap sync android' to regenerate the android folder.
      2. Mirrors C:\android-jobswipe from .\android using robocopy (fast, incremental).
      3. Preserves local.properties and the Gradle cache (.gradle) in the destination.

.PARAMETER LocalDev
    When specified, sets LOCAL_DEV=true before 'cap sync', pointing the WebView
    at http://10.0.2.2:3000 (emulator -> host localhost) instead of Railway.

.PARAMETER SkipSync
    Skip 'npx cap sync android' and only mirror the folder. Useful when you only
    changed native Android files directly.

.EXAMPLE
    # Production build (Railway URL):
    .\sync-android.ps1

.EXAMPLE
    # Local dev build (emulator -> localhost:3000):
    .\sync-android.ps1 -LocalDev

.EXAMPLE
    # Only mirror, skip cap sync:
    .\sync-android.ps1 -SkipSync
#>

param(
    [switch]$LocalDev,
    [switch]$SkipSync
)

$ErrorActionPreference = "Stop"

$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$AndroidSrc = Join-Path $ScriptDir "android"
$AndroidDst = "C:\android-jobswipe"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  JobSwipe Android Sync Script" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# --- Step 1: cap sync ---
if (-not $SkipSync) {
    if ($LocalDev) {
        Write-Host "[1/2] Running: npx cap sync android  (LOCAL_DEV mode)" -ForegroundColor Yellow
        $env:LOCAL_DEV = "true"
    } else {
        Write-Host "[1/2] Running: npx cap sync android  (Railway/production mode)" -ForegroundColor Yellow
        $env:LOCAL_DEV = $null
    }

    Push-Location $ScriptDir
    try {
        & npx cap sync android
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERROR: 'npx cap sync android' failed (exit $LASTEXITCODE)." -ForegroundColor Red
            exit $LASTEXITCODE
        }
    } finally {
        Pop-Location
        $env:LOCAL_DEV = $null
    }
    Write-Host ""
} else {
    Write-Host "[1/2] Skipping 'npx cap sync android' (-SkipSync flag)." -ForegroundColor DarkGray
}

# --- Step 2: robocopy mirror ---
Write-Host "[2/2] Mirroring android folder to $AndroidDst ..." -ForegroundColor Yellow
Write-Host "      Source: $AndroidSrc"
Write-Host "      Dest  : $AndroidDst"
Write-Host ""

# Save local.properties from destination (machine-specific, must not be overwritten)
$localPropsBackup = $null
$localPropsDst    = Join-Path $AndroidDst "local.properties"
if (Test-Path $localPropsDst) {
    $localPropsBackup = Get-Content $localPropsDst -Raw
}

# robocopy flags:
#   /MIR  - mirror (adds new, removes deleted, updates changed)
#   /XD   - exclude directories: .gradle (Gradle daemon cache), .idea (IDE config)
#   /XF   - exclude files: local.properties (machine-specific)
#   /NFL  - no file list (cleaner output)
#   /NDL  - no dir list
#   /NP   - no progress percentage
#   /MT:4 - 4 threads
robocopy $AndroidSrc $AndroidDst /MIR /XD ".gradle" ".idea" /XF "local.properties" /NFL /NDL /NP /MT:4

# robocopy exit codes: 0-7 are success/warnings, 8+ are errors
if ($LASTEXITCODE -ge 8) {
    Write-Host "ERROR: robocopy failed (exit $LASTEXITCODE)." -ForegroundColor Red
    exit $LASTEXITCODE
}

# Restore local.properties if it existed, otherwise write a default
if ($localPropsBackup) {
    Set-Content -Path $localPropsDst -Value $localPropsBackup -NoNewline
    Write-Host "Restored local.properties (sdk.dir preserved)." -ForegroundColor DarkGray
} else {
    # Write a default local.properties pointing to the standard SDK location
    $sdkPath = "C\:\\Users\\money\\AppData\\Local\\Android\\Sdk"
    Set-Content -Path $localPropsDst -Value "sdk.dir=$sdkPath`n"
    Write-Host "Created local.properties with default sdk.dir." -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "Done! Android project is ready at: $AndroidDst" -ForegroundColor Green
Write-Host ""

if ($LocalDev) {
    Write-Host "LOCAL DEV mode:" -ForegroundColor Magenta
    Write-Host "  - WebView points to: http://10.0.2.2:3000" -ForegroundColor Magenta
    Write-Host "  - Make sure 'npm run dev' is running in a separate terminal." -ForegroundColor Magenta
    Write-Host "  - Start the emulator in Android Studio and run the app." -ForegroundColor Magenta
} else {
    Write-Host "PRODUCTION mode:" -ForegroundColor Green
    Write-Host "  - WebView points to: https://jobswipe.up.railway.app" -ForegroundColor Green
    Write-Host "  - Open C:\android-jobswipe in Android Studio and build the APK." -ForegroundColor Green
}
Write-Host ""
