# V16 — Real Catalog Source Recovery

Status: `PASS_LOCAL_V16_REAL_CATALOG_SOURCE_RECOVERY_EVIDENCE + STOP`

A stronger real-catalog evidence set was physically recovered without connecting production.

## Recovered sanitized snapshot

- File: `evidence/catalog-source-snapshot.sanitized.json`
- SHA-256: `b3e1183dabc38d7e8b2e4be26b5c0679dfbd28794862eba73abbb5205515270b`
- Captured: `2026-09-09T19:32:06.10358Z`
- Mode: `read_only`
- `writeEnabled`: `false`
- Master source: `public.tienda_catalogo/catalogo`
- Incremental read model: `public.tienda_productos_incremental`
- Legacy cellphone source: `public.celulares_lista/lista`

Snapshot counts:
- master: 1488
- visible: 590
- not visible: 898
- tombstones: 48
- legacy cellphones: 92
- selected HTTPS images: 1311

## Strict recovered audit

The recovered workbook `WORK-V16-REAL-CATALOG-AUDIT-MATRIX.xlsx` is stricter than the raw snapshot:
- master 1,488
- visible 590
- brand demonstrated 304
- Product V16 compatible 127
- Product V16 + Storage image 112
- READY under current live HTTP certification: **0**
- current-head alignment: `NOT_VERIFIED_CURRENT_HEAD_FFE77535`
- Cohort 0: 9 conditional candidates, none authorized for publication.

Therefore this source is **stronger evidence than V4.11/Cohort0**, but it is not activated in `lib/catalog/index.ts`.

No public catalog, Home, ProductCard, visibility, price, stock, image, Supabase, Storage, or production state was changed.
