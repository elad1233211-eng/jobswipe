"use client";

/**
 * Registers the service worker and, if VAPID public key is configured,
 * subscribes to Web Push and saves the subscription on the server.
 *
 * Shows a subtle banner asking permission only once (stored in localStorage).
 */

import { useEffect, useState } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return arr.buffer as ArrayBuffer;
}

async function subscribeAndSave(reg: ServiceWorkerRegistration) {
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  const json = sub.toJSON();
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
    }),
  });
}

export default function PushPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!VAPID_PUBLIC_KEY) return; // VAPID not configured
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    // Register SW regardless
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((reg) => {
      if (Notification.permission === "granted") {
        // Already allowed — subscribe silently
        subscribeAndSave(reg).catch(() => {});
      } else if (Notification.permission === "default") {
        // Haven't asked yet — show banner once
        const dismissed = localStorage.getItem("push_dismissed");
        if (!dismissed) setShow(true);
      }
    });
  }, []);

  if (!show) return null;

  async function handleAllow() {
    setShow(false);
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const reg = await navigator.serviceWorker.ready;
      subscribeAndSave(reg).catch(() => {});
    } else {
      localStorage.setItem("push_dismissed", "1");
    }
  }

  function handleDismiss() {
    setShow(false);
    localStorage.setItem("push_dismissed", "1");
  }

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-between gap-3 text-sm">
      <span className="text-blue-800">
        🔔 רצית לקבל התראות על match ומסרים חדשים?
      </span>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={handleAllow}
          className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-blue-700"
        >
          כן
        </button>
        <button
          onClick={handleDismiss}
          className="text-blue-400 hover:text-blue-600 text-xs"
        >
          לא עכשיו
        </button>
      </div>
    </div>
  );
}
