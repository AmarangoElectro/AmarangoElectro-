/**
 * V16 ASESORES / ADVISORS — RPC CONTRACT.
 *
 * Source: AMARANGOELECTRO-V16-ADVISORS-RPC-FROZEN-CONTRACT-V3-20260915.md,
 * regenerated from the live Supabase project's current TypeScript types
 * (PostgREST types version 14.5) — not inferred, not guessed. This V3
 * document explicitly replaces V1/V2 for this writer.
 *
 * This UI only implements the RPCs the frozen contract marks as safely
 * client-callable right now:
 * - `v16_advisor_portfolio_summary` (no args)
 * - `v16_advisor_portfolio_list` (`p_`-prefixed args)
 * - `v16_create_advisor_profile` (`p_`-prefixed args)
 * - `v16_assign_advisor_client` (`p_`-prefixed args)
 * - `v16_end_advisor_client_assignment` (`p_`-prefixed args)
 *
 * Deliberately NOT implemented here, per the frozen contract's own
 * conditions: `v16_link_advisor_identity`, `v16_disable_advisor_identity`
 * (both explicitly gated on "only if a safe `user_id` source already
 * exists" — none exists in this repo, and the contract explicitly forbids
 * inventing an `auth.users` selector or using `auth.admin` from the
 * frontend) and `v16_claim_advisor_auth_enrollment` (explicitly "only
 * within an existing secure flow" — no such flow exists here). Building UI
 * for any of these three would mean inventing an unsafe way to obtain the
 * `user_id`/`enrollment_id` they need, which the contract forbids. This is
 * a documented, intentional gap (identity/invitation control-plane),
 * explicitly called out as post-launch and non-blocking for this gate.
 *
 * Also never called from this frontend: `v16_advisor_can_access_client` —
 * a server-only helper (anon/authenticated EXECUTE both false; postgres/
 * service_role only) consumed internally by CRM/Cobranzas/Payment History
 * RPCs, never by admin UI code.
 *
 * Canonical portfolio authority is `v16_advisor_client_portfolio`
 * (server-side, never read directly). This UI must never derive advisor
 * scoping from `ventas.responsable`, advisor name, email, reseller, or any
 * legacy heuristic.
 */

export const V16_ADVISORS_CONTRACT_VERSION = "V16_ADVISORS_RPC_FROZEN_CONTRACT_V3" as const;

/** `v16_advisor_portfolio_summary()` return row — one row per advisor, no args. */
export interface V16AdvisorPortfolioSummaryRow {
  advisor_id: string;
  advisor_name: string;
  advisor_active: boolean;
  active_clients: number;
  historical_assignments: number;
  latest_assignment_at: string;
}

/** `v16_advisor_portfolio_list` return row. */
export interface V16AdvisorPortfolioListRow {
  advisor_id: string;
  advisor_name: string;
  advisor_active: boolean;
  assignment_id: number;
  client_id: string;
  client_name: string;
  client_locality: string;
  assigned_at: string;
  ended_at: string;
  assignment_active: boolean;
}

/** `v16_create_advisor_profile` return row. */
export interface V16AdvisorProfileRow {
  advisor_id: string;
  nombre: string;
  telefono: string;
  email: string;
  localidad: string;
  activo: boolean;
  creado_at: string;
}

/** `v16_assign_advisor_client` / `v16_end_advisor_client_assignment` return row (identical shape). */
export interface V16AdvisorAssignmentRow {
  assignment_id: number;
  advisor_id: string;
  client_id: string;
  assigned_at: string;
  ended_at: string;
  active: boolean;
}

/** `v16_advisor_portfolio_list` args — `p_`-prefixed, per the frozen contract. */
export interface V16AdvisorPortfolioListParams {
  advisorId?: string | null;
  activeOnly?: boolean;
  searchText?: string | null;
  rowLimit?: number;
  rowOffset?: number;
}

/** `v16_create_advisor_profile` args — `p_`-prefixed. `nombre`/`telefono` are required by the frozen contract. */
export interface V16AdvisorCreateProfileParams {
  nombre: string;
  telefono: string;
  email?: string | null;
  localidad?: string | null;
  note?: string | null;
}

/** `v16_assign_advisor_client` args — `p_`-prefixed. */
export interface V16AdvisorAssignClientParams {
  advisorId: string;
  clientId: string;
  assignedAt?: string | null;
  note?: string | null;
}

/** `v16_end_advisor_client_assignment` args — `p_`-prefixed. `reason` is required by the frozen contract. */
export interface V16AdvisorEndAssignmentParams {
  assignmentId: number;
  reason: string;
  endedAt?: string | null;
}
