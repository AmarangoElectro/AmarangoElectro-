# V16 — BRAND QUALITY + ADVISOR SALES TOOLS CHECKPOINT — 2026-09-21

Branch: `agent/chatgpt-v16`

## Trabajo adelantado mientras Work continúa con banners / storefront

### 1. Limpieza de marcas

Se corrigieron asignaciones de marca de alta confianza sin tocar UI.

Casos destacados:
- `VENTILADOR Martin & Martin ... PULGADAS`: dejó de quedar falsamente como LG.
- Productos con palabras como `Bomba`: dejaron de caer falsamente como marca OM.
- `EUROTECH`: reconocido como Eurotech.
- `LÜQSTOFF / Lusqtoff`: consolidado como Lusqtoff.
- `Kanji Home / Kanjihome / Kanihome`: consolidado como Kanjihome cuando el nombre lo respalda.
- Se incorporaron marcas literales claras: Westinghouse, Fedders, Usman Win, Axel, KTO, OSR y Trendy.

Resultado:
- `Varios`: 90 → 83
- Kanjihome: 10 productos agrupados
- Lusqtoff: 11 productos agrupados
- LG: 6 productos válidos
- OM: 4 productos con OM explícito

### 2. Modelos de alta confianza

Se agregaron modelos únicamente cuando aparecen de forma inequívoca en el nombre, por ejemplo:
- CMF1000SO
- AX3000
- AT211PB
- ATL710-8
- HE-010
- ARC230
- IRON180
- MEGAIRON 140
- SC4622
- X9

No se inventaron modelos.

### 3. Normalizador preventivo

Nuevo:
`lib/catalog/brand-normalization.ts`

Reglas conservadoras para futuras importaciones:
- evita que marcas cortas como LG u OM coincidan dentro de palabras;
- prioriza sub-marcas específicas antes que marcas generales;
- normaliza aliases claros de Kanjihome, Kanji Tools, Lusqtoff, etc.

El matcher de ofertas de mayoristas ahora reutiliza este normalizador.

### 4. Motor de ayuda para asesores

Nuevo:
`lib/advisor/sales-assistant.ts`

Prepara sin tocar la UI:
- ficha rápida de producto;
- propuesta lista para WhatsApp;
- comparación de hasta 3 productos;
- alternativas recomendadas del mismo sector/subcategoría;
- consideración de precio, financiación, disponibilidad y antigüedad de actualización.

Contrato:
- no expone proveedor;
- no expone costo;
- no expone margen;
- stock sigue requiriendo validación humana al cerrar la venta.

### 5. Seguridad / convivencia con Work

Delta desde el checkpoint previo:
- 0 archivos eliminados
- 0 archivos de `app/` tocados
- 0 componentes visuales tocados
- 0 CSS tocado
- 0 assets/banners tocados
- Supabase: sin escrituras
- main: intacta
- integration: intacta
- agent/work-v16: intacta

## Próximo paso sugerido

Cuando Work termine su frente visual:
1. exponer el comparador y la propuesta WhatsApp dentro de Mi Amarango;
2. mostrar alternativas sugeridas cuando stock/precio estén viejos;
3. continuar reduciendo `Varios` solo con evidencia clara;
4. conectar revisión humana persistente de productos equivalentes cuando se autorice escritura segura.
