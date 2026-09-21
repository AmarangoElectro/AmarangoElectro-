# V16 — PHOTO FRAMING + 90 CELLPHONE PHOTOS + ELECTRO ROUTING — 2026-09-21

Branch: `agent/chatgpt-v16`

## Resultado

### Product cards / encuadre
Se agregó un hard gate de presentación para las cards:
- `object-fit: contain !important`
- `object-position: center center !important`
- sin zoom/scale al hover
- padding reducido
- mobile: relación 3:4 para respetar flyers verticales y fotos de producto

Objetivo: nunca recortar títulos, logos ni el producto dentro de fotos/flyers de proveedor.

No se editaron los archivos de imagen originales.

### 90 celulares
Fuente read-only:
`public.celulares_lista` (`lista` + `banco_fotos`).

Resultado:
- 90/90 canonical phones con URL HTTPS de imagen.
- 74 coincidencias directas por nombre normalizado desde `lista`.
- 16 completadas desde `banco_fotos`.
- 0 celulares sin imagen.
- 0 imágenes duplicadas dentro de la cohorte.

La cohorte sigue:
- `visible: false`
- aislada del composite público
- sin precio materializado por este gate
- sin activación en Home / búsqueda / categoría pública
- sin escritura a Supabase

### Electrodomésticos
Se auditó la cohorte completa de 224 electrodomésticos contra los seis subsectores V16.

Todos quedan en un subsector válido:
- Pequeños electrodomésticos: 65
- Refrigeración: 47
- Climatización: 42
- Lavado: 33
- Cocción: 24
- Limpieza: 13

Correcciones nuevas:
- Aspiradora industrial Black & Decker → Limpieza
- Telefunken Smart Wash 550 lim/asp → Limpieza

No se cambió visibilidad.

## Seguridad
- main intacta
- integration intacta
- producción intacta
- Supabase sin writes
- agent/work-v16 intacta
- 0 archivos eliminados

## Próximo gate
Validar el encuadre en preview móvil/desktop y luego decidir por separado qué celulares/electros se hacen visibles.
