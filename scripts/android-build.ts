/**
 * Cross-platform wrapper for the Android Gradle build.
 *
 * Usage:
 *   tsx scripts/android-build.ts assembleDebug
 *   tsx scripts/android-build.ts bundleRelease
 *
 * - Auto-resolves JAVA_HOME from Android Studio's bundled JBR if missing.
 * - Runs gradle from android/ regardless of the caller's cwd.
 * - For bundleRelease, refuses to start if android/keystore.properties is missing.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

const task = process.argv[2];
if (!task) {
  console.error("Usage: tsx scripts/android-build.ts <gradle-task>");
  process.exit(2);
}

const ROOT = process.cwd();
const ANDROID = path.join(ROOT, "android");

if (task === "bundleRelease") {
  const props = path.join(ANDROID, "keystore.properties");
  if (!fs.existsSync(props)) {
    console.error("keystore.properties is missing — you need to sign release builds.");
    console.error("Run:  pwsh setup-keystore.ps1");
    process.exit(1);
  }
}

if (!process.env.JAVA_HOME) {
  const candidates = [
    "C:\\Program Files\\Android\\Android Studio\\jbr",
    "C:\\Program Files\\Android\\Android Studio\\jre",
    path.join(os.homedir(), "AppData", "Local", "Programs", "Android Studio", "jbr"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, "bin", "java.exe")) || fs.existsSync(path.join(c, "bin", "java"))) {
      process.env.JAVA_HOME = c;
      break;
    }
  }
}
if (!process.env.JAVA_HOME) {
  console.error("JAVA_HOME not set and Android Studio's bundled JBR not found.");
  console.error("Install Android Studio or set JAVA_HOME to a JDK 17+ installation.");
  process.exit(1);
}

// Windows: cmd.exe corrupts non-ASCII paths in args, so we cannot pass the
// gradlew path through a shell. Instead we cd via cwd and invoke gradlew
// without a shell using an absolute path — that requires no path lookup.
const isWin = process.platform === "win32";
const gradlewName = isWin ? "gradlew.bat" : "gradlew";
const gradlew = path.join(ANDROID, gradlewName);
const args = [task, "--no-daemon"];

console.log(`[android-build] JAVA_HOME=${process.env.JAVA_HOME}`);
console.log(`[android-build] cwd=${ANDROID}`);
console.log(`[android-build] running: ${gradlewName} ${args.join(" ")}\n`);

// On Windows we pass shell:false but spawn needs the .bat to be the file
// argument of cmd.exe. Workaround: invoke cmd.exe with /d /s /c and quote
// the full command, so cmd handles the Unicode path locally.
const child = isWin
  ? spawn("cmd.exe", ["/d", "/s", "/c", `""${gradlew}" ${args.join(" ")}"`], {
      cwd: ANDROID,
      stdio: "inherit",
      windowsVerbatimArguments: true,
      env: process.env,
    })
  : spawn(gradlew, args, { cwd: ANDROID, stdio: "inherit", env: process.env });

child.on("exit", (code) => {
  if (code === 0 && task === "bundleRelease") {
    const aab = path.join(ANDROID, "app", "build", "outputs", "bundle", "release", "app-release.aab");
    if (fs.existsSync(aab)) {
      console.log("\n✓ Signed release bundle:");
      console.log(`  ${aab}`);
      console.log("\nNext: upload this AAB to Google Play Console → Release.");
    }
  }
  if (code === 0 && task === "assembleDebug") {
    const apk = path.join(ANDROID, "app", "build", "outputs", "apk", "debug", "app-debug.apk");
    if (fs.existsSync(apk)) {
      console.log("\n✓ Debug APK:");
      console.log(`  ${apk}`);
      console.log("\nSideload to a phone:  adb install -r " + apk);
    }
  }
  process.exit(code ?? 1);
});
