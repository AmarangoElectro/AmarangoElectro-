// Service Worker - Calculadora AmarangoElectro
var CACHE='amarango-calc-v1';
var ARCHIVOS=['./calculadora.html','./manifest.json','./icon.png','./icon-192.png'];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(cache){
      return cache.addAll(ARCHIVOS).catch(function(){});
    })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(claves){
      return Promise.all(claves.map(function(k){
        if(k!==CACHE)return caches.delete(k);
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e){
  e.respondWith(
    caches.match(e.request).then(function(resp){
      return resp || fetch(e.request).then(function(r){
        return caches.open(CACHE).then(function(cache){
          try{ cache.put(e.request, r.clone()); }catch(err){}
          return r;
        });
      }).catch(function(){ return resp; });
    })
  );
});
