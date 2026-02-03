const CACHE_NAME = 'coherence-cardiaque-v16-fullscreen-sliders';

// Fichiers essentiels (cache-first)
const urlsToCache = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/ui.js',
  './js/media.js',
  './js/controller.js',
  './manifest.json',
  './assets/audio-manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png'
];

// Installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activation : nettoyage ancien cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch :
// - Cache-first pour les fichiers essentiels
// - Network-first (avec fallback cache) pour le reste
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Cache-first for same-origin assets
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          // Runtime cache for same-origin assets (including audio)
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
          return res;
        }).catch(() => cached);
      })
    );
    return;
  }

  // For cross-origin (fonts), network-first with cache fallback
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});
