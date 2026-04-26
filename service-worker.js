/* ============================================================
   service-worker.js — Offline caching (cache-first)
   ============================================================ */
 
const CACHE = 'archery-v2-cache-v2';
 
const ASSETS = [
  './', './index.html',
  './css/style.css',
  './js/constants.js',
  './js/storage.js',
  './js/firebase-config.js',
  './js/firebase.js',
  './js/coach.js',
  './js/sessions.js',
  './js/history.js',
  './js/aimmap.js',
  './js/profiles.js',
  './js/community.js',
  './js/app.js',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js'
];
 
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
 
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
    .then(() => self.clients.claim())
  );
});
 
self.addEventListener('fetch', e => {
  // Let Firebase & Claude API requests go to network
  const url = e.request.url;
  if (url.includes('firebase') || url.includes('anthropic') || url.includes('googleapis')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
 
