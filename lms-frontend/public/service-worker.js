/**
 * LMS EPT - Service Worker Haute Performance (PWA)
 * Fournit un rendu instantané à 0 ms des assets statiques et supporte le mode Offline.
 */

const CACHE_NAME = 'lms-assets-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png'
];

// Installation : Mise en cache préventive du Shell de l'application
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pré-mise en cache du shell de l\'application');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activation : Nettoyage des anciennes versions de caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Suppression de l\'ancien cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interception des requêtes HTTP (Mise en cache Stale-While-Revalidate)
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Ignorer les requêtes non-GET, les WebSockets et les appels d'API dynamiques
  if (request.method !== 'GET' || url.pathname.includes('/ws-announcement') || url.pathname.includes('/api/')) {
    return;
  }

  // 2. Stratégie pour la navigation HTML (SPA Routing) : Servir le Shell d'index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((cachedResponse) => {
        return cachedResponse || fetch(request);
      })
    );
    return;
  }

  // 3. Stratégie Stale-While-Revalidate pour les assets statiques (JS, CSS, Images, Polices)
  const isStaticAsset = 
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/) || 
    STATIC_ASSETS.includes(url.pathname);

  if (isStaticAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          // Lancer la requête réseau en parallèle pour mettre à jour le cache
          const networkFetch = fetch(request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Échec réseau discret, le cache local servira de sauvegarde
          });

          // Retourner immédiatement le cache s'il existe (0 ms), sinon attendre le réseau
          return cachedResponse || networkFetch;
        });
      })
    );
  }
});
