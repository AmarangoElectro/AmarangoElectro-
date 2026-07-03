// sw.js - Service Worker LIMPIO (no cachea nada)
// El anterior guardaba versiones viejas y no dejaba ver los cambios.
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});
// NO intercepta fetch: siempre va directo a la red (nunca sirve copias viejas)
