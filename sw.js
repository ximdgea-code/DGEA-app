// Service Worker de DGEA App — permite instalar la app y abrirla sin internet
// (los datos ya cargados quedan disponibles; para sincronizar necesitas conexión)
const CACHE_NAME = 'dgea-app-v1';
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
  self.skipWaiting();
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
  event.respondWith(
    caches.match(event.request).then(function(respuesta) {
      return respuesta || fetch(event.request).then(function(res) {
        return caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, res.clone());
          return res;
        });
      }).catch(function() {
        return caches.match('./index.html');
      });
    })
  );
});
