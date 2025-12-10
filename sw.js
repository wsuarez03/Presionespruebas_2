const CACHE_NAME = 'presiones-cache-v21'; // Nuevo para forzar actualización

const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
  './icon-512.png',
  './icon-192.png',
  'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jstat/1.9.5/jstat.min.js'
];

// -------------------------
// INSTALACIÓN
// -------------------------
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Cacheando archivos...');
      return cache.addAll(urlsToCache);
    })
  );
});

// -------------------------
// ACTIVACIÓN
// -------------------------
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Eliminando caché viejo:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );

  clients.claim();
});

// -------------------------
// FETCH
// -------------------------
self.addEventListener('fetch', event => {

  // ⚠ Importante: NO interceptar peticiones POST
  // (EmailJS y tu worker-resend necesitan red normal)
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          // Si existe en cache → retornarlo
          return response;
        }

        // Si no existe → intentar desde red
        return fetch(event.request)
          .then(networkResponse => {
            // Guardar una copia del archivo nuevo en caché
            return caches.open(CACHE_NAME).then(cache => {
              try {
                // Solo almacenar respuestas válidas
                if (networkResponse && networkResponse.status === 200) {
                  cache.put(event.request, networkResponse.clone());
                }
              } catch (e) {
                console.warn('[SW] No se pudo guardar en cache:', e);
              }
              return networkResponse;
            });
          })
          .catch(() => {
            // Fallback opcional si quieres página offline:
            // return caches.match('./offline.html');
          });
      })
  );
});


