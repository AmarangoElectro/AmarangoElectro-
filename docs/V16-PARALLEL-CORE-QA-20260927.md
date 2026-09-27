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
