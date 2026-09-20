# AmarangoElectro V16 — Step 7L
## Admin Product Cards + Calculadora AmarangoElectro + Sistema Placas

### Objetivo
Materializar la siguiente capa real del Admin Center sin activar rutas públicas ni escrituras de producción. La prioridad de este checkpoint es conservar la practicidad Legacy por tarjeta, mantener la identidad visual premium V16 y preparar el Admin para más de 1.200 productos.

### Decisiones de producto
- El storefront cliente mantiene su experiencia comercial premium; no adopta la tarjeta administrativa.
- Administración conserva control por tarjeta, con costo, contado, mayorista, semáforo, stock, foto y acciones contextuales.
- Las tarjetas administrativas deben renderizarse de forma incremental en catálogos grandes. El contrato fija 1.200 productos como mínimo soportado y 2.500 como objetivo de diseño.
- Cargar todo el catálogo de tarjetas de una sola vez está explícitamente prohibido.
- Calculadora AmarangoElectro y Sistema Placas son Admin-only y accesos diarios.
- Nuevas categorías pueden incorporarse sin cambiar la arquitectura de filtros/sectores.

### Política Amarango implementada
Versión base: `2026-07-19`.

Markup por costo:
- hasta $50.000: +80 %
- hasta $100.000: +60 %
- hasta $250.000: +50 %
- hasta $350.000: +40 %
- más de $350.000: +30 %

Planes activos:
- 2 cuotas: +15 % directo sobre contado
- 4 cuotas: +55 % directo sobre contado
- 6 cuotas: +78 % directo sobre contado

Redondeos heredados auditados:
- venta: múltiplos de $500
- cuotas: múltiplos de $1.000
- comisiones: múltiplos de $500

La política no se trata como constante pública: queda encapsulada en capa interna, con requisito de versión, auditoría, MFA y autorización de Admin para futuros cambios.

### Calculadora AmarangoElectro
Motor puro y panel interno preparado para:
- costo ARS → venta;
- venta ARS → estimación de costo;
- costo USD × cotización → costo ARS → venta;
- markup automático por tramo;
- markup manual autorizado;
- descuento 0/10/15 %;
- planes 2/4/6;
- ganancia bruta;
- política versionada.

No se importa desde el storefront público.

### Sistema Placas
Se rescató el comportamiento Legacy auditado:
- pegar texto completo del producto;
- modo Costo / Venta / USD;
- cotización editable en USD;
- planes seleccionables;
- 10 % OFF / 15 % OFF;
- detección de nombre y precio;
- salida comercial con contado + cuotas;
- datos de costo/markup separados como información privada Admin.

El texto para compartir nunca incluye costo, mayorista, markup ni cotización privada.

### Tarjetas administrativas
Contrato de tarjeta:
- imagen siempre visible;
- pegar/reemplazar foto;
- descargar/compartir imagen;
- mayorista y categoría visibles;
- costo y contado juntos;
- semáforo visible de un vistazo;
- stock/visibilidad/promociones mediante badges;
- Editar/Copiar/Compartir como acciones primarias;
- Foto/Proveedor/Instagram/Descarga como acciones secundarias;
- Oferta/Destacado/Producto del día/Cuotas/Stock/Visibilidad en contexto.

### Escala 1.200+
`adminCatalogScaleContract`:
- mínimo soportado: 1.200;
- objetivo de diseño: 2.500;
- lote inicial: 36;
- siguiente lote: 36;
- virtualización desde: 120;
- overscan objetivo: 8 tarjetas;
- filtros/búsqueda preservan contexto;
- acciones masivas obligatorias.

### Seguridad
Se mantiene:
- `publicRouteEnabled=false`;
- `productionWritesEnabled=false`;
- `supabaseWritesEnabled=false`;
- Auth real pendiente;
- RLS pendiente;
- MFA Admin pendiente;
- audit log pendiente;
- ninguna nueva ruta `fetch/insert/upsert/update/rpc`.

Los componentes Step 7L viven fuera de `app/` y no son importados por el storefront público.

### Validación
- Tests específicos Step 7L: 4/4.
- Batería acumulada Step 7B → Step 7L: 57/57.
- Preview JavaScript: `node --check` aprobado.
- Los 2 tests funcionales históricos del normalizador Step 7A siguen bloqueados por la ausencia de `zod`/`node_modules` en este entorno; no se contabilizan como aprobados ni como fallas de Step 7L.

### Próximo paso
Recibir las categorías nuevas del usuario y materializar sectores/filtros reales. En paralelo, continuar el Admin operativo: editor por tarjeta, fotos, importación de catálogo/celulares y semáforo sobre snapshot sanitizado, todavía sin escrituras productivas.
