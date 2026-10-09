const CACHE = "amarango-v16-shell-v3";
const OFFLINE = "/offline.html";
const SHELL = [OFFLINE, "/manifest.webmanifest", "/favicon.svg", "/logo-320.webp", "/icons/app-192.png", "/icons/app-512.png", "/icons/app-maskable-192.png", "/icons/app-maskable-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  // Sites must receive OAuth navigation directly, not a worker subrequest.
  if (url.origin === self.location.origin && ["/callback", "/signin-with-chatgpt", "/signout-with-chatgpt"].includes(url.pathname.replace(/\/$/, ""))) return;
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE)));
    return;
  }
  if (url.origin === self.location.origin && SHELL.includes(url.pathname)) {
    event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
  }
});
