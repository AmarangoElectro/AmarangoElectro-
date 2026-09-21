# V16 — PROVIDER OFFERS + ADVISOR FRESHNESS + IDENTITY CHECKPOINT — 2026-09-20

Branch: `agent/chatgpt-v16`

## Implementado

### 1. Producto canónico / ofertas de mayoristas

Se agregó una proyección interna read-only de las 553 filas visibles con precio:

`fixtures/v16-internal-provider-offers-20260920.json`

Campos internos preservados:
- sourceProductId
- nombre
- categoría origen
- proveedor/mayorista normalizado
- código proveedor
- precio de venta
- foto
- disponibilidad
- fecha de actualización

No incluye costo ni credenciales.

Distribución de origen:
- Mega Electro: 365
- Electro Impacto: 133
- Women: 3
- Stagliano: 5
- SofJ: 1
- Origen sin identificar: 46

### 2. Matcher conservador

`lib/internal/catalog/provider-offer-matcher.ts`

Señales utilizadas:
- similitud de nombre
- marca detectada
- tokens de modelo
- compatibilidad de código proveedor
- categoría
- conflictos de capacidad/medida/modelo
- comparación visual marcada como pendiente cuando ambas ofertas tienen foto

Regla dura:
**ninguna coincidencia se fusiona automáticamente.**

Toda coincidencia candidata requiere revisión humana.

Cola conservadora actual detectada: 5 pares principales tras rechazar variantes incompatibles.

Incluye:
- Noblex 58" Mega vs Electro Impacto
- TCL Lavarropas 8 kg Mega vs Electro Impacto
- Kanjihome/Kanji Lavasecarropas 6 kg
- Balanza Kretz con mismo nombre y precios distintos
- Set accesorios baño duplicado por códigos diferentes

### 3. Revisión humana

Ruta protegida:

`/administracion/catalogo/coincidencias`

Opciones:
- Sí, es el mismo producto
- No, son distintos
- Revisar después

Las decisiones de este gate se guardan únicamente en localStorage.
Todavía no se escriben en Supabase.

Se muestran las dos fotos lado a lado cuando existen, proveedor, código, precio y una oferta/precio sugerido.

### 4. Precio sugerido

Dentro de un candidato:
1. prioriza ofertas disponibles;
2. toma el precio de venta menor;
3. si empatan, prioriza la más recientemente actualizada.

Esto es una sugerencia interna, no una publicación automática.

### 5. Semáforo para asesores

Se agregó snapshot sanitizado:

`fixtures/v16-advisor-freshness-sanitized-20260920.json`

No contiene proveedor ni costos.

Modos:
- automatic: 498
- manual: 9
- unknown: 46

Los asesores ven:
- Precio actualizado hoy / hace N días.
- Fuente automática de stock actualizada hoy / hace N días cuando existe feed automático.
- Stock sin confirmación automática cuando no existe esa autoridad.

Semáforo:
- 0–3 días: fresco
- 4–7 días: reciente
- 8–14 días: envejeciendo
- >14 días: antiguo
- sin fecha: desconocido

No se afirma “stock confirmado” cuando solo existe una fecha de actualización de fuente.

### 6. Identidad / sesión

Las pantallas internas ahora muestran el nombre de la sesión ChatGPT ya autenticada.

- Administración: reconoce la sesión sin pedir un login adicional.
- Mi Amarango / Asesores: reconoce la sesión sin pedir un login adicional.
- Home: consulta la sesión de forma silenciosa.
- Clientes no autenticados: ya no ven enlaces de Administración/Asesores en el drawer público.
- Usuario interno autenticado: ve “Sesión reconocida” y sus accesos internos.

Esto no reemplaza todavía el futuro gate de autorización por capacidades de `v16_user_access`.

### 7. Seguridad

- Supabase: solo lectura.
- Sin writes.
- Sin main.
- Sin integration.
- Sin producción.
- Sin deploy.
- No se tocó `agent/work-v16`.
- No se persisten decisiones de matching en servidor todavía.

## Próximos gates recomendados

1. Persistencia segura de decisiones de matching en Supabase.
2. Servicio real de fingerprint/embedding visual para comparar imágenes automáticamente.
3. Propagación de proveedor recomendado al Admin sin exponerlo a Asesor/Cliente.
4. Capabilities reales por sesión usando `v16_user_access`.
5. QA build + suite + preview antes de integrar.
