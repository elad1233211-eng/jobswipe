# JobSwipe — Android keystore setup script
#
# Run once before your first release build.
# Generates:
#   - $env:USERPROFILE\jobswipe-keystore\jobswipe.keystore   (KEEP FOREVER + back up!)
#   - android/keystore.properties (gitignored)
#
# Usage:  pwsh setup-keystore.ps1

$ErrorActionPreference = "Stop"

# Resolve JAVA_HOME from Android Studio's bundled JBR if not already set.
if (-not $env:JAVA_HOME -or -not (Test-Path "$env:JAVA_HOME\bin\keytool.exe")) {
    $candidates = @(
        "C:\Program Files\Android\Android Studio\jbr",
        "C:\Program Files\Android\Android Studio\jre",
        "$env:LOCALAPPDATA\Programs\Android Studio\jbr"
    )
    foreach ($c in $candidates) {
        if (Test-Path "$c\bin\keytool.exe") { $env:JAVA_HOME = $c; break }
    }
    if (-not $env:JAVA_HOME) {
        Write-Error "Could not find JAVA_HOME. Install Android Studio or set JAVA_HOME manually."
        exit 1
    }
}
$keytool = "$env:JAVA_HOME\bin\keytool.exe"

# Where the keystore lives — outside the repo, in a stable per-user location.
$keystoreDir = Join-Path $env:USERPROFILE "jobswipe-keystore"
$keystoreFile = Join-Path $keystoreDir "jobswipe.keystore"

if (Test-Path $keystoreFile) {
    Write-Host ""
    Write-Host "  WARNING: keystore already exists at:" -ForegroundColor Yellow
    Write-Host "  $keystoreFile" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Generating a NEW keystore would orphan your existing Play Store app." -ForegroundColor Red
    Write-Host "  If you really need to start over, delete the file manually first." -ForegroundColor Red
    exit 1
}

New-Item -ItemType Directory -Force -Path $keystoreDir | Out-Null

Write-Host ""
Write-Host "JobSwipe Android keystore setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "About to create a NEW keystore at:" -ForegroundColor White
Write-Host "  $keystoreFile" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: This file + its password are the ONLY way to update" -ForegroundColor Yellow
Write-Host "your app on Google Play once published. If you lose either, you" -ForegroundColor Yellow
Write-Host "cannot publish updates — you'd have to ship under a new package" -ForegroundColor Yellow
Write-Host "name and ask all users to reinstall." -ForegroundColor Yellow
Write-Host ""
Write-Host "Recommended: after this script completes, BACK UP the keystore file" -ForegroundColor Yellow
Write-Host "to a separate location (cloud drive, USB stick, password manager)." -ForegroundColor Yellow
Write-Host ""

$pass = Read-Host -AsSecureString -Prompt "Choose a password (8+ chars, save it in your password manager)"
$passConfirm = Read-Host -AsSecureString -Prompt "Confirm password"

# Convert SecureString → plaintext for keytool (keytool cannot accept SecureString).
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($pass)
$plainPass = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR) | Out-Null
$BSTR2 = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($passConfirm)
$plainPass2 = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR2)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR2) | Out-Null

if ($plainPass -ne $plainPass2) {
    Write-Error "Passwords do not match. Aborting."
    exit 1
}
if ($plainPass.Length -lt 8) {
    Write-Error "Password too short (minimum 8 chars). Aborting."
    exit 1
}

Write-Host ""
Write-Host "Generating keystore..." -ForegroundColor Cyan

$dname = "CN=JobSwipe, OU=JobSwipe, O=JobSwipe, L=Tel Aviv, ST=Tel Aviv, C=IL"

& $keytool -genkeypair -v `
    -keystore $keystoreFile `
    -alias jobswipe `
    -keyalg RSA -keysize 2048 -validity 10000 `
    -storepass $plainPass -keypass $plainPass `
    -dname $dname

if ($LASTEXITCODE -ne 0) {
    Write-Error "keytool failed (exit $LASTEXITCODE). Aborting."
    exit 1
}

# Write keystore.properties so gradle can find the keystore at build time.
$propsFile = Join-Path $PSScriptRoot "android\keystore.properties"
$propsContent = @"
storeFile=$($keystoreFile.Replace('\','/'))
storePassword=$plainPass
keyAlias=jobswipe
keyPassword=$plainPass
"@
Set-Content -Path $propsFile -Value $propsContent -Encoding utf8

Write-Host ""
Write-Host "Done." -ForegroundColor Green
Write-Host ""
Write-Host "Keystore:    $keystoreFile" -ForegroundColor Green
Write-Host "Properties:  $propsFile" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "  1. BACK UP the keystore file to a separate location (cloud + offline)." -ForegroundColor White
Write-Host "  2. Save the password to your password manager." -ForegroundColor White
Write-Host "  3. Build the signed AAB:  npm run android:release" -ForegroundColor White
Write-Host ""
