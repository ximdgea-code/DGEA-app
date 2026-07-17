// Service Worker de DGEA App — permite instalar la app y abrirla sin internet
// IMPORTANTE: cada vez que se publique una actualización de la app, hay que
// subir loi de nuevo ESTE archivo con el número de CACHE_NAME cambiado
// (ej: v2 -> v3). Si solo se sube index.html sin cambiar este archivo,
// los celulares que ya instalaron la app seguirán viendo la versión vieja.
const CACHE_NAME = 'dgea-app-v2';
const ARCHIVOS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ARCHIVOS);
    })
  );
});

self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(nombres) {
      return Promise.all(
        nombres.filter(function(n) { return n !== CACHE_NAME; })
               .map(function(n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  // Solo intercepta peticiones GET del propio sitio (deja pasar las llamadas a Apps Script/Telegram)
  if (event.request.method !== 'GET') return;

  var esPagina = event.request.mode === 'navigate' || event.request.url.indexOf('index.html') !== -1;

  if (esPagina) {
    // RED PRIMERO: siempre intenta traer la versión más nueva del servidor.
    // Solo usa la copia guardada si no hay conexión.
    event.respondWith(
      fetch(event.request).then(function(res) {
        caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, res.clone()); });
        return res;
      }).catch(function() {
        return caches.match(event.request).then(function(r){ return r || caches.match('./index.html'); });
      })
    );
    return;
  }

  // Para íconos/manifest: copia guardada primero (no cambian seguido), red si no está.
  event.respondWith(
    caches.match(event.request).then(function(respuesta) {
      return respuesta || fetch(event.request).then(function(res) {
        return caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, res.clone());
          return res;
        });
      });
    })
  );
});
