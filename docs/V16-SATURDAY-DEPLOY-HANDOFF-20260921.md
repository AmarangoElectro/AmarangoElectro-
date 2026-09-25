# AmarangoElectro V16 — Saturday Deploy Handoff — 2026-09-21

## Fuente de verdad

- Repository: `AmarangoElectro/AmarangoElectro-`
- Branch: `work/v16-modelo-correcto-live-20260919`
- Minimum app-code HEAD covered by this handoff: `ea583b297abde0380f7a2a36482c5c369ed17602`
- Correct preview target: `https://amarango-v16-preview-rama-20260919.amarango-electro.chatgpt.site/`
- Do not rebuild the store.
- Do not touch `main`, Supabase, production, or approved global banners/photos/theme system.

## Current GitHub state prepared for deployment

### Catalog
- Approximately 266 visible unique products from the composite catalog.
- 224 sanitized Electrodomésticos rows remain integrated.
- 30 sanitized cellphone rows are connected with the approved small-batch adapter.
- Legacy position 10 remains excluded.
- Composite catalog de-duplicates exact commercial keys across sources.

### Home sector access
Prepared direct access for:
- Refrigeración
- Climatización
- Cocción
- Lavado
- Pequeños electrodomésticos
- Limpieza
- Colchones y sommiers
- Blanquería

### Herramientas
Three separate sector banners are implemented:
- Taladros
- Amoladoras
- Sierras

Contract:
- full banner is clickable;
- no Amarango logo layer inside Herramientas banners;
- V16 oval/panoramic geometry is preserved;
- responsive mobile treatment is present;
- explicit light/dark treatment is present;
- CTA remains `Entrar al sector`;
- regression test: `tests/v16-herramientas-oval-theme-regression.test.mjs`.

### Navigation continuity
Existing centralized `RouteScrollReset` + `navigation-memory` flow remains the single source of truth for catalog-return scroll restoration. Do not add a second restoration layer.


### Internal spaces
Prepared on the same branch:
- the global Claro / Auto / Oscuro selector is now available from the internal-space header;
- Mi Amarango has local in-page navigation for Resumen / Ofertas / Catálogo only;
- Mi Amarango still does not link to Administration or Amarango OS;
- Administration keeps its module context in readable URL hashes (for example `#crm`, `#cobranzas`, `#caja`, `#entregas`);
- primary Administration shell surfaces have explicit dark-mode parity;
- mobile Administration tabs are horizontally scrollable without compressing module labels;
- regression test: `tests/v16-internal-spaces-theme-navigation-regression.test.mjs`.


### Administration mobile operational polish
Prepared without changing adapters, RPC contracts or Supabase:
- CRM / Cliente 360: mobile-safe rows, metrics, tabs and actions;
- Cobranzas / Historial de pagos: 2-column mobile metrics, safe wrapping and full-width actions on narrow screens;
- Caja: mobile-safe filters/forms and human operational copy;
- Entregas: mobile-safe status cards/actions and human operational copy;
- Asesores: portfolio/detail/create flows retain safe adapter boundaries and use human operational copy;
- Reportes: mobile filters and table sizing hardened for 320-412 px;
- Proveedores / Bandeja: technical UI labels replaced by human-facing operational language; Provider Inbox remains adapter-backed;
- Calculadora / Placas: touch targets, inputs, results and installment cards hardened for mobile and dark mode;
- regression test: `tests/v16-admin-mobile-operational-regression.test.mjs`.


### Administration review surfaces
Prepared on the same branch:
- Storefront review uses human-facing Admin ON/OFF language and explicit review-only status;
- the 90-cellphone internal surface is framed as a complete review matrix and no longer implies that the whole public cellphone category is disabled;
- Quick Actions availability labels are in Spanish and preview-photo copy no longer exposes Storage/technical language;
- unimplemented bulk catalog actions are visibly disabled instead of looking executable;
- Storefront review, Quick Actions, 90-cellphone review and Admin product grid have explicit dark/mobile parity;
- Admin product grid becomes one column on narrow phones to preserve controls;
- regression test: `tests/v16-admin-review-surfaces-regression.test.mjs`.


### Mi Amarango — Nueva Venta preparation
Prepared without enabling an unsafe write path:
- recovered the useful advisor sale UX into `app/components/advisor-sale-draft-panel.tsx`;
- client data: name, WhatsApp, address, locality; DNI/activity become required for financed preparation;
- product search and paste helper use only the V16 catalog passed to Mi Amarango;
- payment choices: Contado / 2 / 4 / 6;
- installment amount is shown only when a validated financing option already exists on the product;
- optional seña / entrega and estimated balance;
- active action: copy a complete review summary;
- `Registrar venta` remains disabled because V16 has no secure advisor sale-create capability yet;
- `Mis Ventas` is intentionally not fabricated from Admin-wide reports;
- no direct Supabase write and no Admin-only pricing policy import;
- security regression: `tests/v16-advisor-sale-draft-security-regression.test.mjs`;
- activation preflight: `docs/V16-ADVISOR-SALES-SECURE-WRITE-PREFLIGHT.md`.

## Known deployment gap

The public preview was last externally observed in an older state:
- 236 visible products;
- only 3 cellphone entries;
- cellphone placeholders with missing images;
- missing newly added Home sector access.

That is a deployment/access gap, not the intended GitHub branch state.

The Angie Work space reported BLOCKED because it could inspect the public preview but could not access the editable GitHub branch or Site project.

## Saturday deployment instruction

1. Open from the owner/workspace that has edit access to the AmarangoElectro Site.
2. Use the branch above exactly.
3. Deploy the current branch tip; do not reconstruct from another preview/version.
4. Validate in browser:
   - real visible product count;
   - 30 sanitized cellphones;
   - position 10 absent;
   - Electrodomésticos preserved;
   - new Home sector access;
   - Taladros / Amoladoras / Sierras banners;
   - no logo inside those three Herramientas banners;
   - light/dark;
   - 320 / 360 / 390 / 412 px;
   - full-banner tap and sector route;
   - catalog → product → return position;
   - internal Claro / Auto / Oscuro selector;
   - Mi Amarango section navigation and dark parity;
   - Administration module hash navigation and dark/mobile parity;
   - CRM / Cobranzas / Caja / Entregas / Asesores at 320 / 360 / 390 / 412 px;
   - Proveedores / Bandeja operational copy and mobile flow;
   - Calculadora / Placas mobile touch targets and dark-mode surfaces;
   - Storefront Admin review and Quick Actions in light/dark;
   - 90-cellphone review copy and 320 / 360 / 390 / 412 px layout;
   - Admin product grid single-column narrow-phone behavior and disabled bulk actions;
   - Mi Amarango Nueva Venta preparation on 320 / 360 / 390 / 412 px;
   - paste/search product helper, Contado / 2 / 4 / 6 and copy-summary flow;
   - confirm that Registrar venta stays disabled until the secure sales backend gate is implemented.
5. Return `PASS_DEPLOY` or `BLOCKED_DEPLOY` + published HEAD + preview URL + real visible product count + STOP.


### PWA / public-shell cleanup
Prepared on the same branch:
- public metadata title is now simply `AmarangoElectro` (no V16 / Product Bridge wording);
- PWA viewport uses `viewport-fit=cover` for installed Android/iOS safe areas;
- public menu no longer exposes identity-block / profile implementation language;
- existing bottom navigation safe-area handling remains preserved;
- PWA service worker remains shell-only and does not cache live catalog pages;
- regression coverage extended in `tests/v16-step7h-continuity-pwa.test.mjs`.


### Human-facing copy / public search / mobile touch
Prepared on the same branch:
- Plataforma, Propietarios, Gestión de categorías and Amarango Operaciones no longer expose lab/V16/fixture/legacy/Supabase wording in visible UI;
- public search now shows the current `products.length` from the composite catalog instead of the old pilot evidence count;
- public search no longer says `Catálogo en incorporación` or `la muestra disponible`;
- missing product photography now reads `FOTO EN ACTUALIZACIÓN`;
- mobile product-card tools, detail actions, compare controls and sector bottom navigation have reinforced touch targets;
- offline page was reviewed and preserved unchanged because its copy, safe-area viewport and retry action are already appropriate;
- regression tests: `tests/v16-human-facing-copy-regression.test.mjs` and `tests/v16-public-search-touch-regression.test.mjs`.


### Test-compatibility cleanup
- existing customer-safe fallback test now expects `FOTO EN ACTUALIZACIÓN`;
- advisor internal-navigation test now expects the current Amarango Operaciones metadata;
- no production behavior was changed by these test updates.


### Home / header / menu / mobile search
Prepared on the same branch without changing approved banners or Home order:
- Home anchors are now real and stable: `#productos`, `#ofertas`, `#experiencia`, `#financiacion`;
- header menu no longer points to the removed `#como-comprar` anchor;
- header favorites now opens favorites across the whole searchable catalog instead of only Celulares;
- internal-platform link copy is now `Espacios internos`;
- footer routes to real Home anchors and links `Área asesores` to `/mi-amarango`;
- retired Home sector slogans were removed from Audio, Gaming and Hogar;
- mobile header search remains visible at 320-412 px and gets readable input sizing;
- drawer respects bottom safe-area and uses larger touch targets;
- sticky-header anchor offsets prevent linked sections from opening underneath the header;
- regression test: `tests/v16-home-header-navigation-regression.test.mjs`.


### Category / sector / favorites continuity
Prepared on the same branch:
- global Favorites in the header is backed by `/buscar?favoritos=1` and the composite catalog favorites store;
- Home/retail sector links that use `#sector-activo` now land on a real anchor;
- searching from an active non-brand sector preserves the `sector` parameter instead of widening silently to the whole category;
- contextual subcategory navigation uses the storefront Link wrapper instead of full-page anchors;
- brand-locale navigation uses the same storefront navigation path;
- `#sector-activo` and `#catalogo` have sticky-header offsets;
- subcategory/context/filter controls have 44 px mobile touch targets;
- catalog search/price/sort controls keep 16 px mobile text sizing;
- Audio/Hogar showroom copy no longer restores retired slogans;
- Admin catalog overlay copy uses `Acciones rápidas / Vista de revisión` instead of draft/version labels;
- regression test: `tests/v16-category-favorites-navigation-regression.test.mjs`.


### Product detail / comparison / recently viewed / consultation flow
Prepared on the same branch:
- product-detail missing-photo copy is customer-facing;
- purchase-intent review no longer exposes V16/checkpoint/stage language;
- copied consultation remains a local/manual handoff; nothing is transmitted or stored automatically;
- Recently Viewed now uses customer-facing `VISTOS RECIENTEMENTE` language;
- purchase-intent and comparison surfaces have explicit dark-mode parity;
- mobile purchase-intent/compare sheets respect bottom safe-area;
- return/clear/close/review actions have reinforced 44 px touch targets;
- comparison now traps keyboard focus inside its modal and still supports Escape;
- regression test: `tests/v16-product-decision-flow-regression.test.mjs`.


### Catalog expansion — 422 visible unique products
Prepared on the same branch:
- active composite catalog reconstructs to 422 visible unique products;
- 90 canonical cellphones are the sole public cellphone source, with canonical `v16-cell:*` IDs plus sanitized price/image data;
- legacy pilot cellphone rows are excluded from the active composite to avoid price/model conflicts;
- 63-product strict projection expansion is active;
- 5 additional V4.12 sanitized products are active;
- 31 additional Electrodomésticos are active through a strict literal-brand rule constrained to brands already known in the same category;
- duplicate Drean HDR370 short row `-463` is excluded in favor of the richer `-43` record;
- current reconstructed category counts include 282 Electrodomésticos, 90 Celulares, 20 Smart TV and 10 Audio;
- 410/422 reconstructed products have an image; missing-photo states remain fail-closed/customer-safe;
- regression coverage: `tests/v16-catalog-expansion-391-regression.test.mjs` and the updated 90-cellphone activation coverage.


### Catalog expansion — 472 visible unique products
Prepared on the same branch:
- active composite catalog reconstructs to 472 visible unique products;
- 460/472 reconstructed products have an image;
- fourth expansion adds 50 Storage-backed products across Herramientas, Cuidado personal, Smart TV, Hogar, Audio, Camping and Otros;
- inferred brand is accepted only when the product name contains a literal brand already evidenced in the active catalog;
- ambiguous labels are excluded;
- external CDN-only images are excluded from this batch;
- duplicate Gamma `G12602KAR` short row `-423` and duplicate Drean `HDR370` short row `-463` remain excluded;
- current reconstructed counts include 282 Electrodomésticos, 90 Celulares, 28 Herramientas, 24 Smart TV, 12 Audio and 12 Cuidado personal;
- regression floor updated in `tests/v16-catalog-expansion-391-regression.test.mjs`.


### Catalog expansion — consolidated 569-product target
Current active catalog composition is deduplicated and read-only:
- 224 sanitized Electrodomésticos snapshot rows;
- 90 canonical cellphones with sanitized price/photo evidence; legacy positions 10 and 91 remain excluded;
- frozen cohort and non-cellphone pilot evidence;
- public expansion batches: 63 + 5 + 31 + 50 + 99;
- total reconstructed visible unique products: **569**;
- category totals include: 285 Electrodomésticos, 90 Celulares, 48 Herramientas, 33 Audio, 32 Cuidado personal y salud, 29 Smart TV, 18 Hogar, 14 Otros, 6 Gaming, 5 Tecnología y accesorios, 4 Camping/aire libre/mascotas, 3 Bebés/juguetes and 2 Descanso;
- redundant checkpoint adapters/files remain versioned as evidence but are not active in `lib/catalog/index.ts`;
- `lib/catalog/index.ts` has one unique adapter instance per active expansion and no duplicate `catalogExpansion31` declarations;
- regression coverage: `tests/v16-catalog-expansion-391-regression.test.mjs` now locks the **569-product** reconstructed total.
