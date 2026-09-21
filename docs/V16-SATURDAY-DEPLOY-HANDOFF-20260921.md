# AmarangoElectro V16 — Saturday Deploy Handoff — 2026-09-21

## Fuente de verdad

- Repository: `AmarangoElectro/AmarangoElectro-`
- Branch: `work/v16-modelo-correcto-live-20260919`
- Minimum app-code HEAD covered by this handoff: `ce20a5b33f71818b269f19809f2185628405d225`
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
   - Administration module hash navigation and dark/mobile parity.
5. Return `PASS_DEPLOY` or `BLOCKED_DEPLOY` + published HEAD + preview URL + real visible product count + STOP.
