



const CACHE_NAME = 'interactive-story-cache-v1.5.0';
// Archivos estáticos de la app shell para precachear
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/img/icon-192.png',
  '/img/icon-512.png'
];

self.addEventListener('install', (event) => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching app shell and sources');
      // Use addAll with a new Request object that has cache: 'reload'
      // to bypass the browser's HTTP cache.
      const cachePromises = URLS_TO_CACHE.map(urlToCache => {
        const request = new Request(urlToCache, { cache: 'reload' });
        return cache.add(request).catch(err => console.warn(`Could not cache ${urlToCache}: ${err}`));
      });
      return Promise.all(cachePromises);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // We only want to handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    // Try to find a match in the cache
    caches.match(event.request).then((cachedResponse) => {
      // If we have a match, return it
      if (cachedResponse) {
        return cachedResponse;
      }

      // If no match, fetch from the network
      return fetch(event.request).then((networkResponse) => {
        // Check if we received a valid response
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        // Clone the response and cache it for future requests
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return networkResponse;
      }).catch(error => {
        console.error("Fetch failed; service worker could not retrieve resource.", error);
        // In a real app, you might want to return a fallback offline page.
      });
    })
  );
});