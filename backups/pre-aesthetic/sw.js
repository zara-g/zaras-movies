// Zara's Movies — service worker
//
// App files (page, scripts, styles, manifest) are fetched fresh from the
// network first, so updates show up on a normal reload. The cached copy is
// only used when offline or when the network is too slow to answer.
// Icons are served from cache first. Other origins (APIs, images, players)
// are never touched.
const CACHE = 'zs-v25';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
];
const NETWORK_TIMEOUT = 4000;

self.addEventListener('install', (event) => {
  event.waitUntil(
    // One missing file must not stop the rest from being cached
    caches.open(CACHE).then((c) => Promise.allSettled(SHELL.map((url) => c.add(url))))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isAppFile(req, url) {
  return req.mode === 'navigate'
    || url.pathname.endsWith('/')
    || /\.(html|js|css|json)$/.test(url.pathname);
}

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  const cached = () => cache.match(req, { ignoreSearch: true });

  const network = fetch(req, { cache: 'no-cache' }).then((res) => {
    if (res && res.ok && res.type === 'basic') cache.put(req, res.clone()).catch(() => {});
    return res;
  });
  network.catch(() => {}); // a late failure after the timeout wins is fine

  // If the network is slow and we have a copy, don't leave the user waiting
  const timeout = new Promise((resolve) => {
    setTimeout(async () => resolve(await cached()), NETWORK_TIMEOUT);
  });

  try {
    const res = await Promise.race([network, timeout]);
    if (res) return res;
    return await network;
  } catch {
    return (await cached()) || Response.error();
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && res.ok && res.type === 'basic') cache.put(req, res.clone()).catch(() => {});
  return res;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(isAppFile(req, url) ? networkFirst(req) : cacheFirst(req));
});
