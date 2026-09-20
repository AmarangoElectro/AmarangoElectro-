# Amarango OS V3 — Inventario exacto de campos y ambigüedades

## Fuentes revisadas

1. Checkpoint `AmarangoElectro-V16-Step7R1-Banner-Framing-Fix.zip`.
2. `LEGACY-PRODUCT-SCHEMA.md`, derivado de la auditoría estática de `AmarangoElectro--main.zip`.
3. `AmarangoElectro-V16-AmarangoOS-CRM-Lab-V2.1-ARS.html` y su reporte.

No se encontró en los archivos disponibles un ZIP separado con el esquema persistente del CRM Legacy. Por eso los campos observados en el Lab se consideran evidencia funcional, no nombres definitivos de tablas o columnas.

## Contrato público `Product V16`

Campos exactos presentes en `lib/catalog/types.ts`:

| Campo | Tipo actual | Uso en Product Bridge |
| --- | --- | --- |
| `id` | `string` | ID estable |
| `slug` | `string` | navegación/ficha |
| `name` | `string` | búsqueda y snapshot |
| `brand` | `string` | búsqueda |
| `model` | `string \| null` | búsqueda y snapshot |
| `category` | `string` | búsqueda/clasificación |
| `subcategory` | `string \| null` | búsqueda/clasificación |
| `image` | `{src, alt} \| null` | foto segura/fallback |
| `price` | `{amount, currency: ARS} \| null` | precio vigente ARS |
| `financing` | lista | no se usa en V3 |
| `availability` | disponible/no disponible/desconocido | elegibilidad |
| `stock.status` | en stock/sin stock/desconocido | elegibilidad |
| `stock.quantity` | `number \| null` | solo si el contrato ya lo permite |
| `stock.label` | `string \| null` | presentación honesta |
| `features` | `string[]` | búsqueda de memoria |
| `specifications` | mapa texto→texto | búsqueda de memoria |
| `description` | `string \| null` | no requerido por Nueva Venta |
| `warranty` | `string \| null` | no requerido por Nueva Venta |
| `visible` | `boolean` | filtro fail-closed |
| `source` | mock/legacy-pilot/supabase-readonly | trazabilidad técnica |

El contrato público no contiene costo, proveedor ni fecha de precio. V3 los mantiene en una proyección administrativa separada y protegida por rol.

## `tienda_catalogo` Legacy — campos comprobados en código

### Identidad, publicación y presentación

`id`, `nombre`, `venta`, `categoria`, `categoriaManualProveedor`, `caracteristicas`, `foto`, `fotoManualProveedor`, `visible`, `eliminado`, `sinStock`, `estadoProveedor`, `proveedorStock`, `stockProveedor`, `stock`, `cantidadStock`, `cantidadDisponible`.

### Proveedor, revisión y control administrativo

`automaticoProveedor`, `proveedor`, `proveedorClave`, `proveedorId`, `proveedorCodigo`, `proveedorCategoria`, `categoriaProveedor`, `categoriaManualFijada`, `categoriaAdminActualizada`, `precioProveedorOriginal`, `monedaProveedor`, `cotizacionDolar`, `cotizacionDolarManual`, `usdConvertido`, `fotoProveedor`, `fotoOrigen`, `fotoCatalogoLogo`, `imagenProveedorAprobada`, `ocultoManualProveedor`, `ocultoManualAdmin`, `ocultoPorDuplicado`, `motivoOculto`, `duplicadoGrupo`, `duplicadoPreferido`, `duplicadoCantidad`, `duplicadoSimilitud`, `duplicadoGrupoIgnorado`, `pendienteRevisionManual`, `visibleAntesRevisionManual`, `visibleAntesEliminacion`, `pendienteImagenAdmin`, `precioChequeadoManual`, `estadoManualActualizado`, `estadoRevisionActualizado`, `estadoEliminacionActualizado`, `estadoVisibilidadAdminActualizado`.

### Comercio y temporalidad

`costo`, `mayorista`, `precioAntes`, `sinInteres`, `destacado`, `delDia`, `pocoStock`, `color`, `colores`, `tipo`, `origen`, `creado`, `fechaPrecio`, `precioActualizado`, `proveedorActualizado`, `ultimaSincronizacionProveedor`.

## `celulares_lista` — campos comprobados

`nombre`, `precio`, `colores`, `foto`, `caracteristicas`, `ocultoTienda`, `sinStock`, `usd`, `cotizUsada`, `destacado`, `delDia`, `pocoStock`, `sinInteres`, `precioAntes`.

No existe un ID persistente comprobado en esta fuente; usar una posición de array como identidad definitiva está prohibido.

## Amarango OS CRM Lab V2.1 — campos exactos del producto demo

`id`, `name`, `sale`, `cost`, `supplier`, `updated`, `stock`, `icon`.

V3 trasladó esos cuatro registros existentes a `fixtures/amarango-os-product-bridge-v21-lab.json` y agregó metadatos explícitos de normalización de laboratorio: `brand`, `model`, `memory`, `category`, `subcategory`, `availability`, `visible`, `image`, `source_reference`. Estos metadatos no son evidencia de producción; permiten probar el contrato sin mezclar datos del CRM.

## Evidencia funcional observada en CRM Lab V2.1

### Cliente demo

`id`, `name`, `dni`, `tel`, `status`, `statusLabel`, `medal`, `debt`, `next`, `nextDate`, `purchases`, `last`, `advisor`, `risk`.

### Cobranza demo

`name`, `prod`, `quota`, `date`, `amount`, `status`, `days`.

### Nueva Venta / cálculo demo

Producto seleccionado, cliente, precio de venta, plan, frecuencia, responsables múltiples, con/sin revendedor, nombre del revendedor, descuento, envío, comisión calculada, total cliente, cuota, primera comisión, capital a invertir, ganancia, inversionistas y porcentajes, solicitud de inversión, observaciones y vista previa comercial.

Esos nombres de variables y cálculos pertenecen al Lab. No prueban cómo persiste el CRM Legacy ni autorizan copiar sus fórmulas.

## Campos faltantes o ambiguos

| Tema | Estado V3 | Qué falta confirmar |
| --- | --- | --- |
| Snapshot real del catálogo | faltante | 5–10 productos sanitizados o lectura pública segura |
| Modelo y memoria canónicos | ambiguo | si existen campos reales o deben derivarse del nombre |
| Fecha de precio canónica | ambiguo | prioridad entre `fechaPrecio`, `precioActualizado` y fechas proveedor |
| Costo vigente | privado/ambiguo | moneda, fecha, fuente y permisos |
| Proveedor canónico | ambiguo | `proveedor`, clave, ID o mayorista mostrado |
| Stock canónico | ambiguo | precedencia entre aliases y significado de “A confirmar” |
| Identidad `celulares_lista` | no estable | estrategia de ID persistente o migración a fuente canónica |
| Tablas/IDs del CRM Legacy | faltante | ZIP o exportación técnica del CRM real |
| Cliente duplicado | ambiguo | DNI, teléfono, reglas de unión y correcciones |
| Plan mensual/quincenal | ambiguo | calendario, vencimientos, redondeos, mora y excepciones |
| Comisión | ambiguo | base, porcentaje, pago parcial, descuento y autorización |
| Descuento | ambiguo | límites, responsable y efecto sobre comisión/ganancia |
| Envío | ambiguo | quién lo paga y cómo impacta caja/utilidad |
| Inversiones múltiples | ambiguo | aceptación, aporte parcial, devolución y cierre |
| Capital a invertir | ambiguo | fórmula exacta y orden de descuentos/comisiones/envío |
| Reparto de ganancias | ambiguo | base, porcentajes, pérdidas, redondeo y liquidación |
| Comprobantes | faltante | archivos, metadatos, acceso, conservación y Storage |
| Auditoría | faltante | actor, acción, antes/después y retención |
| Responsables | ambiguo | tipos de responsabilidad y permisos |

V3 muestra `Dato pendiente` o bloquea la acción cuando falta evidencia; no rellena esos campos automáticamente.
