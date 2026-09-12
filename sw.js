const CACHE_NAME = 'attendance-v9';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './install.js',
  './manifest.webmanifest',
  './icon-192.svg',
  './icon-512.svg',
  './apple-touch-icon.svg'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (url.includes('tapi.bale.ai') || url.includes('corsproxy.io')) {
    e.respondWith(fetch(e.request).catch(() => new Response('{"ok":false}', {headers:{'Content-Type':'application/json'}})));
    return;
  }
  if (/index\.html|app\.js|install\.js|styles\.css|manifest/.test(url)) {
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if (res && res.ok && e.request.method === 'GET') {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
