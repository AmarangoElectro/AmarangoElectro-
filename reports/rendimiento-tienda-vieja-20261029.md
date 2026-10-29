# Auditoría de rendimiento — tienda vieja AmarangoElectro

Fecha: 29 de octubre de 2026 (Argentina).
Base: `76acde2f21ef12da86329bb1c56e20eced61b0b1`, rama `main`.
Trabajo: `audit/rendimiento-tienda-vieja-20261029`.
Estado: **prueba / no autoriza publicación**. No se modificó producción.

## Diagnóstico comprobado

1. **La caché se invalida por comparar conjuntos diferentes.** `tiendaCantidadLocalIncremental()` contaba todo el catálogo fusionado (1.817 productos). El HEAD de Supabase contaba sólo las filas incrementales activas (1.787). La diferencia disparaba reconstrucción completa aun sin novedades. Se reprodujo en Chrome el aviso `Catálogo local incompleto; reconstruyendo. 1817 1787`. Cuatro respuestas consecutivas pesaron 482.031 + 571.028 + 655.091 + 425.591 = **2.133.741 bytes**. El inventario remoto contenía 1.835 filas, 48 eliminadas. La lista de ocho celulares se descarga aparte.
2. **Los banners compiten con las fotografías.** Los cuatro PNG horizontales efectivos de la portada sumaban **8.699.508 bytes**. Cada uno mide 1.672 × 941 píxeles. CSS solicita los cuatro al cargar la portada. Los fondos se descargan aunque los otros slides todavía no se vean.
3. **Consulta de celulares duplicada.** `conectarNube()` y la cadena de `tiendaInit()` pedían `celulares_lista/id=lista` en el mismo arranque. Se observaron dos GET de 2.298 bytes cada uno, con sus renderizados.
4. **IndexedDB carecía de plazo.** `tiendaCacheGrandeAbrir()` no manejaba `onblocked` ni timeout. La sincronización inicial esperaba esa promesa antes de consultar Supabase. Una apertura o lectura estancada podía dejar esperando al inicio. Es una ruta de bloqueo demostrada con pruebas controladas; no se afirma haber reproducido exactamente el incidente del teléfono de Max.
5. **Espera artificial de la pantalla inicial.** El splash imponía un mínimo de 900 ms y su límite de seis segundos dependía del mismo script final. Si ese script no se ejecutaba, no existía un límite visual independiente.
6. **Todas las fotos de tarjetas usaban lazy.** Incluso las primeras. `fotoOpt()` retorna la URL original; la ruta de optimización existente no está cargada por el documento efectivo. No hay miniaturas efectivas en esas tarjetas.
7. **Error de foto sin estado visible.** El handler reintentaba la misma URL cuando `fotoOpt()` devolvía el original. Conservaba el fondo blanco y no informaba un error final.
8. **Reconstrucciones repetidas.** En una reapertura base se observaron 11 llamadas a `tiendaRender()`, varias desde configuración secundaria. Cambian todo el HTML de la grilla. No se encontró evidencia suficiente para afirmar descargas binarias duplicadas por cada reconstrucción: el navegador puede reutilizar su caché HTTP.
9. **Saltos medidos.** El indicador de sincronización ocupaba espacio sobre la grilla; quitarlo produjo un evento CLS de 0,023736. También apareció un desplazamiento del pie antes de retirar el splash (hasta 0,194536 en algunas muestras). Ambos se reprodujeron e identificaron con `PerformanceObserver`.

## Fotos: alcance y límites

Se inventariaron **1.675 URLs únicas**, dos fotos embebidas en base64 y 148 registros candidatos sin campo de foto. Estos candidatos incluyen filas manuales que pueden estar ocultas; no equivale a 148 tarjetas públicas rotas. Las fotos base64 suman 135.938 caracteres dentro de los JSON y se repiten entre fuentes.

Se confirmó respuesta HTTP 200 en 66 URLs. Se descargaron y decodificaron diez muestras: JPEG de 86.645 a 307.623 bytes, de 600 a 1.000 píxeles de ancho y 750 a 1.333 de alto. También se observaron en el navegador fotos actuales de 600 × 600, 600 × 750 y 1.000 × 1.000. Hay originales relativamente grandes para dos columnas móviles, pero no se comprobó que todas las fotos sean excesivas.

Las otras 1.609 comprobaciones quedaron inconclusas: 1.597 fueron rechazadas por el túnel de red del entorno y 12 agotaron el tiempo. **No son 1.609 fotos rotas.** No se comprobó un 404 de origen en esta auditoría. Hay 122 URLs del dominio externo `cdn.catalog-store.link`; las restantes del inventario son de Supabase. No se sortearon las restricciones de red.

Recuperación segura pendiente: verificar GET y decodificación por URL desde un entorno con acceso; cruzar la fila original, `catalogo_manuales`, revisión individual y banco de fotos por identidad exacta del producto. No recuperar por coincidencias aproximadas de nombres. Si no existe un original inequívoco, solicitarlo al equipo. No se cambiaron URLs de fotos ni se reasignaron imágenes.

Supabase documenta que sus transformaciones de imagen requieren Pro o superior y estar habilitadas. No se activó ese servicio, no se cambió el plan y no se reemplazó infraestructura. Evaluar miniaturas versionadas sólo después de confirmar capacidad, coste y originales. Fuente: https://supabase.com/docs/guides/storage/serving/image-transformations. Se consultó además el changelog vigente; no se realizó ninguna migración ni cambio de API.

## Cambios implementados en la rama

- La caché guarda el inventario de IDs incrementales junto con productos y versión, en el mismo registro IndexedDB existente. La comprobación usa ese inventario y verifica que cada ID exista en la copia local. Los manuales adicionales dejan de provocar reconstrucciones falsas. Las cachés antiguas sin inventario se reconstruyen una vez; si la caché está incompleta se conserva la reparación. No cambia el esquema de Supabase ni la versión de la base IndexedDB.
- Se guarda en IndexedDB la copia final después de aplicar las capas de publicación/manuales. Se conserva la vista previa mientras se reconstruye la copia.
- Una sola cadena inicia catálogo y celulares en paralelo. No se vuelve a pedir la lista de celulares al terminar el catálogo.
- Apertura y lectura de IndexedDB tienen cada una un límite de 1,2 segundos. La apertura tardía se cierra y una lectura tardía no aplica datos viejos. La red puede continuar si falla la caché.
- El splash tiene respaldo CSS independiente a 2,5 segundos y deja de imponer 900 ms cuando el contenido está listo. Retirarlo no habilita las acciones sujetas a verificación comercial.
- Dos primeras fotos tienen prioridad alta y carga inmediata; las demás conservan carga diferida. Las secciones secundarias de portada no elevan todas sus fotos a prioridad alta.
- Indicador temporal de carga/error sobre el espacio ya reservado para la foto. Al cargar se retira. Si una futura miniatura falla, sólo se permite una recuperación al original exacto; si ya era el original, no se repite la URL.
- El aviso de sincronización queda fuera del flujo y se reserva área de catálogo durante la verificación sin estirar tarjetas. La muestra final registró CLS 0.
- Se agregan copias WebP de los mismos cuatro banners, calidad 90, sin recorte ni cambio de dimensiones. Se conservan los PNG originales. Comparación visual lado a lado revisada al tamaño de uso.

## Antes y después medidos

Prueba en **Chrome remoto, marco de 412 × 915**, con respuestas reales de lectura de Supabase. Página servida en preview local con las capas visuales existentes. Se instrumentaron `fetch`, `PerformanceObserver`, navegación, imágenes y renders. Las escrituras de red estaban bloqueadas por el instrumento de QA: cero intentos bloqueados durante el arranque. Cachés de ensayo separadas de las de la tienda y de V16.

La tabla compara reaperturas con caché. Son muestras de laboratorio, no una promesa de tiempos en Android ni un benchmark estadístico. Los binarios de imágenes podían estar en la caché HTTP; no se simularon CPU ni red 4G. La primera foto visible considera tanto la imagen lista como la retirada del splash.

| Medida | Base | Rama final |
| --- | ---: | ---: |
| Acceso visual a la tienda | 1,149 s | 0,365 s |
| Primera foto lista para dibujar | 0,210 s | 0,203 s |
| Primera foto expuesta, con splash retirado | 1,149 s | 0,365 s |
| Catálogo y capas de publicación completados según señal existente | 1,678 s | 0,885 s |
| Registros de `tiendaProductos` | 1.817 | 1.817 |
| GET de lista de celulares | 2 | 1 |
| GET de páginas incrementales | 4 completas | 1 delta vacío |
| Cuerpo JSON incremental sin novedades | 2.133.741 B | 2 B (`[]`) |
| Cuerpos JSON del arranque completo | 3.313.887 B | 1.177.850 B |
| Pedidos de datos del arranque | 23 | 19 |
| Llamadas de render | 11 | 9 |
| Tiempo acumulado dentro de render | 259,0 ms | 199,7 ms |
| CLS de la muestra | 0,023736 | 0 |
| Errores JS o de imagen del instrumento | 0 | 0 |
| Peso de cuatro banners, fuera de la cuenta JSON | 8.699.508 B | 1.060.426 B |

Ahorro comprobado: **64,5 % de cuerpos JSON** en la reapertura y **87,8 % en banners**. Los JSON son bytes de cuerpos decodificados; no incluyen cabeceras, compresión de transporte, HTML, fuentes ni imágenes. No deben sumarse como si fueran una medición completa de tráfico celular.

En la primera carga instrumentada de la rama se observaron acceso visual 0,552 s, primera foto lista 0,452 s y verificación 1,553 s; todavía descargó las cuatro páginas completas como corresponde a una copia sin inventario. La primera visita no obtiene el ahorro de delta hasta guardar una copia válida.

La comprobación HTTP separada del dominio dio 200, HTML efectivo de 898.481 bytes, TTFB 5,129 s y total 5,189 s desde el ejecutor. Ese recorrido de red difiere del navegador; no prueba que el servidor tarde cinco segundos para los clientes argentinos. El script principal servido coincidía con el de la base, con adiciones de UX del Worker.

## Validaciones comerciales y técnicas

- Las seis pruebas nuevas pasan: inventario con manuales extra, reparación por ID faltante, delta con altas/bajas conservando precios/fotos, apertura y lectura IndexedDB estancadas, foto rota y recuperación única al original.
- Suite completa: base 12/20 aprobadas, 8 fallidas; rama 18/26 aprobadas, **las mismas 8 fallidas preexistentes**. No se cambiaron expectativas ni se eliminaron tests para forzar un resultado verde. Hay fallos de pruebas de costo inline y del harness de logos (`pid` no definido); requieren revisión separada antes de certificar la suite comercial completa.
- JavaScript inline válido y `git diff --check` sin problemas.
- Comparación de fuente: **22 funciones** de precios, cuotas, promoción, visibilidad/stock, controles de publicación, ficha, compartir y permisos conservan exactamente su implementación de la base. Esta comparación no reemplaza una prueba integral de negocio.
- Prueba de interfaz: ficha de sillón con contado $194.999 y planes 2/4/6; agregar al carrito local con cantidad y total correctos; cerrar y volver; búsqueda `DELHI LICUADORA` con tres resultados; ampliar el original exacto y cerrar; modo oscuro con las tres fotos decodificadas y sus indicadores ocultos. No se enviaron pedidos, mensajes ni ventas.
- No se realizaron escrituras de datos, migraciones, cambios de precios, cambios de stock, eliminación de fotos, modificación de V16 ni despliegues.

## Pendientes que impiden autorizar producción

1. Prueba física en Android con 4G, visita sin caché y reapertura, pérdida de red, regreso de WhatsApp y revisión de stock/precios antes de compartir. Este entorno no ofrece un teléfono Android ni control de throttling de red; el ancho móvil no lo sustituye.
2. Completar GET/decodificación de las URLs cuyo acceso bloqueó el entorno y confirmar recuperación exacta cuando exista un error real. No hay base para asegurar que todas las fotos estén sanas.
3. Revisar las ocho pruebas heredadas y validar en staging los roles de administrador/asesor, guardar cambios y compartir con foto. Las pruebas de esta sesión no escribieron en la base de producción.
4. Decidir miniaturas de catálogo tras verificar capacidad de transformación o un generador autorizado. No se añadieron caché de binarios, service worker ni rutas nuevas. La limpieza antigua de Cache Storage sigue igual; no debe confundirse con la caché HTTP de imágenes o con IndexedDB.
5. Configuración de precios, promociones y formato todavía se consulta en tareas escalonadas, algunas varios segundos después de abrir. No se cambiaron cálculos ni esas reglas en este parche; conviene auditar por separado qué señal habilita compartir frente a esa configuración. El catálogo manual aún se descarga completo: 535.590 bytes en la lectura medida.
6. Sólo después de superar lo anterior, solicitar autorización expresa de Max para fusionar y publicar. Esta rama y un PR borrador no constituyen esa autorización.

## Reproducción del ensayo

Desde el checkout de esta rama:

```bash
node --test tests/performance-cache.test.mjs
node scripts/prepare-performance-audit.mjs /ruta/temporal/fuera-del-repositorio
sites-preview start /ruta/temporal/fuera-del-repositorio
```

Abrir la URL exacta devuelta por el preview con `/audit.html?version=before` y después `?version=after`. Cada variante tiene su propio prefijo de almacenamiento; recargar la misma variante para probar una reapertura. El generador reutiliza las capas visuales del Worker y añade un instrumento de lectura local. El instrumento bloquea métodos de red que puedan escribir, cuenta cuerpos de respuestas y muestra las métricas en la página. No se incorpora al sitio publicado y no emula Android, 4G ni la ejecución del Worker en el borde.

## Reversión

Los cambios viven en commits de la rama de auditoría. No se fusionó ni desplegó. Cada cambio puede revertirse por commit; los originales PNG siguen disponibles. No hay migraciones que revertir. Antes de integrar, actualizar la rama contra el `main` vigente y repetir las verificaciones sobre ese resultado.
