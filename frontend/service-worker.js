// Z Shield AI (Service Worker for PWA)
// Program by Zidaan
const CACHE_NAME = "z-shield-cache-v6";

const APP_SHELL = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/manifest.json",
  "/ZShield192.png",
  "/ZShield512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    // Cache each asset independently so one missing optional path does not
    // prevent the service worker from installing. Check the browser console
    // and Network panel for any asset that fails to load.
    await Promise.allSettled(
      APP_SHELL.map(async (url) => {
        const response = await fetch(url, { cache: "reload" });
        if (response.ok) {
          await cache.put(url, response);
        } else {
          throw new Error(`Could not cache ${url}: HTTP ${response.status}`);
        }
      })
    );

    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((name) => name.startsWith("z-shield-cache-") && name !== CACHE_NAME)
        .map((name) => caches.delete(name))
    );
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Do not cache API calls, POST requests, or third-party requests.
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  // For page navigations, try the network first and fall back to the cached app.
  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put("/", response.clone());
        }
        return response;
      } catch (_) {
        return (await caches.match(request)) || (await caches.match("/")) ||
          new Response("You are offline. Reconnect to use Z-Shield AI.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" }
          });
      }
    })());
    return;
  }

  // Cache-first for same-origin static assets, then fall back to the network.
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    return fetch(request);
  })());
});