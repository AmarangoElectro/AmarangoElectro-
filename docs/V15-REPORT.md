# AmarangoElectro V15 — informe de integración

## Resumen ejecutivo

### Qué estaba antes

V14 era una vista premium sólida y visualmente aprobada, construida como un único HTML de aproximadamente 100 KB con estilos, datos, navegación y eventos en el mismo archivo. Incluía Home, banners, hubs de categorías, un catálogo piloto de Celulares, búsqueda, filtros, favoritos, compartir y una ficha emergente. Los productos eran familias demostrativas, con representaciones visuales y datos escritos dentro del HTML. No había conexión real a Supabase en los archivos entregados.

### Qué cambió

V15 conserva la dirección visual de V14 pero separa la aplicación en rutas, componentes, contrato de producto, capa de catálogo y lógica de consulta. La Home, los seis universos, Celulares, las fichas individuales, favoritos y compartir funcionan sobre una base extensible. Los campos no disponibles se muestran como pendientes y no se inventan. Supabase queda preparado mediante un adaptador exclusivo de lectura, desactivado hasta auditar el esquema real.

La evolución visual V15.1 mantiene la Home aprobada intacta y concentra la mejora en el catálogo piloto: cada marca de Celulares tiene ahora una dirección cromática propia, las tarjetas y fichas muestran una composición editorial premium mientras faltan las fotografías oficiales y la financiación se comunica con jerarquía y sin promesas comerciales no verificadas.

V15.2 extiende esa madurez a los hubs: los seis universos conservan la identidad Amarango con matices propios, los banners recuperan protagonismo fotográfico y las subcategorías adquieren una jerarquía editorial consistente. En Celulares, elegir Apple, Samsung, Motorola, Xiaomi o Infinix abre el catálogo con la marca correspondiente ya seleccionada.

### Por qué

La separación evita que una acción visual —visitar, buscar, filtrar o abrir una ficha— pueda mezclarse con administración o modificar el catálogo. También permite sustituir los datos simulados por una fuente real sin rediseñar la tienda y replicar el piloto de Celulares al resto de categorías.

### Cómo se comprobó

- compilación de producción completada;
- lint sin errores;
- pruebas automatizadas de render, integridad de V14, responsive y adaptador GET-only;
- navegación visual de Home, Celulares y ficha individual;
- búsqueda por “Motorola” y filtro Samsung verificados;
- acción “Consultar este producto” verificada sin transmisión externa;
- control de ancho en desktop sin desborde horizontal;
- revisión estática de reglas específicas para 320/360/390/412, tablet y desktop.

## 1. Funciones recuperadas

- Identidad visual, paleta azul/naranja/negro, ritmo premium y tono cercano.
- Banner cinematográfico automático con navegación manual y gesto táctil.
- Pausa del banner al interactuar y respeto por `prefers-reduced-motion`.
- Imágenes desktop/mobile de V14.
- Navegación por seis universos.
- Subcategorías y marcas de Celulares.
- Buscador local tolerante a mayúsculas y acentos.
- Filtros por marca.
- Orden por recomendación, marca y nombre.
- Favoritos persistidos localmente por dispositivo.
- Compartir mediante Web Share API con alternativa de portapapeles.
- Ficha de producto premium, ahora como URL individual compartible.
- Lenguaje visual por marca para Apple, Samsung, Motorola, Xiaomi e Infinix.
- Presentación editorial segura cuando todavía no existe una fotografía oficial.
- Render dinámico de la fotografía real en tarjeta y ficha cuando el adaptador la entrega.
- Banda de financiación sobria y explícitamente pendiente de datos validados.
- Hubs con dirección visual diferenciada para los seis universos oficiales.
- Acceso funcional desde las líneas de Celulares al filtro de marca correspondiente.
- Mensajes seguros ante datos ausentes.
- Punto de integración para consulta estructurada.
- Margarita visible sin endpoint inventado.

## 2. Funciones pendientes

- Auditar el esquema real y las RLS de Supabase.
- Crear o aprobar una vista read-only con el contrato V15.
- Mapear campos reales de productos e imágenes.
- Detectar categorías adicionales del catálogo real antes de incorporarlas.
- Reemplazar familias demostrativas por productos reales.
- Conectar financiación, disponibilidad, stock y garantías reales.
- Definir número oficial y política de derivación WhatsApp.
- Conectar Margarita al evento `amarango:consult-product`.
- Migrar autenticación, roles, asesores y administración después de auditarlos en la tienda actual.
- Incorporar escrituras administrativas en una aplicación/capa separada; nunca como efecto de render.

## 3. Bugs y riesgos encontrados en V14 entregada

1. Un solo archivo concentra interfaz, datos, navegación y eventos: eleva el riesgo de regresión.
2. `localStorage` se parseaba sin protección; un valor inválido podía romper la inicialización del catálogo.
3. Las fichas usaban un fallback silencioso a “Samsung Galaxy A” ante una clave desconocida, lo que podía mostrar datos de otro producto.
4. Compartir no incluía URL ni ID interno estructurado.
5. La navegación usaba `history.replaceState` y clases globales sobre `body`, con estados de Home/hub/catálogo difíciles de aislar.
6. Los event listeners de subcategorías se recreaban en cada render del hub.
7. Productos y datos estaban incrustados en el HTML y no tenían contrato tipado.
8. Los botones de consulta solo mostraban un aviso; no existía un payload integrable.
9. No había estados de error de catálogo ni validación de respuesta.
10. V14 no contenía código Supabase, autenticación, roles ni administración; esas funciones no pueden considerarse auditadas con los archivos entregados.

## 4. Cambios realizados

- V14 guardada como checkpoint byte-idéntico.
- Aplicación V15 creada en copia independiente.
- Home reconstruida con los recursos visuales oficiales.
- Rutas reales `/categoria/[slug]` y `/producto/[slug]`.
- Contrato de producto con campos nulos explícitos.
- Adaptador simulado y adaptador Supabase read-only separado.
- Categorías y subcategorías centralizadas.
- Celulares implementado de punta a punta.
- Fichas compartibles con ID, URL, modelo y categoría preparados.
- Favoritos resistentes a almacenamiento corrupto/bloqueado.
- Estados vacíos y fallos seguros.
- Reset seguro de scroll al cambiar de ruta.
- Responsive y performance optimizados sin eliminar movimiento.
- Catálogo y ficha de Celulares refinados con composición visual por marca y jerarquía mobile-first.
- Banners, subcategorías y marcas de los hubs refinados sin modificar la Home aprobada.
- Metadatos V15 y pruebas de regresión.

## 5. Archivos principales modificados

- `app/page.tsx`
- `app/layout.tsx`
- `app/globals.css`
- `app/categoria/[slug]/page.tsx`
- `app/producto/[slug]/page.tsx`
- `app/components/*`
- `lib/catalog/*`
- `lib/commerce/consultation.ts`
- `tests/rendered-html.test.mjs`
- `tests/v15-safety.test.mjs`
- `README.md`
- `docs/*`

Los recursos heredados se copiaron a `public/assets/`; el original V14 quedó en `public/reference/`.

## 6. Pruebas realizadas

- `npm run build`.
- `npm run lint`.
- `npm test`.
- Integridad SHA-256 del ZIP V14.
- Ausencia de métodos HTTP de escritura en el adaptador Supabase.
- Presencia de puntos de quiebre para mobile/tablet/desktop.
- Render del título y promesa de marca.
- Navegación Home → Celulares → ficha.
- Búsqueda “Motorola”.
- Filtro Samsung.
- Acción de consulta preparada.
- Control de desborde horizontal en viewport desktop.
- Revisión estática específica de las nuevas composiciones a 320/360/390/412 px y tablet.
- Revisión visual en navegador del hub de Celulares, control de ancho y navegación Samsung → catálogo filtrado.

## 7. Riesgos pendientes

- Sin acceso al catálogo real no se validaron nombres de tablas, columnas ni categorías adicionales.
- La seguridad final depende de RLS y/o de una vista read-only auditada en Supabase.
- No se migraron administración, roles ni autenticación porque no estaban en V14 ni en los archivos adjuntos.
- Las pruebas visuales mobile se apoyan en reglas responsive verificadas en código; antes de producción conviene una ronda final en Android físico con catálogo e imágenes reales.
- La información demostrativa de Celulares representa familias heredadas de V14, no stock comercial.

## 8. Recomendaciones para V16

1. Auditar en una copia la tienda actualmente productiva y documentar sus contratos reales.
2. Crear una vista `catalog_public_read` o equivalente con solo campos públicos y RLS de lectura.
3. Conectar primero Celulares con 5–10 productos reales de prueba no productivos.
4. Agregar validación de respuesta con esquema estricto antes de renderizar.
5. Medir LCP, CLS, INP y memoria en Android físico.
6. Replicar el patrón de Celulares a Audio y Electrodomésticos.
7. Mantener administración y escrituras en un límite técnico separado.
8. Integrar WhatsApp/Margarita únicamente con número y endpoint oficiales.
