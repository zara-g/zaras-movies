// Zara's Movies — service worker
const CACHE = 'zs-v22';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './v21.css',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Never cache API / iframe origins
  if (
    url.origin === 'https://api.themoviedb.org' ||
    url.origin === 'https://image.tmdb.org' ||
    url.origin === 'https://www.omdbapi.com' ||
    url.origin === 'https://cinesrc.st' ||
    url.origin === 'https://www.youtube.com' ||
    url.origin === 'https://www.youtube-nocookie.com'
  ) return;

  // Same-origin: stale-while-revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const network = fetch(req).then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
  }
});
