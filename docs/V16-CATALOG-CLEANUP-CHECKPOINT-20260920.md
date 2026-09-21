# V16 — CATALOG CLEANUP CHECKPOINT — 2026-09-20

Branch: `agent/chatgpt-v16`

## Ejecutado

1. **Legacy fuera del runtime público**
   - `V411AuditedPilotCatalogAdapter`: evidencia histórica únicamente.
   - `Cohort0FrozenCatalogAdapter`: evidencia histórica únicamente.
   - Los archivos no se borran; se preservan para QA y trazabilidad.
   - El runtime público consume solo los 8 snapshots sanitizados actuales.

2. **Cobertura actual**
   - Fuente LIVE visible + precio auditada: 553 IDs.
   - Snapshots V16: 553 IDs únicos.
   - El composite deduplica también una repetición pública exacta del set de baño, por lo que la superficie comercial esperada es 552 tarjetas para 553 filas de origen.

3. **Financiación V16 unificada**
   - 2 cuotas: +15%.
   - 4 cuotas: +35%.
   - 6 cuotas: +55%.
   - La lógica vive en `lib/catalog/financing.ts`.
   - Los 8 adapters actuales usan la misma función.

4. **Deportes & Movilidad**
   - Nuevo sector canónico público: `deportes-movilidad`.
   - 20 productos clasificados:
     - Bicicletas: 13.
     - Fitness: 6.
     - Movilidad personal: 1.
   - Se reutiliza el artwork existente `/assets/v16-generated/sectors-v2/deporte-movilidad.webp`.
   - El entry comercial previo ahora apunta al sector canónico.

5. **Imágenes remotas**
   - Se mantiene el host de Supabase.
   - Se agregó explícitamente `cdn.catalog-store.link` a `next.config.ts` para los 30 assets auditados de ese CDN.

6. **Celulares**
   - Los 90 celulares materializados permanecen aislados en Administración.
   - Este cleanup NO los publica ni cambia su gate.

## Pendientes antes de integración

- Ejecutar build + suite completa en un runner/Work con el repositorio disponible.
- QA visual por categoría y PDP.
- Resolver las dos imágenes no reutilizables:
  - DELHI ESTUFA CUARZO DL-1200w.
  - Desmalezadora shimura.
- Resolver la identidad comercial de las dos filas Kretz con mismo nombre y diferente precio/código.
- Calidad secundaria de datos:
  - reducir `brand: Varios` solo cuando exista evidencia literal;
  - extraer modelos de alta confianza sin inventarlos;
  - limpiar presentación de nombres sin destruir el valor original.

## Seguridad

- Sin escrituras Supabase.
- Sin cambios en `main`.
- Sin cambios en `integration/v16-shared-live-20260920`.
- Sin deploy de producción.
- Sin modificación de la rama `agent/work-v16`.
- Sin activar los 90 celulares en Storefront.
