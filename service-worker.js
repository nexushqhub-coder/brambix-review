// Minimal service worker — enables "Add to Home Screen" installability.
// Data is always fetched live from n8n, so we don't cache API responses,
// only the static app shell for a faster reopen.

const CACHE_NAME = 'brambix-review-v1';
const SHELL_FILES = ['./index.html', './style.css', './app.js', './manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Never cache API calls to n8n — always fetch fresh
  if (url.pathname.includes('/webhook/')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
