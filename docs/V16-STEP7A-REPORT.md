# AmarangoElectro V16 Step 7A — Snapshot Gate

## Resumen

Este checkpoint deriva exclusivamente de `AmarangoElectro-V16-Step7-Legacy-Catalog-Pilot.zip`. No modifica el ZIP Legacy, producción, `main`, Supabase, RLS, Storage ni funciones administrativas.

El objetivo fue cerrar dos riesgos antes de recibir datos reales:

1. impedir que un futuro snapshot transporte campos privados o desconocidos hacia la capa pública;
2. mejorar la cobertura de marcas y el diagnóstico de duplicados sin ocultar ni eliminar registros.

## Cambios

- Nuevo `lib/catalog/legacy/legacy-snapshot-sanitizer.ts`.
- `LegacyCatalogAdapter` sanitiza y congela el snapshot antes de normalizarlo.
- Allowlist separada para `tienda_catalogo` y `celulares_lista`.
- Campos desconocidos o internos como `costo`, `mayorista`, `proveedor`, tokens u otras claves no permitidas se descartan en la frontera de ingreso.
- Detección de marcas de celulares ampliada de acuerdo con familias ya presentes en la lógica Legacy auditada: Nokia, Honor, TCL, ZTE, Realme, Huawei, Alcatel, LG, Oppo y Vivo, además de las cinco ya soportadas.
- Diagnóstico de duplicados más conservador para alias como `Moto`/`Motorola`, `Samsung`/`Galaxy` y `Apple`/`iPhone`.
- Los duplicados siguen siendo únicamente diagnósticos: no se oculta, borra ni prioriza ningún registro automáticamente.
- Se agregaron tests específicos de Step 7A.

## Seguridad

- El storefront continúa usando `MockCatalogAdapter`.
- No se ejecutó la aplicación Legacy.
- No se consultó Supabase.
- No se ejecutó SQL.
- No existe `fetch` en la capa Legacy nueva/modificada.
- No existen llamadas `insert`, `upsert`, `update`, `delete` o `rpc` en la capa Legacy nueva/modificada.
- No se agregaron credenciales ni variables Supabase.
- Margarita, IA, Workers, prompts, WhatsApp y webhooks siguen **PENDIENTE — NO MIGRAR TODAVÍA**.

## Validación realizada

- Prueba directa del nuevo snapshot gate con Node: **PASS**.
- Verificado que la entrada original no se muta.
- Verificado que campos privados/desconocidos son removidos.
- Verificado que campos públicos necesarios sobreviven.
- Verificado que la salida queda congelada.
- Escaneo estático de primitivas de red/escritura en `lib/catalog/legacy`: sin coincidencias.
- Escaneo de referencias prohibidas de Margarita/WhatsApp/IA en los archivos modificados: sin coincidencias.
- Parseo TypeScript de los archivos modificados: sin errores de sintaxis; el chequeo global solo reportó módulos no resolubles porque el entorno no pudo reconstruir dependencias.

### Limitación del entorno

El intento de `npm ci` no pudo completarse porque el runtime no tenía disponible offline la dependencia transitiva `zod-validation-error@4.0.2`. Por esa razón no se volvió a ejecutar el suite completo `npm run lint` + `npm test` en este entorno. El Step 7 base ya tenía 25/25 tests aprobados; los cambios Step 7A quedan acompañados por tests nuevos para correr en un entorno con dependencias disponibles.

## Estado funcional

El catálogo real sigue **NO ACTIVADO**. No se inventan productos. Para pasar del piloto a datos reales sigue siendo necesario recibir un snapshot sanitizado/controlado de `tienda_catalogo` y/o `celulares_lista` o definir explícitamente un canal GET-only auditado.
