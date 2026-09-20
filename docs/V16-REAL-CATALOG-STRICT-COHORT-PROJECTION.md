# V16 — Real Catalog Strict Cohort Projection

Status:
- `PASS_LOCAL_V16_REAL_CATALOG_STRICT_COHORT_PROJECTION`
- `BLOCKED_V16_PUBLIC_CATALOG_ACTIVATION_PREFLIGHT`
- `+ STOP`

## Strict Product V16 projection

Recovered audit criterion:

`product_v16_compatibility == YES_EXISTING_AUTHORITY`

Result: **127 products**.

All 127 have:
- stable identity in the audited matrix;
- demonstrated existing brand authority;
- demonstrated existing taxonomy;
- positive public sale price;
- `availability=available`;
- public-only projection fields.

Current blockers:
- **112** → `LIVE_HTTP_NOT_CERTIFIED`
- **15** → `IMAGE_REVIEW`
- **111** → additionally marked `cohort_0_eligible_pre_http=YES`

One strict/live-HTTP row is intentionally excluded from the pre-HTTP pool because it still carries `DUPLICATE_NAME_REVIEW`.

## Curated Cohort 0

The dedicated workbook sheet contains **9 conditional candidates**, one per demonstrated top-level taxonomy. These 9 are a subset of the strict 127 projection.

They are **not authorized for publication**. Their current primary blocker remains live image HTTP certification.

## Activation decision

Public catalog activation remains BLOCKED because:
1. the recovered workbook states **0 READY_V16** under the current live HTTP certification;
2. 112 strict products still need live image HTTP certification;
3. 15 strict products still require image review;
4. snapshot/current-head alignment remains `NOT_VERIFIED_CURRENT_HEAD_FFE77535`;
5. the currently active app catalog is intentionally unchanged.

No product from this projection is imported into `lib/catalog/index.ts`, Home, Storefront, ProductCard, PDP, Admin, or Asesor runtime.
