# AmarangoElectro V16 — Step 7H
## Storefront Continuity + PWA Foundation

## Objetivo

Hacer que V16 conserve el contexto del cliente entre catálogo y ficha, recuerde de forma local los productos vistos y quede preparada para instalarse como aplicación web progresiva, sin duplicar el producto ni abrir ninguna integración de producción.

## Cambios Step 7H

### 1. Volver exactamente a los resultados

Al abrir una ficha desde una categoría, V16 guarda en `sessionStorage` la URL del catálogo, filtros/query y posición vertical. La ficha ofrece `Volver a tus resultados`; al regresar, restaura esa posición en lugar de mandar al usuario al inicio del catálogo.

El contexto caduca y vive solo en la pestaña actual. No se transmite.

### 2. Vistos recientemente

Las fichas vistas se guardan en `localStorage` con un máximo de seis IDs. Home, categoría y PDP pueden mostrar una banda `Seguí donde estabas` cuando esos IDs existen dentro del catálogo disponible.

- no hay cuenta;
- no hay cookie de tracking;
- no hay telemetría;
- no hay sincronización entre dispositivos;
- el usuario puede limpiar la lista.

### 3. Anticipación de navegación

Los enlaces internos a categoría/ficha pueden prefetchar el documento únicamente cuando existe intención (`pointerenter`/focus). El prefetch queda desactivado con Data Saver, 2G o perfil `lean`, evitando gastar tráfico en dispositivos restringidos.

Se mantiene navegación HTML normal para preservar la resiliencia de QA/Vinext ya acordada.

### 4. Base PWA instalable

Se incorporaron:

- `manifest.webmanifest` con nombre, colores, `start_url`, `scope` y `display: standalone`;
- iconos 192/512 y variantes maskable;
- metadata Apple Web App;
- registro progresivo de Service Worker;
- botón `Instalar` solo cuando Chromium expone `beforeinstallprompt`;
- soporte de safe areas en modo standalone.

Esto permite que la misma V16 evolucione como tienda web y app instalable sin mantener dos frontends.

### 5. Offline seguro

El Service Worker **no cachea el catálogo ni páginas de producto exitosas**. Solo conserva un shell mínimo (manifest, íconos, logo y página offline). Una navegación normal siempre intenta la red; si no existe conexión, muestra un fallback claro.

Esta decisión evita congelar precios, stock o información comercial cuando más adelante V16 lea datos reales.

## Alcance explícitamente intacto

- `MockCatalogAdapter` continúa activo.
- No se conectó Supabase real.
- No se ejecutó SQL/RLS.
- No se agregaron escrituras de catálogo.
- Margarita, IA, Workers, WhatsApp y webhooks continúan fuera de alcance.
- Producción y `main` no se modifican.

## Camino futuro de aplicación

PWA es la primera capa recomendada porque comparte el mismo código y despliegue. Si más adelante conviene publicar en Google Play/App Store, esta base puede evaluarse para empaquetado nativo/híbrido o para una app dedicada, sin que esa decisión sea necesaria para reemplazar la tienda Legacy.
