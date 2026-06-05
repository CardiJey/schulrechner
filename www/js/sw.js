const CACHE_NAME = 'schulrechner-cache';

// Add whichever assets you want to pre-cache here:
const PRECACHE_ASSETS = [
    '/changelog/en-US.txt',
    '/changelog/de-DE.txt',
    '/css/styles.css',
    '/fonts/Schulrechner-Italic.ttf',
    '/fonts/Schulrechner-Regular.ttf',
    '/img/donate.svg',
    '/img/gui/Classic_by_Joris Yidong Scholl.json',
    '/img/gui/Classic_by_Joris Yidong Scholl.svg',
    '/img/gui/list.json',
    '/index.html',
    '/js/logic.js',
    '/js/main.js',
    '/js/math.js',
    '/version.txt',
    '/versionCode.txt'
]

// Listener for the install event - pre-caches our assets list on service worker install.
self.addEventListener('install', event => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        cache.addAll(PRECACHE_ASSETS);
    })());
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(async () => {
      const cache = await caches.open(CACHE_NAME);

      // match the request to our cache
      const cachedResponse = await cache.match(event.request);

      // check if we got a valid response
      if (cachedResponse !== undefined) {
          // Cache hit, return the resource
          return cachedResponse;
      } else {
        // Otherwise, go to the network
          return fetch(event.request)
      };
  });
});