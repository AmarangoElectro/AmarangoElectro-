# V16 Core Operational Sprint — audit and prepared closure

Status: `BLOCKED_V16_CORE_OPERATIONAL` until the owner authorizes and validates the prepared backend migration.

## Read-only physical audit

Project `zctaukyrhsmpjkcddcqq` was inspected through catalog metadata only. No DDL or data mutation was executed.

### Existing capabilities

- CRM reads: `v16_crm_list_clients(search_text,row_limit,row_offset)`, `v16_crm_client_360(p_client_id)`, `v16_crm_client_sales(p_client_id)`.
- Collections reads: `v16_collections_list(search_text,status_filter,include_complete,row_limit,row_offset)`, `v16_collections_summary()`.
- Payment ledger: `v16_register_customer_payment(...)`, `v16_reverse_customer_payment(...)`, `v16_payment_history_list(...)`, `v16_payment_history_summary(...)`.
- Delivery: `v16_create_delivery(...)`, `v16_deliveries_list(...)`, `v16_delivery_detail(...)`, `v16_transition_delivery(...)`.
- Identity authority: active `v16_user_access`, plus `v16_current_role()`, `v16_current_client_id()`, `v16_current_advisor_id()` and capability checks.

Payment and delivery write RPCs already derive `auth.uid()` and role/capabilities in PostgreSQL. Payment reversal additionally requires AAL2. Payment reversals append a reversal event and cash movement; they do not delete or rewrite the original event.

### Missing capabilities

- no V16 client-create RPC;
- no V16 create/confirm-sale RPC or immutable commercial sale snapshot;
- no global `CLASSIC | PROTECTED` setting/RPC;
- no canonical advisor commission ledger or monthly close;
- no generic operational ChatGPT-session bridge;
- the current ChatGPT application headers prove email identity but do not expose a trusted AAL2 assertion;
- no server-side canonical cost/price source is connected to issue a `PROTECTED` authorized quote. Browser totals therefore remain non-authoritative and sale confirmation remains blocked.

## Prepared code

- `/api/v16/rpc` is same-origin, derives the current application user on the server, keeps `SUPABASE_SECRET_KEY` server-only, allowlists RPC names and sanitizes error responses.
- Existing CRM, Collections, Payment History and Delivery adapters can use the same-origin bridge while preserving their direct-config fail-closed test seam.
- Payment register/reverse contracts use the live audited signatures and mandatory idempotency keys.
- Client create, global financing mode and sale confirmation contracts are typed. The browser sale request contains an authorized quote ID, never advisor identity or authoritative totals.
- `sale-snapshot.ts` now defines the immutable commercial snapshot required to freeze history.

## Prepared migration — not applied

Name: `20260927_v16_core_operational_prepared.sql`

Path: `supabase/migrations/20260927_v16_core_operational_prepared.sql`

### Tables added

- `v16_client_operational_profiles`
- `v16_client_create_requests`
- `v16_financing_mode_history`
- `v16_authorized_sale_quotes`
- `v16_sale_snapshots`
- `v16_advisor_commission_ledger`
- `v16_advisor_monthly_closes`

### Functions added

- `v16_create_client`
- `v16_get_active_financing_mode`
- `v16_set_active_financing_mode`
- `v16_issue_authorized_sale_quote` (service-role only; not exposed through the browser bridge)
- `v16_confirm_sale`
- `v16_close_advisor_month`
- `v16_financed_commission_for_cash_price`
- `v16_chatgpt_operational_bridge`

### Security and permissions

- RLS is enabled on every new exposed-schema table, with no direct `anon` or `authenticated` table privileges.
- New operational RPCs are revoked from `PUBLIC`, `anon` and `authenticated`.
- Only the server bridge and quote issuer are granted to `service_role`.
- The bridge resolves email to `auth.users`, requires an active `v16_user_access` row, injects the mapped `sub` and fixed trusted AAL, then calls a literal allowlist.
- Sale snapshots, commission ledger and monthly closes reject update/delete.
- Advisor identity comes from `v16_current_advisor_id()`; the browser contract has no advisor ID field.

### Impact

Additive schema objects plus inserts into legacy `clientes`/`ventas` only through authorized RPCs. Existing historical sales are not backfilled or recalculated. Financing-mode changes append a new effective policy and affect only quotes issued afterward.

### Logical rollback

1. Revoke `EXECUTE` on `v16_chatgpt_operational_bridge` and `v16_issue_authorized_sale_quote` from `service_role` to stop new traffic.
2. Keep immutable snapshot/ledger data for audit; do not delete operational evidence.
3. Restore the preceding financing mode by appending a compensating mode-history record.
4. After retention/export approval, drop new functions, triggers, indexes and tables in reverse dependency order. Legacy client/sale records require business reconciliation and are never deleted automatically.

### Required backend QA before activation

- Apply on an isolated Supabase branch, never production first.
- Run schema/function compilation plus security and performance advisors.
- Prove Owner/Admin, Advisor, Customer and unauthorized matrices for every RPC.
- Prove AAL1 rejects reversal/mode change and AAL2 accepts only authorized actors.
- Prove idempotent retries and conflicting-key rejection.
- Prove Client A/Sale A cannot observe or mutate Client B/Sale B.
- Prove quote mode race rejects confirmation and historical snapshots remain byte-for-byte unchanged after a mode switch.
- Prove sale quote issuance recalculates from an authoritative server-side product/cost source for both `CLASSIC` and `PROTECTED`.
- Run cash and financed end-to-end cases through payment, delivery, CRM and commission ledger.

## Activation boundary

The prepared migration was deliberately not applied. Until it is authorized, compiled on an isolated branch, and the canonical server pricing source plus trusted AAL2 signal are connected, `Registrar venta`, client creation, mode mutation and full commission closure must remain fail-closed.
