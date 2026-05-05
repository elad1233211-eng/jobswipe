import type { CapacitorConfig } from "@capacitor/cli";

/**
 * JobSwipe Capacitor configuration.
 *
 * Architecture: WebView-on-Railway
 * The Android shell loads the live Railway URL in a full-screen WebView.
 * All business logic, auth, and DB remain on the server — no static export needed.
 *
 * Before building for Play Store:
 *  1. Set RAILWAY_URL to your actual Railway domain (e.g. https://jobswipe.up.railway.app)
 *  2. Run: npx cap sync android
 *  3. Open in Android Studio: npx cap open android
 *
 * For local emulator testing:
 *  1. Run: LOCAL_DEV=true npx cap sync android   (PowerShell: $env:LOCAL_DEV="true"; npx cap sync android)
 *  2. The WebView will point to http://10.0.2.2:3000 (emulator → host machine localhost)
 *  3. Run `npm run dev` in a separate terminal to start the Next.js server
 */

const LOCAL_DEV = process.env.LOCAL_DEV === "true";
const RAILWAY_URL =
  process.env.RAILWAY_URL ?? "https://jobswipe-production.up.railway.app";

// 10.0.2.2 is the Android emulator's alias for the host machine's localhost
const SERVER_URL = LOCAL_DEV ? "http://10.0.2.2:3000" : RAILWAY_URL;

const config: CapacitorConfig = {
  appId: "com.jobswipe.app",
  appName: "JobSwipe",
  webDir: "out", // only used if you ever do a static export; otherwise ignored
  server: {
    // Point the WebView at the live Railway server instead of bundled assets.
    url: SERVER_URL,
    cleartext: LOCAL_DEV, // allow HTTP only in local dev; HTTPS-only in production
    androidScheme: LOCAL_DEV ? "http" : "https",
  },
  android: {
    allowMixedContent: LOCAL_DEV, // allow mixed content only in local dev
    captureInput: true,
    webContentsDebuggingEnabled: LOCAL_DEV, // enable DevTools in local dev only
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#ec4899", // pink-500
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#ec4899",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
