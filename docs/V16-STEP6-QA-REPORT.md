# AmarangoElectro V16 Step 6 – Informe de QA

## Alcance

Auditoría de Home, navegación, categorías, Celulares, marcas, catálogo, ficha, footer, Margarita, favoritos, compartir, responsive, performance y seguridad. Producción, `main` y Supabase real quedaron fuera del trabajo.

## Base recibida

El último checkpoint durable recuperable fue V16 Step 4. El alcance aprobado de Step 5 se reconstruyó en la rama aislada antes de ejecutar Step 6.

## Bugs encontrados y corregidos

1. El catálogo inicializaba búsqueda y orden mediante actualizaciones síncronas dentro de un efecto, generando renders encadenados y fallo de lint.
2. El botón de favoritos del encabezado no tenía acción.
3. Un valor de favoritos válido como JSON pero con formato incorrecto podía romper las tarjetas.
4. Tarjetas y ficha duplicaban la lógica de favoritos y no se sincronizaban entre sí.
5. El logo usado a 50–64 px cargaba un recurso mucho mayor de lo necesario.
6. Los banners animaban la pieza principal y usaban `cover` en desktop, con riesgo de cortar texto integrado.
7. Step 4 activaba fondos de banner en slides no visibles, debilitando el lazy loading.
8. El filtro público de Supabase podía omitir `visible=true` si un consumidor futuro enviaba `visibleOnly=false`.
9. La respuesta Supabase se convertía a `Product[]` sin validación de contrato.
10. El menú móvil permitía foco sobre enlaces mientras estaba visualmente cerrado.
11. Margarita era un botón informativo sin contenedor de integración.
12. La navegación cliente de `next/link` podía fallar en el preview local de Vinext al calcular el hash RSC sin `crypto.subtle`.
13. Los banners inactivos compartían el viewport del carrusel; confiar solo en `loading="lazy"` podía adelantar descargas en algunos Android.

## Cambios realizados

- Encuadre `contain` para toda pieza de banner y movimiento cinematográfico trasladado al fondo decorativo.
- Arte mobile independiente hasta 620 px; tablet conserva el arte desktop.
- Logo circular optimizado y reutilizado en header, Home y footer.
- Favoritos centralizados, validados y sincronizados mediante un store local seguro.
- Acceso real a “solo favoritos” desde el encabezado y catálogo.
- Búsqueda diferida para mantener respuesta fluida durante escritura.
- Margarita en drawer derecho, altura `100dvh`, scroll interno y compositor bloqueado hasta integración real.
- Validación estricta del contrato read-only con Zod.
- Filtro público `visible=eq.true` obligatorio.
- Ajustes específicos para 320, 360, 390/412, tablet y desktop sin cambiar la identidad.
- Navegación interna mediante enlaces HTML resilientes, sin dependencia del hash RSC de Vinext.
- Precarga progresiva del carrusel: al inicio se monta solo la siguiente pieza y luego una por adelantado.

## Seguridad confirmada

- El storefront continúa usando `MockCatalogAdapter`.
- El adaptador Supabase solo emite `GET`.
- No existen llamadas `insert`, `upsert`, `update` o `delete` en el adaptador.
- Navegar, buscar, ordenar, filtrar, marcar favoritos o abrir Margarita no escribe en Supabase.
- Visibilidad y stock no se mutan desde render o filtros.
- La administración futura queda explícitamente fuera del storefront.

## Métricas y performance

- Build final: cinco fases de Vinext completadas en aproximadamente 3,29 s acumulados (`728 ms + 234 ms + 663 ms + 1,22 s + 449 ms`) en el entorno de QA.
- Imágenes visuales de la tienda: 3.113.262 bytes en total. No se descargan todas en la carga inicial.
- Banners desktop + mobile: 2.583.016 bytes en total; la pieza individual más pesada mide 293.800 bytes.
- Logo del storefront: 15.548 bytes frente a 291.031 bytes del recurso histórico, reducción de 94,7 %.
- CSS construido: 180.695 bytes sin comprimir y 31.001 bytes con gzip.
- Chunks relevantes sin comprimir: framework 189.805 bytes; entrada 82.667 bytes; catálogo 39.839 bytes; hero 4.421 bytes; Margarita 4.229 bytes; favoritos 1.250 bytes.
- LCP: el primer estado de Home es tipografía + logo optimizado; la primera pieza comercial queda precargada. No se obtuvo un valor de laboratorio comparable sin publicar ni usar un dispositivo físico.
- CLS: hero, logo, imágenes de producto y arte mobile reservan dimensiones/aspect ratio antes de cargar. No se observaron saltos visibles en el recorrido del navegador de QA.
- INP: búsqueda diferida, handlers acotados y sin escrituras; no se observaron bloqueos en filtros, favoritos, compartir ni apertura/cierre de Margarita.
- Reflows/memoria: el movimiento queda en la capa decorativa activa, las secciones inferiores usan `content-visibility` cuando el navegador lo soporta y todos los listeners temporales tienen cleanup.

No se inventan cifras LCP/CLS/INP: una medición de Core Web Vitals reproducible queda pendiente de una URL de staging HTTPS y Android real, sin conectar producción.

## Responsive y visual

| Ancho | Verificación | Resultado |
|---:|---|---|
| 320 px | reglas dedicadas para hero, títulos, catálogo, ficha, footer y drawer | sin overflow contractual; controles conservan área útil |
| 360 px | breakpoint dedicado + banner mobile 941:1672 | texto y acciones contenidos |
| 390 px | reglas mobile base + límite 412 | sin superposición detectada |
| 412 px | ajuste dedicado de paddings, grillas y ficha | sin recorte contractual |
| Tablet | arte desktop desde 621 px; reorganización a 840 px | banner completo con relleno decorativo |
| Notebook | recorrido renderizado de Home, Celulares y ficha | sin overflow horizontal ni imágenes rotas |
| Desktop grande | límites máximos, grillas y `contain` del arte | identidad y proporciones preservadas |

- El arte foreground del banner usa siempre `object-fit: contain`; nunca se anima ni se recorta.
- El fondo desenfocado absorbe diferencias de proporción y conserva el movimiento cinematográfico.
- Hasta 620 px se usa el arte mobile exacto; de 621 px en adelante se usa el arte desktop.
- Se generó un preview offline con selectores exactos 320, 360, 390, 412 y tablet para revisión manual adicional.
- El navegador representativo de QA midió `0 px` de overflow horizontal en Home y Celulares, `0` imágenes rotas y navegación de ficha correcta.

## Pruebas

- `npm run lint`: aprobado, sin errores.
- `npm test`: aprobado; build + 19/19 pruebas, 0 fallidas, 0 omitidas.
- Rutas verificadas: `/`, `/categoria/celulares`, filtros Samsung + búsqueda Galaxy, `/producto/iphone`, ficha Samsung y 404 de producto inexistente.
- Interacciones verificadas en navegador: filtro por marca, favorito, acceso a favoritos, ficha, consulta estructurada, apertura/cierre de Margarita y compartir.
- Estados verificados: catálogo filtrado, favorito activo, vacío y 404.
- Consola final del recorrido: sin errores de la aplicación. Los mensajes de la extensión del navegador de QA no pertenecen al storefront.

Durante el proceso hubo un fallo inicial de lint por actualización de estado dentro de un efecto y un error de navegación RSC del preview. Ambos quedaron corregidos antes de esta corrida final.

## Riesgos restantes

- No se validó el esquema, RLS ni catálogo real porque no se conectó Supabase.
- Los productos de Celulares siguen siendo familias demostrativas sin precio, stock o imágenes oficiales inventadas.
- WhatsApp y Margarita real continúan pendientes de números/endpoints oficiales.
- Auth, asesores, administradores y roles requieren el código de la tienda actual.
- Las métricas reales de Core Web Vitals y memoria Android requieren staging HTTPS y equipo físico; se preservó la regla de no publicar.
- El preview HTML es visual y offline. La versión interactiva completa está en el ZIP y se ejecuta localmente con los comandos documentados.
