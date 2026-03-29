



const CACHE_NAME = 'interactive-story-cache-v1.4.1'; // Cache version bump
// These are the core files for the app shell.
// By pre-caching these, the app loads almost instantly on subsequent visits
// and works offline.
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',

  // Root TS/TSX
  '/index.tsx',
  '/App.tsx',

  // Services and Utils
  '/services/geminiService.ts',
  '/utils/pdfUtils.ts',
  '/utils/textUtils.ts',

  // src root
  '/src/constants.ts',
  '/src/types.ts',
  '/src/systemInstructions.ts',
  '/src/db.ts',

  // Components
  '/src/components/Alert.tsx',
  '/src/components/BranchingChoicesDisplay.tsx',
  '/src/components/ConfirmationModal.tsx',
  '/src/components/ConversationView.tsx',
  '/src/components/EditStoryModal.tsx',
  '/src/components/FollowUpForm.tsx',
  '/src/components/FullStoryDisplay.tsx',
  '/src/components/ImageActionsModal.tsx',
  '/src/components/InitialPromptForm.tsx',
  '/src/components/IosInstallPrompt.tsx',
  '/src/components/MobileTipBanner.tsx',
  '/src/components/Modal.tsx',
  '/src/components/ParagraphImageModal.tsx',
  '/src/components/StoryAudioPlayer.tsx',
  '/src/components/StoryGenerator.tsx',
  '/src/components/StoryHistoryModal.tsx',
  '/src/components/StoryHistoryView.tsx',
  '/src/components/StoryVisualizationModal.tsx',
  '/src/components/StoryGalleryModal.tsx',
  
  // THE NEW CONSOLIDATED ICONS FILE
  '/src/components/Icons.tsx',

  // Pages
  '/src/pages/HistoryPage.tsx',
  '/src/pages/LoreBookPage.tsx',
  '/src/pages/SettingsPage.tsx',

  // Hooks
  '/src/hooks/useInitialStorySetup.ts',
  '/src/hooks/useLoreBook.ts',
  '/src/hooks/useStoryArtifacts.ts',
  '/src/hooks/useStoryAudio.ts',
  '/src/hooks/useStoryChat.ts'
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