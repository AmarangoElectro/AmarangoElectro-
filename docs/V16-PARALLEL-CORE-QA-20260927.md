# V16 Parallel Core QA — 2026-09-27

Base audited: `work/v16-modelo-correcto-live-20260919` at `ba213b96b8ba21461a3f5faa87059c015a67602c`.

This branch is parallel-only. It must not replace or force-update the live Work branch.

## Corrections prepared

1. Stored role vocabulary
   - Supabase `v16_user_access.role` is physically constrained to `owner | admin | asesor | cliente`.
   - The prepared core migration used `advisor` in two authorization branches.
   - Parallel patch changes those checks to `asesor`.
   - A regression test now rejects `v_role='advisor'` / `v_role='customer'` in the prepared SQL.

2. Post-20 monthly bonus boundary
   - Business rule: 20.5 equivalent sales remains ARS 100,000; 21 becomes ARS 107,500.
   - The TypeScript engine previously paid half of the ARS 7,500 increment at 20.5.
   - Parallel patch floors only the post-20 additional equivalent sales, while preserving half-sale progress before/at the main goal.
   - Regression test now covers 20.5 explicitly.

3. Sale idempotency conflict
   - `v16_confirm_sale` previously returned the existing sale for a reused idempotency key without comparing payload identity.
   - Parallel patch rejects the retry when client, authorized quote, or source differs.
   - Same key + same identity remains idempotent.

## Physical quote-source audit

Read-only Supabase audit only; no DDL/data mutation was executed.

`public.tienda_productos_incremental` currently has:
- 1,583 non-deleted rows;
- 535 rows marked visible;
- 1,491 non-deleted rows with positive `costo`;
- 1,583 non-deleted rows with positive `venta`;
- 1,491 rows with both cost and sale;
- `producto_id` equals `datos.id` for all 1,631 stored rows.

This is a strong candidate for a server-only authoritative quote source. Cost must never be returned to the browser.

### V16 ID mapping observations

- Electro adapter exposes IDs as `electro:<source-id>`, where the sanitized snapshot explicitly originates from `tienda_productos_incremental`. The server can resolve this family by removing the `electro:` prefix and validating the source row.
- Several frozen/expansion catalog families keep source-like IDs and should be verified individually before activation.
- The 90 canonical phones expose IDs `v16-cell:<n>`.
- All 90 canonical phone names have a unique exact normalized-name match in `tienda_productos_incremental`, but those matched rows do not currently carry a positive cost.
- Therefore a PROTECTED authorized quote for those phones must remain fail-closed until an owner-authorized cost source exists. Do not guess cost from sale price.
- CLASSIC may use an independently certified cash-price source, but the server still must validate current product identity and price before issuing an authorized quote.

## Monthly close blocker still open

The prepared SQL `v16_close_advisor_month` currently sums `ACCRUED` commission-ledger operations and excludes archived/cancelled legacy sales, but it does not yet prove all business eligibility facts required by the existing TypeScript compensation model:

- delivery completed;
- payment validated according to terms;
- financed account current at close;
- unknown delivery/payment/currentness remains pending rather than accepted.

The TypeScript engine already models these states correctly with `accepted | pending | excluded`.

Do not treat the prepared SQL month-close implementation as production-ready until the server-authoritative eligibility facts are wired to the frozen close.

## Existing backend facts reused

Already existing and should not be duplicated:
- `v16_crm_list_clients`
- `v16_crm_client_360`
- `v16_crm_client_sales`
- `v16_collections_list`
- `v16_collections_summary`
- `v16_register_customer_payment`
- `v16_reverse_customer_payment`
- `v16_payment_history_list`
- `v16_payment_history_summary`
- `v16_create_delivery`
- `v16_deliveries_list`
- `v16_delivery_detail`
- `v16_transition_delivery`

## Safety

No Supabase migration was applied.
No production deploy.
No main update.
No force push.


## Additional parallel implementation prepared

### Exact payment schedule
New V16 sales now have a prepared immutable payment schedule contract:
- each payment has sequence, exact amount, due date and grace-through date;
- the first payment must equal `initialPayment`;
- the schedule total must equal `financedTotal`;
- the number of schedule entries must equal `installments`;
- due dates use `America/Argentina/Buenos_Aires` and freeze the existing 3-day tolerance;
- a payment-event trigger updates legacy `ventas.montoCuota` to the next contractual amount for V16 snapshot sales only, preserving historical fallback behavior.

This specifically prevents Plan Protegido from being treated as if every payment had the same amount.

### Advisor month close hardening
Prepared month close now:
- derives operation facts from immutable sale schedule, delivery and append-only payment/reversal events;
- requires delivery `ENTREGADA`;
- excludes cancelled operations;
- excludes financed operations that are overdue at close;
- leaves unresolved delivery/collection as `PENDING`;
- refuses to freeze the month while any operation is pending;
- persists accepted/excluded operation decisions in `v16_advisor_monthly_close_operations`;
- preserves 20.5 = ARS 100,000 and 21 = ARS 107,500.

### Trusted server quote path
Prepared components:
- `lib/operations/authorized-sale-quote-engine.ts`
- `app/api/v16/sale-quote/route.ts`
- service-role-only `v16_resolve_operational_product_quote_source`
- service-role-only `v16_chatgpt_issue_authorized_sale_quote`

Browser input is restricted to product identity plus payment selection. Cost, authoritative price, commission, actor and active financing mode are derived server-side.

The quote response deliberately omits cost, supplier, markup and margin.

### Product source facts verified read-only
`tienda_productos_incremental`:
- 1,583 non-deleted rows;
- 1,491 with positive cost;
- 1,583 with positive sale price;
- 1,491 with both;
- 535 currently marked visible.

Known V16 prefixes map to the source row by stripping their namespace:
`electro:`, `exp63:`, `exp5:`, `exp31:`, `exp50:`, `exp99:`, `cohort0:`, `v411-evidence:`.

Canonical phones `v16-cell:<n>` resolve through `v16_canonical_product_identity` by unique normalized name. All 90 currently have a unique match, but those matched rows do not have a certified positive cost. Therefore:
- CLASSIC may use the server-certified sale price fallback;
- PROTECTED remains fail-closed for those phones until certified cost exists.

### QA added
The current V16 QA list on this parallel branch includes:
- `v16-sale-payment-schedule.test.mjs`
- `v16-authorized-sale-quote-engine.test.mjs`
- `v16-authorized-sale-quote-route.test.mjs`

Static consistency check confirms:
- no malformed single-dollar PL/pgSQL delimiters;
- source resolver and quote issuer wrapper exist;
- service-role grant is present;
- exact payment schedule exists;
- monthly close operation evidence exists;
- all new tests are registered in `scripts/v16-qa.mjs`.

These tests have been prepared and registered; full Node/build execution still must run in the integration environment before merge.
