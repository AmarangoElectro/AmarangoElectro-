# V16 — PHOTO QA + CELLPHONES + ELECTRO ROUTING CHECKPOINT — 2026-09-21

Branch: `agent/chatgpt-v16`

## 1. Product image framing

The storefront ProductCard now carries an explicit image framing intent:

- `product-photo` for `celulares`
- `full-composition` for other product categories

Final CSS hard gate:
- uses `object-fit: contain`
- supplier/editorial artwork uses `object-position: center top`
- cellphone photos use centered contain
- no hover scaling/cropping
- mobile keeps a 3:4 visual area suitable for the approved 2-up card layout

No source asset was edited or destructively cropped.

## 2. 90 cellphone photos

All 90 isolated canonical cellphone records now have an HTTPS photo mapped from the existing read-only `celulares_lista` source/bank.

- 90/90 mapped
- 0 missing photo mappings
- 0 Supabase writes
- 0 public activation
- all adapter products remain `visible: false`
- adapter remains disconnected from the public catalog composite

Source mapping provenance:
- 73: exact match in list + photo bank
- 16: exact match in photo bank
- 1: exact match in current list

## 3. Binary photo integrity audit

Read-only `storage.objects` metadata audit:

- 90 products
- 89 unique storage objects
- 89/89 objects found
- 0 missing storage metadata
- 0 non-image MIME types
- 6 identical-binary reuse groups

Of those 6 groups:
- 5 are same-model storage/RAM variants and remain acceptable as shared model artwork pending final visual QA
- 1 is a cross-model conflict and is blocked for human visual review:

Canonical 23:
`Xiaomi Note 14 256/8gb`

Canonical 46:
`Xiaomi Note 15 pro PLUS 5g 256/8gb`

Both currently resolve to the exact same stored JPEG binary. Neither may be publicly activated until the correct photo is confirmed.

The admin 90-cellphone preview now surfaces this review queue.

## 4. Electro category routing

Across all current snapshot adapters there are 229 products whose canonical category is `electrodomesticos`.

Current canonical subcategory totals:
- pequeños-electrodomésticos: 68
- refrigeración: 47
- climatización: 42
- lavado: 34
- cocción: 25
- limpieza: 13

All 229 have a supported canonical V16 electro subcategory.
A conservative future router was added at:
`lib/catalog/electro-subcategory.ts`

It fails closed when the name is not strong enough to classify.

Image status:
- 228/229 electro products have HTTPS images
- 1 remains without reusable HTTPS image:
  `DELHI ESTUFA CUARZO DL-1200w`
  The source had a data URI and it remains intentionally excluded from the public sanitized snapshot.

Visibility was not changed by this gate.

## 5. Safety

- main untouched
- integration untouched
- production untouched
- Supabase writes: none
- Work branch untouched
- no product visibility changes
- no deletion of source assets
