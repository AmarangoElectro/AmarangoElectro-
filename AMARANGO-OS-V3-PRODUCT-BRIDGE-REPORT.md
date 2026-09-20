# AmarangoElectro V16 — Amarango OS V3 Product Bridge

## Resumen ejecutivo

V3 prepara la primera unión técnica entre la tienda V16 y Amarango OS sin conectar producción. Se agregó un adaptador de lectura que consume el contrato `Product V16`, aplica visibilidad fail-closed, busca por nombre/modelo/memoria/categoría/marca y entrega una proyección segura para Nueva Venta.

El CRM no contiene ni mantiene una copia paralela del catálogo. Para el preview se usa un fixture aislado con los cuatro productos demo que ya existían en CRM Lab V2.1. El cambio futuro al snapshot real requiere reemplazar el adaptador inyectado, no reescribir la interfaz.

## Qué cambió

- `ReadOnlyProductBridge` con métodos exclusivos `list`, `search` y `getById`.
- Separación entre `Product V16` público y metadatos administrativos de costo/proveedor/fecha.
- Autorización de costo y proveedor basada en capacidades de rol.
- Búsqueda tolerante a acentos y mayúsculas, con coincidencia numérica exacta.
- Nueva ruta `/amarango-os` con experiencia APP responsive y Nueva Venta en modo laboratorio.
- Formato monetario ARS completo; no se usan `M` ni `k`.
- Fallback explícito para producto sin foto.
- Estado `review_required` para precio/stock desconocido y `unavailable` para agotados.
- Contrato puro e inmutable de snapshot histórico.
- Data Contract documental para clientes, ventas, sale_items, cuotas, pagos, revendedores, comisiones, responsables, inversiones, caja, entregas, comprobantes y auditoría.

## Seguridad

- Sin acceso a Supabase real.
- Sin nuevas credenciales.
- Sin service role.
- Sin SQL, migraciones o cambios RLS.
- Sin operaciones de red dentro del Product Bridge.
- Sin métodos de escritura.
- Sin datos de clientes, ventas o cobranzas reales.
- El botón de confirmación permanece bloqueado.
- Margarita y WhatsApp no fueron tocados.

## Compatibilidad preservada

La capa documental mantiene como dominios explícitos: revendedor, comisión, descuento, envío, mensual/quincenal, inversionistas múltiples, porcentajes, capital a invertir, reparto de ganancias, solicitud de inversión, comprobantes, pagos/cuotas, observaciones y responsables múltiples.

No se copiaron fórmulas del Lab como reglas definitivas. Falta el esquema/código persistente del CRM Legacy para confirmar cálculos y nombres físicos.

## Evidencia de datos

- Checkpoint V16 Step 7R.1: contrato `Product`, normalizador Legacy y catálogo mock.
- CRM Lab V2.1: cuatro productos demo y experiencia Nueva Venta.
- Auditoría Legacy de tienda: campos de `tienda_catalogo` y `celulares_lista`.
- Snapshot real de catálogo: no disponible en esta etapa.

## QA ejecutado

| Control | Resultado |
|---|---|
| Lint | Aprobado (`npm run lint`) |
| Build | Aprobado (`npm run build`) |
| Tests acumulados | 121/121 aprobados |
| Tests nuevos V3 | 8/8 aprobados |
| Ruta construida | `/amarango-os` incluida en el build |
| Búsqueda `A16` | 2 coincidencias exactas: 128 GB y 256 GB |
| Colisión `A17`/`A16` | Aislada: `A17` no devuelve `A16` |
| Marca/categoría/memoria/acentos | Aprobado |
| Sin costo/foto/stock | Estados honestos y sin invención |
| Permisos | costo/proveedor visibles para `admin`; ocultos para `advisor` |
| Snapshot | `amarango-sale-item/v1`, congelado e independiente de cambios posteriores |
| Escrituras/red | sin `insert`, `update`, `upsert`, `delete`, RPC, métodos HTTP de escritura ni `fetch` en la integración |
| Controles Android | sin `<select>` ni `<dialog>` nativos |
| Moneda | ARS completo mediante `Intl.NumberFormat("es-AR")` |
| Responsive | breakpoints y contención validados para 320/360/390/412, tablet y desktop |
| Overflow | `overflow-x: clip`, grillas `minmax(0,1fr)` y reducción específica de topbar en 320/360 |
| Preview | HTML autocontenido generado; inicia en Amarango OS y conserva selector de storefront completo |

### Revisión visual interactiva

Se recorrió la ruta real en navegador desktop: búsqueda, múltiples coincidencias, cambio de producto, precio ARS, costo/proveedor, fallback sin foto, disponibilidad, snapshot y bloqueo de confirmación. No aparecieron errores de la aplicación; los únicos mensajes de consola provenían de la extensión del navegador de QA.

El navegador de revisión no permitió emular viewports angostos. Por eso 320/360/390/412 se verificaron mediante las reglas responsive y tests de regresión, no mediante captura pixel-by-pixel de esta ruta nueva. El framing general de la tienda conserva además las pruebas responsive aprobadas de Step 7R.1.

### Incidencias encontradas y corregidas durante QA

1. La primera ejecución de los ocho tests V3 falló en cuatro controles nuevos: un constructor TypeScript incompatible con el modo strip-only de Node, un falso positivo del escáner sobre `Set.delete`, una etiqueta documental faltante y una aserción de acentos fuera de los campos buscables. Se corrigieron las cuatro causas y la repetición final quedó 8/8.
2. El preview inyectaba el CSS global del storefront después del CSS propio de Amarango OS, con riesgo de colisiones visuales. Ahora el panel OS conserva su CSS aislado; el CSS compartido sólo se inyecta en las vistas de tienda.
3. La topbar podía quedar demasiado exigida en 320 px. Se agregó contracción segura, elipsis y ajustes específicos 360/320 sin cambiar desktop.

## Riesgos pendientes

1. No existe todavía snapshot sanitizado real del catálogo.
2. No se localizó un ZIP separado del CRM Legacy persistente; V2.1 aporta evidencia funcional, no esquema definitivo.
3. Modelo/memoria, fecha de precio, costo, proveedor y stock necesitan precedencias canónicas.
4. No están auditadas las reglas reales de planes, comisiones, descuentos, envíos e inversiones.
5. La autorización de servidor y persistencia se diseñarán recién cuando se habilite una fase con datos de prueba controlados.
6. Queda pendiente una revisión visual pixel-by-pixel de `/amarango-os` en dispositivos físicos Android; el control estructural responsive sí quedó automatizado.

## Próximo paso recomendado

Auditar un snapshot sanitizado real de 5–10 productos y el ZIP del CRM Legacy. Después reemplazar el fixture por la lectura segura, comparar resultados y recién entonces diseñar tablas/migraciones en un entorno no productivo.
