# AmarangoElectro V16 — Saturday Deploy Handoff — 2026-09-21

## Fuente de verdad

- Repository: `AmarangoElectro/AmarangoElectro-`
- Branch: `work/v16-modelo-correcto-live-20260919`
- Minimum app-code HEAD covered by this handoff: `a6d18d34b5d1eecf5eba4e91423212e338bd88c8`
- Correct preview target: `https://amarango-v16-preview-rama-20260919.amarango-electro.chatgpt.site/`
- Do not rebuild the store.
- Do not touch `main`, production, or approved global banners/photos/theme system.
- Growth/Referidos backend migrations were already applied to Supabase on 2026-09-25 under the authorized Growth gate. Do not apply additional Supabase changes during deployment unless explicitly authorized.

## Current GitHub state prepared for deployment

### Catalog
- 569 visible unique products from the composite catalog.
- 224 sanitized Electrodomésticos rows remain integrated.
- 90 canonical cellphone rows are the sole public Celulares source.
- Legacy positions 10 and 91 remain excluded.
- Composite catalog de-duplicates product identity across sources even when stale source prices differ, preserving the earlier verified source.

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


### 2026-09-24 final pre-deploy QA delta
- branch verified from `bdbe61bda65f9f60e851aa07480f6bbd703c2f4b` through the current pre-deploy work with no writes to `main`, Supabase or production;
- catalog identity QA corrected two stale duplicate refrigerator rows, leaving **569** visible unique products and **285 Electrodomésticos**;
- missing-photo audit remains fail-closed for exactly three evidenced products: Codini Secarropas 6.5 KG, DELHI Estufa Cuarzo DL-1200w and SMART TV BGH 43" C/GOOGLE TV; no substitute image was invented;
- Herramientas sector routing now derives only unambiguous names: **15 Taladros, 1 Amoladora, 3 Sierras**; the remaining tools stay in the full Herramientas catalog;
- Audio sector routing now derives only explicit evidence: **8 Torres, 1 Barra de sonido, 1 Parlante portátil**; Auriculares and Home audio remain planned until validated products exist;
- taxonomy QA: all 569 products resolve to known top-level categories and no active product carries an unknown subcategory;
- mobile source-level QA covers **320 / 360 / 390 / 412 px**, preserving two product cards per row, horizontal sector-tab scrolling, safe-area bottom navigation and 16 px search input sizing on narrow screens;
- no GitHub Actions workflow exists in the repository; commits do not auto-deploy;
- build entry remains `npm run build` -> `scripts/build-verified.sh` -> bounded `vinext build`;
- publish only this branch tip to `https://amarango-v16-preview-rama-20260919.amarango-electro.chatgpt.site/`, then perform browser/live visual validation before any production action.


### 2026-09-24 product-photo framing + cellphone brand-family delta
- Product images remain the original catalog URLs; no image asset was replaced, generated or reassigned.
- Product cards and PDP now expose category/subcategory only as presentation metadata for image framing.
- Photo framing is shape-aware and remains `object-fit: contain`: Celulares, Smart TV, Audio, Herramientas and tall Electrodomésticos use separate padding/object-position rules.
- Refrigeración and Lavado are bottom-aligned in cards/PDP so tall appliances sit naturally inside the frame instead of floating vertically.
- Smart TV uses a wider visual frame; Celulares retain lateral breathing room; Audio/Herramientas use a larger usable image area.
- Mobile framing has explicit rules under 680 px and preserves the approved two-cards-per-row layout.
- Regression coverage: `tests/v16-product-image-framing-regression.test.mjs`.
- Cellphone brand-family navigation now treats Redmi as part of the Xiaomi storefront family without rewriting the product's stored/displayed brand.
- Default cellphone accordion now resolves the full 90-product cohort: 15 Apple + 20 Samsung + 25 Motorola + 12 Xiaomi/Redmi + 7 Infinix + 11 POCO.
- Brand-locale matching is normalized for casing/family, preventing valid locales such as POCO from disappearing because the product brand is stored as `POCO` while locale metadata uses `Poco`.
- Regression coverage: `tests/v16-cellphone-brand-family-regression.test.mjs`.
- These changes are committed to GitHub only. This session has no Site/preview deploy action; the preview still requires publication from the editable Work/Site environment.


### 2026-09-25 Plan Protegido calculator delta
- Existing Admin calculator Formula 1 remains intact; its authoritative source blobs were not modified.
- Administration → Calculadora now exposes two independent modes: `Fórmula actual` and `Plan Protegido`.
- Plan Protegido is cost-only: real ARS cost is the source of truth and sale price is never reverse-engineered.
- Exact protected markup ladder: <50k 80%; 50k..<100k 60%; 100k..<250k 50%; 250k..<350k 40%; >=350k 30%.
- Protected cash price does not use Formula 1's legacy $500 sale rounding.
- Initial is balanced by markup tier: 90% / 80% / 75% / 70% / 65% of cost, equivalent to 50% of the protected cash price; commercial copy exposes only the amount.
- Customer options are only cash / 3 / 6.
- Plan 3 uses +35% over protected cash price.
- Plan 6 reuses Formula 1's current active 6-installment rule through `quoteInstallmentPlan`; current surcharge is 78%.
- Customer payment schedules round only displayed/cobrable pesos and assign any remainder solely to the final later payment so the displayed total closes exactly.
- Advisor commission stays based on protected cash price: 10% cash; 15% financed; Plan 3 commission in 2 payouts; Plan 6 commission in 3 payouts.
- Admin view exposes real cost, cash price, markup, internal initial, financed totals, later installments, commission totals/payout counts and Amarango net result.
- Generated customer message excludes cost, markup, the internal initial-percentage table, commission and Amarango net.
- QA boundary/report: `docs/V16-PLAN-PROTEGIDO-QA-20260925.md`.
- Regression coverage: `tests/v16-plan-protegido-calculator.test.mjs`.
- The actual `/administracion` workspace imports this calculator component; this is not an orphan prototype.
- No Supabase/production/main change and no automatic deploy.


### 2026-09-25 balanced protected-initial invariant
- Owner clarified the goal is not merely initial > later payments, but a coherent effort/relief balance across every cost tier.
- Final initial table by markup: 80% markup → 90% of cost; 60% → 80%; 50% → 75%; 40% → 70%; 30% → 65%.
- This is mathematically equivalent to taking 50% of the protected cash price as the initial.
- Plan 3 therefore preserves the same pre-rounding relationship in every tier: initial is about 17.65% higher than each later payment.
- Plan 6 uses the same initial and produces a stronger subsequent-payment relief.
- Runtime still verifies the actual peso-rounded schedules and guarantees initial > every later payment.
- Financed totals, +35% Plan 3, Formula 1 +78% Plan 6, commissions and Amarango net profitability remain unchanged.
- Broad sampled QA from $1.000 to $1.000.000 found zero closing/relief failures.
- Regression coverage locks the 90/80/75/70/65 mapping and cross-tier relief ratio.
- No main, Supabase, production or automatic deploy.


### 2026-09-25 Definitive calculator coherence delta
- App-code HEAD: `a6d18d34b5d1eecf5eba4e91423212e338bd88c8`.
- Both Admin calculators are cost-fed and share `lib/internal/finance/coherent-pricing.ts`.
- Exact markup boundaries: <50k 80%; 50..<100k 60%; 100..<250k 50%; 250..<350k 40%; >=350k 30%.
- Global mathematical floors prevent price drops across markup boundaries.
- Strategic commercial rounding is centralized and upward-only with endings 299 / 499 / 799 / 999; it can never lower the coherent price.
- Calculadora Clásica keeps its existing 2/4/6 financing logic and uses the definitive coherent cash price as its base.
- Plan Protegido uses the same definitive cash price, initial = MIN(75% cost, 55% cash), Plan 3 = +35%, Plan 6 reuses the current 6-installment total (+78%).
- New money paths use integer cents where introduced; displayed installment remainder is assigned only to the final payment.
- QA source: `docs/V16-PRICE-COHERENCE-CALCULATORS-QA-20260925.md`.
- Important commercial note: the definitive MIN(75% cost, 55% cash) initial can be lower than a later Plan-3 installment at some low costs; no hidden override was added.
- No main, Supabase, production, catalog, Home, banners, images or automatic deploy.


### 2026-09-25 Growth / Referidos secure-backend delta
- Native referrals/benefits/acquisition/escalation UI is present on this branch.
- Authoritative Growth backend has been added to Supabase through additive migrations only; no example reward policy, advisor level, referral, benefit, acquisition cost or risk snapshot was seeded.
- Referral lifecycle is server-authoritative and reward availability is tied to the real `v16_payment_events` ledger; payment reversals re-evaluate eligibility.
- Source attribution persists server-side and propagates lead → client → sale → payment for referral-origin operations.
- Advisor exposure is based on cost real + direct costs + committed commissions − actual net paid; risk snapshots are idempotent and reject conflicting rewrites.
- Funnel paid count uses current net ledger state rather than append-only payment events, so reversed payments do not remain counted as paid.
- Growth browser code now calls same-origin `POST /api/v16/growth`; it does not receive a Supabase token or secret.
- The Site server route requires hosted secret `SUPABASE_SECRET_KEY`. Configure it only in Site Settings → Environment Variables; never commit or paste it into source.
- The ChatGPT→Supabase DB bridge is `service_role`-only, resolves the authenticated ChatGPT email to existing `auth.users`/`v16_user_access`, and always injects `aal1`.
- Admin writes that require AAL2 intentionally remain `step_up_required`; do not weaken those checks for deployment.
- Existing owners are mapped. Ordinary customer identity enrolment remains a separate gate; do not auto-link customers by approximate personal-data matches.
- Regression/security coverage: `tests/v16-growth-referrals-system.test.mjs`.
- Detailed handoff: `docs/V16-GROWTH-REFERRALS-SYSTEM-20260925.md`.
- No Site deployment has been performed from this session.
