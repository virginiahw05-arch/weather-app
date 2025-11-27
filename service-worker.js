const CACHE_NAME = 'wanjiku-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/styles.css',
  '/app.js',
  '/cities.json',
  '/manifest.json'
];

self.addEventListener('install', ev=>{
  ev.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', ev=>{
  ev.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', ev=>{
  const url = new URL(ev.request.url);
  // API calls: try network first, fallback to cache
  if(url.hostname.includes('api.open-meteo.com') || url.hostname.includes('openaq.org') || url.hostname.includes('wikipedia.org') || url.hostname.includes('nominatim.openstreetmap.org')){
    ev.respondWith(fetch(ev.request).catch(()=>caches.match(ev.request)));
    return;
  }
  // for navigation and assets: cache-first
  ev.respondWith(caches.match(ev.request).then(r=>r || fetch(ev.request)));
});
