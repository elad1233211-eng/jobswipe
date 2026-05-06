# Release procedure — Android Play Store

End-to-end steps to ship a signed Android Bundle (AAB) to Google Play.
Most of this is one-time setup; only the last few steps repeat per release.

---

## One-time setup

### 1. Create a keystore (KEEP FOREVER — losing it means you can never update the app on Play)

```powershell
# Pick a path OUTSIDE the repo and back it up to multiple safe places
keytool -genkey -v -keystore C:\path\to\jobswipe.keystore `
        -alias jobswipe -keyalg RSA -keysize 2048 -validity 10000
```

You'll be prompted for:
- Store password (remember it — same as below)
- Your name / organization (Israel)
- A key password (use the **same** password as the store for simplicity)

### 2. Configure signing in this repo

Copy the example file:
```powershell
cp android/keystore.properties.example android/keystore.properties
```

Edit `android/keystore.properties` with your real values:
```properties
storeFile=C:/path/to/jobswipe.keystore
storePassword=YOUR_PASSWORD
keyAlias=jobswipe
keyPassword=YOUR_PASSWORD
```

This file is **gitignored** — it never goes to GitHub.

### 3. Google Play Console signup

1. Go to https://play.google.com/console — pay $25 one-time
2. Create a new app: "JobSwipe"
3. Default language: Hebrew (יידיש/עברית)
4. App or game: App
5. Free or paid: Free

### 4. App listing setup

Use the values from `PLAY_STORE.md` to fill the listing.

---

## Per-release procedure

### 1. Bump version

In `android/app/build.gradle`:
```groovy
versionCode 2          // increment by 1 every release
versionName "1.0.1"    // semantic: patch / minor / major
```

### 2. Sync web → Android

```powershell
npx cap sync android
```

### 3. Build a signed release bundle

```powershell
cd android
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
.\gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

### 4. Test the release build locally (optional but recommended)

```powershell
# Build a release APK too (not just AAB)
.\gradlew assembleRelease
# Install on connected device or emulator
adb install -r app\build\outputs\apk\release\app-release.apk
```

### 5. Upload to Play Console

1. Open Play Console → JobSwipe → Production (or Internal testing for first ship)
2. Create new release
3. Upload `app-release.aab`
4. Add release notes (in Hebrew)
5. Save → Review release → Roll out to production

First submission goes through manual review (1-7 days).
Subsequent updates are usually approved within hours.

---

## Troubleshooting

### Build fails with "Hebrew path"
Already handled by `android.overridePathCheck=true` in `android/gradle.properties`.

### Build fails with "JAVA_HOME not set"
```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
```
(Or set permanently via System Environment Variables.)

### "App not installed" on device
- Did you uninstall the debug APK first? Release and debug APKs have different signatures and conflict.
- Run: `adb uninstall com.jobswipe.app` then install release.

### Lost keystore?
You cannot recover or replace a keystore without abandoning the app.
You'd have to publish under a new package name and ask users to re-install.
**Always back up the keystore + passwords to 2+ separate locations.**
