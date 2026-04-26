// JobSwipe Service Worker — push notifications + offline fallback

const CACHE_NAME = "jobswipe-v1";
const OFFLINE_URL = "/offline.html";

// ── Install: pre-cache the offline fallback page ────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: remove stale caches ───────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch: network-first for navigation; serve offline.html on failure ─
self.addEventListener("fetch", (event) => {
  // Only intercept same-origin GET navigation requests (page loads).
  if (
    event.request.method !== "GET" ||
    event.request.mode !== "navigate"
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(OFFLINE_URL).then(
        (cached) =>
          cached ??
          new Response("<h1>Offline</h1>", {
            headers: { "Content-Type": "text/html" },
          })
      )
    )
  );
});

// ── Push notifications ───────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = { title: "JobSwipe", body: "יש עדכון חדש!", url: "/" };
  try {
    data = { ...data, ...event.data?.json() };
  } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon.svg",
      badge: "/icons/icon.svg",
      data: { url: data.url },
      dir: "rtl",
      lang: "he",
      vibrate: [100, 50, 100],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Focus existing tab if open
        for (const client of windowClients) {
          if (client.url === url && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise open new tab
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});
