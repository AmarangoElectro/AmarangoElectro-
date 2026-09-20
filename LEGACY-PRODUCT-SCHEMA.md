# Esquema de producto legacy auditado

## Alcance y evidencia

Este mapa proviene del análisis estático de `AmarangoElectro--main.zip`, SHA-256 `49aeb962b14216c2d1e26820e1cf8771a2cf85bf487847b55456ebf47f9e4005`, asociado en el ZIP al commit `1e4641e93a371f7315768379e6de563f90f58179`. La aplicación legacy no fue ejecutada y no se consultó Supabase.

El ZIP contiene contratos y lógica, pero no una exportación de `tienda_catalogo` ni `celulares_lista`. Por eso este documento distingue campos comprobados en código de campos que todavía no tienen evidencia de datos reales.

## Fuentes y forma general

| Fuente | Forma comprobada | Identidad | Estado |
|---|---|---|---|
| `tienda_catalogo` | fila `id = catalogo`, `datos = ProductLegacy[]` | `producto.id` persistido | catálogo principal histórico |
| `celulares_lista` | fila `id = lista`, `datos = CelularLegacy[]` | no tiene ID persistido comprobado; legacy generaba `celu_<índice>` | fuente histórica separada de celulares |
| `tienda_productos_incremental` | filas `producto_id`, `datos`, `eliminado`, `version`, `actualizado` | `producto_id` | espejo incremental de `tienda_catalogo`; no incluye `celulares_lista` |

## `tienda_catalogo`: identidad y contenido público

| Campo legacy | Significado comprobado | Destino V16 Step 7 | Clasificación |
|---|---|---|---|
| `id` | identidad persistida y clave de ediciones/tombstones | `Product.id`, prefijado `legacy-catalog:` | público/técnico |
| `nombre` | nombre mostrado, buscado y compartido | `Product.name` | público |
| `venta` | precio de venta usado por tarjetas, ficha y cuotas | `Product.price.amount`, ARS | público |
| `categoria` | categoría usada para navegación y relacionados | `Product.category`, mediante mapa explícito | público |
| `categoriaManualProveedor` | corrección manual con prioridad sobre la categoría base | entrada prioritaria del mapa de categoría | administrativo con efecto público |
| `caracteristicas` | texto libre mostrado en ficha y usado como refuerzo de búsqueda | `Product.features[]` | público |
| `foto` | imagen mostrada/compartida | `Product.image.src`, solo HTTPS | público |
| `fotoManualProveedor` | foto de Amarango que debe prevalecer sobre la del proveedor | primera opción para `Product.image.src` | administrativo con efecto público |
| `visible` | publicación explícita; el filtro público exige `true` | condición pura; V16 nunca la modifica | administrativo con efecto público |
| `eliminado` | tombstone/papelera | exclusión pura | administrativo |
| `sinStock` | marca explícita de agotado | exclusión pura | público derivado/administrativo |
| `estadoProveedor` | estado de proveedor; `sin_stock` excluye | condición pura de disponibilidad | administrativo con efecto público |
| `proveedorStock` | stock informado por sincronización | deriva disponible/no disponible; la cantidad no se expone | privado/administrativo |
| `stockProveedor`, `stock`, `cantidadStock`, `cantidadDisponible` | aliases históricos leídos por compatibilidad | misma derivación, sin exponer cantidad | privado/administrativo |

## `tienda_catalogo`: proveedor, revisión y visibilidad

| Campo legacy | Significado comprobado | Destino V16 Step 7 | Clasificación |
|---|---|---|---|
| `automaticoProveedor` | diferencia producto sincronizado de manual | no se expone; solo auditoría | administrativo |
| `proveedor`, `proveedorClave`, `proveedorId`, `proveedorCodigo` | identidad del proveedor y del registro origen | no se expone | privado/administrativo |
| `proveedorCategoria`, `categoriaProveedor` | clasificación proveniente del proveedor | pendiente para normalización futura | administrativo |
| `categoriaManualFijada`, `categoriaAdminActualizada` | control de reclasificación manual | no se expone | administrativo |
| `precioProveedorOriginal`, `monedaProveedor` | costo/precio original y moneda del proveedor | no se expone | privado/comercial |
| `cotizacionDolar`, `cotizacionDolarManual`, `usdConvertido` | conversión histórica de costo | no se expone ni recalcula | privado/comercial |
| `fotoProveedor` | imagen origen del proveedor | no se prioriza en Step 7 | administrativo |
| `fotoOrigen`, `fotoCatalogoLogo`, `imagenProveedorAprobada` | procedencia, branding y aprobación de imagen | pendiente de auditoría de imágenes | administrativo |
| `ocultoManualProveedor` | ocultamiento manual persistido | exclusión pura | administrativo |
| `ocultoManualAdmin` | decisión manual del administrador | exclusión pura y defensiva | administrativo |
| `ocultoPorDuplicado` | exclusión por duplicado confirmado | exclusión pura | administrativo |
| `motivoOculto` | motivo calculado/persistido de ocultamiento | solo diagnóstico; no decide por sí solo | administrativo |
| `duplicadoGrupo`, `duplicadoPreferido`, `duplicadoCantidad`, `duplicadoSimilitud`, `duplicadoGrupoIgnorado` | agrupación y selección histórica de duplicados | diagnóstico; no se muta ni resuelve automáticamente | administrativo |
| `pendienteRevisionManual` | marca de revisión de precio manual | no se publica si `visible` ya está en `false`; no se altera | administrativo |
| `visibleAntesRevisionManual` | estado previo a revisión | no se expone | administrativo |
| `visibleAntesEliminacion` | estado previo a papelera | no se expone | administrativo |
| `pendienteImagenAdmin` | revisión de imagen | no se expone | administrativo |
| `precioChequeadoManual` | confirmación manual de vigencia | pendiente para política de publicación | administrativo |
| `estadoManualActualizado`, `estadoRevisionActualizado`, `estadoEliminacionActualizado`, `estadoVisibilidadAdminActualizado` | control de concurrencia/confirmación | no se expone | administrativo |

## `tienda_catalogo`: comercio y presentación

| Campo legacy | Significado comprobado | Destino V16 Step 7 | Clasificación |
|---|---|---|---|
| `costo` | costo interno usado por calculadoras y sincronización | prohibido en `Product` público | privado/comercial |
| `mayorista` | valor mayorista | no se expone | privado/comercial |
| `precioAntes` | precio anterior/tachado | pendiente de política comercial | público condicionado |
| `sinInteres` | número especial de cuotas sin interés | documentado; no migrado | público condicionado |
| `destacado` | orden/presentación destacada | pendiente de reglas canónicas | administrativo con efecto público |
| `delDia` | producto del día | no migrado | administrativo con efecto público |
| `pocoStock` | etiqueta comercial de stock limitado | no migrada sin fuente fiable | público condicionado |
| `color`, `colores` | variante/color en algunas rutas | pendiente de modelo de variantes | público condicionado |
| `tipo`, `origen` | metadatos históricos de creación/importación | no se exponen | administrativo |
| `creado`, `fechaPrecio`, `precioActualizado`, `proveedorActualizado`, `ultimaSincronizacionProveedor` | fechas usadas para orden/vigencia/sync | pendientes de contrato temporal | administrativo |

## `celulares_lista`

| Campo legacy | Significado comprobado | Destino V16 Step 7 | Clasificación |
|---|---|---|---|
| `nombre` | nombre completo; legacy también deriva marca desde aquí | `Product.name`; marca inferida solo para Apple, Samsung, Motorola, Xiaomi e Infinix | público |
| `precio` | precio público | `Product.price.amount`, ARS | público |
| `colores` | lista de colores | `Product.specifications.Colores` | público |
| `foto` | imagen | `Product.image.src`, solo HTTPS | público |
| `caracteristicas` | texto libre de características | `Product.features[]` | público |
| `ocultoTienda` | ocultamiento de la lista | exclusión pura | administrativo |
| `sinStock` | agotado | exclusión pura | público derivado/administrativo |
| `usd`, `cotizUsada` | conversión histórica del precio | no se expone ni recalcula | privado/comercial |
| `destacado`, `delDia`, `pocoStock` | presentación/promoción | pendiente | administrativo con efecto público |
| `sinInteres`, `precioAntes` | financiación/oferta | documentado, no migrado | público condicionado |

## Campos solicitados sin evidencia canónica

La auditoría no encontró uso de `producto.marca`, `producto.modelo`, `producto.descripcion`, `producto.garantia` ni `producto.especificaciones` como campos canónicos del producto legacy. La marca de celulares se deriva del nombre y el modelo suele formar parte de `nombre`. En Step 7:

- `Product.brand` solo se deriva de marcas reconocibles en el nombre;
- `Product.model`, `description` y `warranty` quedan en `null`;
- `Product.specifications` solo recibe `Colores` cuando viene de `celulares_lista`;
- no se extraen modelos ni garantías por heurística.

## Contrato público mínimo aceptado por el piloto

Para entrar al piloto un producto debe tener identidad/nombre, precio público positivo, categoría y marca verificables, imagen HTTPS opcional y cumplir la regla de visibilidad/stock. La financiación siempre queda vacía hasta validar política comercial. Los registros rechazados quedan en diagnósticos; el adaptador no los modifica ni los guarda.
