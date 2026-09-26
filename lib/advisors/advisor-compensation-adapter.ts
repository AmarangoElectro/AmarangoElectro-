import type {
  AdvisorCompensationResult,
  AdvisorMonthlyCompensationAdminRow,
  AdvisorMonthlyCompensationOperation,
  AdvisorMonthlyCompensationSnapshot,
} from "./advisor-compensation-contract";

export interface AdvisorCompensationAdapter {
  getCurrentMonth(): Promise<AdvisorCompensationResult<AdvisorMonthlyCompensationSnapshot>>;
  listCurrentMonthAdmin(): Promise<AdvisorCompensationResult<readonly AdvisorMonthlyCompensationAdminRow[]>>;
  listCurrentMonthOperations(): Promise<AdvisorCompensationResult<readonly AdvisorMonthlyCompensationOperation[]>>;
  listCurrentMonthOperationsAdmin(advisorId?: string): Promise<AdvisorCompensationResult<readonly AdvisorMonthlyCompensationOperation[]>>;
}

/**
 * Backend wiring is intentionally fail-closed in this prep gate.
 * The UI may display the published compensation policy, but never fabricates
 * monthly sales, paid commission, pending commission, bonus or validation state.
 */
export const NOT_CONNECTED_ADVISOR_COMPENSATION_ADAPTER: AdvisorCompensationAdapter = Object.freeze({
  async getCurrentMonth(){ return {status:"not_connected"}; },
  async listCurrentMonthAdmin(){ return {status:"not_connected"}; },
  async listCurrentMonthOperations(){ return {status:"not_connected"}; },
  async listCurrentMonthOperationsAdmin(){ return {status:"not_connected"}; },
});

export function createAdvisorCompensationAdapter(): AdvisorCompensationAdapter {
  return NOT_CONNECTED_ADVISOR_COMPENSATION_ADAPTER;
}
