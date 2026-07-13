/* Service Worker de Amarango — v3
   🔑 CLAVE: el caché lleva el nombre de la CARPETA.
   Así cada tienda tiene su propio espacio y Chrome NO las confunde. */

// el nombre del caché sale de la carpeta donde vive este archivo
const CARPETA = self.location.pathname.replace(/\/sw\.js$/, '') || '/';
const CACHE = 'amarango' + CARPETA.replace(/\//g, '-') + '-v3';

self.addEventListener('install', function(e){
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    // borra SOLO los cachés viejos de ESTA tienda (no toca los de otras)
    caches.keys().then(function(nombres){
      return Promise.all(
        nombres
          .filter(function(n){ return n.indexOf('amarango' + CARPETA.replace(/\//g,'-')) === 0 && n !== CACHE; })
          .map(function(n){ return caches.delete(n); })
      );
    }).then(function(){
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e){
  // siempre a la red (nunca sirve versiones viejas)
  return;
});
