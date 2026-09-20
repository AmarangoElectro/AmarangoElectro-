# Matriz de migración legacy — Step 7

Clasificación provisional basada en el ZIP auditado. “Reutilizar” significa rescatar contrato o lógica, no copiar el archivo viejo. Ninguna fila autoriza activar Supabase o administración.

| FUNCIÓN LEGACY | REUTILIZAR | REESCRIBIR | DESCARTAR | PENDIENTE DE AUDITORÍA | EVIDENCIA / DECISIÓN |
|---|:---:|:---:|:---:|:---:|---|
| Lectura `tienda_catalogo/catalogo` | Sí | — | — | — | rescatar forma `datos[]`; acceso real aún no activado |
| Lectura `celulares_lista/lista` | Sí | — | — | — | contrato separado encapsulado en adaptador |
| Fuente canónica de celulares | — | — | — | Sí | faltan snapshots para medir cobertura y duplicados |
| `tienda_productos_incremental` | — | — | — | Sí | eficiente, pero no incluye celulares ni tiene RLS auditada |
| Descarga/caché en `src/worker.mjs` | Sí | — | — | Sí | GET/HEAD útil; requiere revisar entorno y permisos antes de reutilizar |
| Sincronización de proveedores | — | Sí | — | — | es administrativa y muta precio/stock/visibilidad |
| Guardado completo desde frontend | — | — | Sí | — | mezcla catálogo y decisiones comerciales en cliente |
| Normalización Legacy → Product | Sí | — | — | — | implementada en capa aislada con validación y diagnósticos |
| Regla pública de visibilidad | Sí | — | — | — | reimplementada como función pura, sin mutación |
| Stock/disponibilidad | Sí | — | — | Sí | se rescata exclusión; cantidad pública y fuente final pendientes |
| Precio `venta` / `precio` | Sí | — | — | Sí | mapeo listo; falta snapshot real y vigencia |
| Costo/mayorista/proveedor | — | — | Sí | — | no debe entrar al contrato público |
| Categorías | — | Sí | — | Sí | mapa inicial explícito; catálogo adicional pendiente |
| Marca de celulares | Sí | — | — | — | inferencia limitada desde nombre, como en legacy |
| Modelo explícito | — | — | — | Sí | no existe campo canónico comprobado; queda `null` |
| Buscador | Sí | — | — | — | normalización/ranking rescatados en módulo puro |
| Sinónimos globales legacy | — | Sí | — | Sí | revisar por categoría; no copiar diccionario monolítico |
| Filtro por marca | Sí | — | — | — | activo en Celulares |
| Filtro disponibilidad | Sí | — | — | Sí | contrato listo; UI espera dato fiable |
| Filtro precio máximo | Sí | — | — | Sí | contrato listo; UI espera precios reales |
| Orden por nombre/marca/relevancia | Sí | — | — | — | activo y puro |
| Paginación por lotes | Sí | — | — | Sí | concepto útil cuando el snapshot permita medir volumen |
| Ficha de producto | — | Sí | — | — | diseño V16 conservado; campos reales graduales |
| Productos relacionados aleatorios | — | Sí | — | — | misma categoría es útil; aleatoriedad y filtro incompleto se descartan |
| Visitas simuladas | — | — | Sí | — | dato inventado |
| Imagen principal HTTPS | Sí | — | — | — | mapeo seguro; protocolo no seguro se rechaza |
| Bucket `tienda-fotos` | — | — | — | Sí | faltan políticas/RLS y muestra de rutas |
| Upload de fotos desde storefront | — | — | Sí | — | prohibido; administración futura separada |
| Financiación/planes | — | Sí | — | Sí | fórmulas documentadas, política vigente no confirmada |
| `sinInteres` y `precioAntes` | — | — | — | Sí | no se muestran hasta validar vigencia y responsable |
| Favoritos locales V16 | Sí | — | — | — | se mantienen; no crean tablas |
| Compartir producto individual | Sí | — | — | — | Web Share + clipboard limpio, URL `/producto/[slug]` |
| Compartir imagen | — | — | — | Sí | fuera de esta fase |
| Compartir múltiples/Instagram | — | — | — | Sí | fuera de esta fase |
| Consulta estructurada V16 | Sí | — | — | — | ID, nombre, modelo, categoría y URL; sin endpoint |
| WhatsApp definitivo | — | — | — | Sí | falta número y decisión de integración |
| Margarita / IA / Workers | — | — | — | Sí | **PENDIENTE — NO MIGRAR TODAVÍA** |
| Login/autenticación legacy | — | Sí | — | Sí | PIN/flags locales no son seguridad; falta Auth real |
| Roles cliente/asesor/admin | — | Sí | — | Sí | autorización no verificable; futura app separada |
| Bandejas admin | Sí | Sí | — | — | rescatar conceptos, reescribir consultas/acciones explícitas |
| Mutación/publicación durante render admin | — | — | Sí | — | riesgo crítico confirmado |
| Edición de catálogo | — | Sí | — | Sí | no se integra en storefront |
| Historial, clientes y ventas | — | Sí | — | Sí | faltan esquema, privacidad y permisos |
| Manejo de errores silenciosos | — | Sí | — | — | promesas/catches vacíos deben reemplazarse por estados observables |

## Regla de avance

Una fila “Pendiente” solo cambia cuando existe snapshot/contrato sanitizado, prueba automática, revisión de seguridad y checkpoint independiente. La próxima evidencia requerida para el piloto real es una exportación de 5–10 celulares de ambas fuentes, sin datos personales ni credenciales.
