export type ActiveFinancingMode = "CLASSIC" | "PROTECTED";

export interface V16ActiveFinancingModeRow {
  active_financing_mode: ActiveFinancingMode;
  policy_version: string;
  effective_from: string;
  updated_at: string;
}

export interface V16SetActiveFinancingModeParams {
  mode: ActiveFinancingMode;
  expectedPolicyVersion: string;
  reason: string;
  idempotencyKey: string;
}

export const V16_ACTIVE_FINANCING_MODE_CONTRACT = Object.freeze({
  values: ["CLASSIC", "PROTECTED"] as const,
  futureOperationsOnly: true,
  historicalSnapshotRecalculationAllowed: false,
  ownerAdminOnly: true,
  stepUpRequiredForChange: true,
});
