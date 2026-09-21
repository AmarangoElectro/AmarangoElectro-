# V16 — Asesor Sales Secure Write Preflight

Status: `READY_FOR_SECURE_BACKEND_GATE + NO_WRITE`

## Purpose

Recover the useful advisor sales workflow without restoring the legacy direct-Supabase write path.

The current Mi Amarango UI may prepare a sale draft, search/paste a catalog product, choose Contado / 2 / 4 / 6 cuotas, capture client/contact data and copy a review summary.

It MUST NOT persist a sale until the authenticated server boundary below exists.

## Historical UX recovered

The old advisor flow established these useful requirements:

- identify the advisor from the authenticated session, not from a free-text seller field;
- client name;
- WhatsApp;
- address and locality;
- DNI and activity required for financed sales;
- product selected from the live catalog;
- paste/search product helper;
- Contado / 2 / 4 / 6;
- optional seña / entrega;
- Administration must be able to see the confirmed sale;
- advisor must never see cost, markup, supplier-private data, Caja or Admin-only finance policy.

The old implementation also contained direct table/local-storage fallbacks. Those mechanisms are NOT approved for V16 and must not be restored.


## Historical Mis Ventas finding

The reviewed historical advisor branches do not provide a safe advisor-scoped `Mis Ventas` read model.

The recovered sale flow wrote into a shared/global history and included fallbacks to `tienda_catalogo` plus local storage. That history cannot be treated as the authenticated advisor's portfolio in V16.

Therefore V16 must NOT:

- filter the old global history in the browser by a seller name;
- trust a browser/local-storage `advisor_id`;
- reuse Admin-wide reports as `Mis Ventas`;
- restore the old direct `tienda_catalogo` read/write path.

A real `Mis Ventas` surface waits for server-derived advisor identity and server-side advisor scoping.

## Current hard boundary

The current secure RPC bridge allowlist has no capability to:

1. create/confirm a sale for an advisor;
2. list the authenticated advisor's own sales.

Therefore:

- `Registrar venta` remains disabled;
- `Mis Ventas` must not fabricate data or reuse Admin-wide reports;
- browser code must not write directly to Supabase;
- service credentials must not be exposed to the browser;
- Admin-only pricing policy must not be imported into Mi Amarango.

## Backend capabilities required before activation

### Create sale

A server-authorized sale creation capability must:

- require the authenticated ChatGPT application session;
- map that identity to `v16_user_access`;
- require advisor/admin sale-create capability;
- derive `advisor_id` server-side;
- reject a browser-supplied advisor override;
- validate product identity against the current catalog;
- persist an immutable sale/product snapshot;
- accept the customer fields required by the approved business flow;
- accept payment mode `cash | 2 | 4 | 6`;
- store only a validated/authorized sale total;
- support optional seña;
- return a stable `sale_id`;
- be idempotent for retries;
- audit actor, timestamp and source.

### Advisor sales list

A server-authorized advisor sales read capability must:

- derive the current `advisor_id` server-side;
- return only sales scoped to that advisor unless the actor has an explicit Admin capability;
- support pagination;
- expose client-facing sale fields only;
- never expose cost, markup, supplier-private data or unrelated advisor portfolios;
- return a safe zero-state when no sales exist.

## Activation gate

Only after both server capabilities exist and pass authorization/RLS tests:

1. add their concrete RPC/server action names to the secure bridge allowlist;
2. implement a typed adapter;
3. enable `Registrar venta`;
4. implement `Mis Ventas`;
5. validate advisor A cannot read/write advisor B;
6. validate Cliente cannot access either capability;
7. validate Admin visibility separately;
8. browser live-auth QA;
9. PASS or BLOCKED + STOP.

## Current UI evidence

- `app/components/advisor-sale-draft-panel.tsx`
- `app/components/advisor-workspace.tsx`
- `tests/v16-advisor-sale-draft-security-regression.test.mjs`
- `tests/v16-advisor-internal-navigation-boundary.test.mjs`

No Supabase write, RPC allowlist change, production change or deployment is included in this preflight.
