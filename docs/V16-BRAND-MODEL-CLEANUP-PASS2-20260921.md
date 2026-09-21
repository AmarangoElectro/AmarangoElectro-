# V16 — BRAND + MODEL CLEANUP PASS 2 — 2026-09-21

Branch: `agent/chatgpt-v16`

## Resultado medido

- Productos del snapshot actual: **553**
- Marca identificada: **479**
- `Varios`: **74**
- Cobertura de marca: **86,6%**
- Modelo estructurado: **130**
- Cobertura de modelo: **23,5%**

Punto de partida de esta línea de limpieza:
- `Varios`: 90
- Modelos estructurados: 0

## Correcciones nuevas de alta confianza

Verificadas por nombre/código y, cuando hizo falta, por fuentes públicas:

- Telefunken — Smart Wash 550
- Ultracomb — SC4622
- Gamma — G12417AR
- Gamma — ARC230 (marca confirmada; se conserva la denominación de origen como modelo de catálogo)
- 3o3 — SG NR 01
- Oryx — OR-SA01
- Konan — KGH253
- Ultracomb — FR-8700G
- Gamma — G12600AR

## Extracción de modelos

Se agregó `lib/catalog/model-normalization.ts`.

Reglas:
- solo lee el nombre público del producto;
- no convierte el código del mayorista en modelo automáticamente;
- evita capacidades, dimensiones y cantidades;
- evita inferir `ROD29`, `24PZAS`, litros, kilos, watts, etc. como modelos;
- acepta códigos alfanuméricos fuertes presentes literalmente en el nombre.

## Decisión conservadora

Los **74 productos restantes en Varios permanecen así** cuando el nombre y la evidencia disponible no permiten asegurar la marca.

Ejemplos que NO se forzaron:
- Heladera Top Mount cíclica 240 L gris con dispenser
- Amoladora Angular 500 W
- Bombas 0.5 HP / 0.75 HP
- escalera plegable
- textiles genéricos
- bazar genérico
- juguetes sin marca inequívoca

Que un producto se parezca a un artículo conocido no alcanza para asignar la marca.

## Convivencia

Este pase no modifica:
- `app/`
- componentes visuales
- CSS
- banners
- assets
- Supabase
- main
- integration
- `agent/work-v16`

Solo se trabajó en datos sanitizados, normalizadores y tests.
