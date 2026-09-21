# AmarangoElectro V16 — Saturday Deploy Handoff — 2026-09-21

## Fuente de verdad

- Repository: `AmarangoElectro/AmarangoElectro-`
- Branch: `work/v16-modelo-correcto-live-20260919`
- Minimum app-code HEAD covered by this handoff: `b835cad3664dd3c647dfc69642f935015d6e56c0`
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
