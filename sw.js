/* Service Worker de Amarango
   Sirve para que la tienda se instale como app de verdad.
   Es el mismo para TODAS las tiendas (no hay que separarlo). */

const CACHE = 'amarango-v1';

self.addEventListener('install', function(e){
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function(e){
  // primero la red; si no hay, lo que esté guardado
  e.respondWith(
    fetch(e.request)
      .then(function(r){
        // guarda una copia para cuando no haya señal
        if(e.request.method === 'GET' && r && r.status === 200){
          const copia = r.clone();
          caches.open(CACHE).then(function(c){
            c.put(e.request, copia).catch(function(){});
          });
        }
        return r;
      })
      .catch(function(){
        return caches.match(e.request);
      })
  );
});
