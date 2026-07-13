/* Service Worker de Amarango — v2
   Sirve SOLO para que la tienda se pueda instalar como app.
   ⚠️ NO cachea el HTML: siempre trae la versión fresca del servidor.
   (La v1 cacheaba todo y servía versiones viejas — eso causaba problemas) */

self.addEventListener('install', function(e){
  self.skipWaiting();   // toma el control enseguida
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    // borra TODO lo que haya guardado la versión vieja
    caches.keys().then(function(nombres){
      return Promise.all(nombres.map(function(n){ return caches.delete(n); }));
    }).then(function(){
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e){
  // Siempre va a la red. Nunca sirve una versión vieja.
  // (Chrome solo necesita que exista este listener para permitir instalar la app)
  return;
});
