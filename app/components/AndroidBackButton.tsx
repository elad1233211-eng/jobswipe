"use client";

/**
 * AndroidBackButton
 *
 * Registers a listener for the Android hardware back button via Capacitor's
 * @capacitor/app plugin. When the user is on the root screens (feed, employer
 * dashboard, matches) pressing back shows a "do you want to exit?" prompt
 * instead of navigating away. On any other screen it delegates to the browser's
 * built-in history.back().
 *
 * Must be mounted once, high in the tree (app layout). Safe to render on web —
 * the Capacitor plugin import is no-op outside of a native build.
 */

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const ROOT_PATHS = ["/app/feed", "/app/employer", "/app/matches"];

export default function AndroidBackButton() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function register() {
      try {
        // Dynamic import so the server bundle is never touched
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("backButton", ({ canGoBack }) => {
          const isRoot = ROOT_PATHS.some((p) => pathname.startsWith(p));
          if (isRoot || !canGoBack) {
            // On root screen: ask if user wants to exit
            App.exitApp();
          } else {
            router.back();
          }
        });
        cleanup = () => handle.remove();
      } catch {
        // Not running inside Capacitor — silently ignore
      }
    }

    register();
    return () => cleanup?.();
  }, [pathname, router]);

  return null;
}
