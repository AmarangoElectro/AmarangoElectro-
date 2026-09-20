export interface V414AiCostState {
  readonly monthlyBudgetUSCents: number;
  readonly estimatedUnitCostUSCents: number;
  readonly analysisCount: number;
  readonly estimatedSpentUSCents: number;
  readonly blocked: boolean;
}

export function createV414AiCostState(
  monthlyBudgetUSCents = 2_500,
  estimatedUnitCostUSCents = 1,
): V414AiCostState {
  if (monthlyBudgetUSCents < 0 || estimatedUnitCostUSCents <= 0) throw new Error("invalid_cost_policy");
  return Object.freeze({
    monthlyBudgetUSCents,
    estimatedUnitCostUSCents,
    analysisCount: 0,
    estimatedSpentUSCents: 0,
    blocked: monthlyBudgetUSCents < estimatedUnitCostUSCents,
  });
}

export function accountV414AiAnalysis(
  state: V414AiCostState,
  options: { readonly cacheHit: boolean; readonly explicitAdminAction: boolean },
) {
  if (options.cacheHit) return Object.freeze({ state, charged: false, reason: "cache_hit" as const });
  if (!options.explicitAdminAction) return Object.freeze({ state, charged: false, reason: "admin_action_required" as const });
  if (state.estimatedSpentUSCents + state.estimatedUnitCostUSCents > state.monthlyBudgetUSCents) {
    return Object.freeze({ state: Object.freeze({ ...state, blocked: true }), charged: false, reason: "budget_limit" as const });
  }
  const estimatedSpentUSCents = state.estimatedSpentUSCents + state.estimatedUnitCostUSCents;
  return Object.freeze({
    state: Object.freeze({
      ...state,
      analysisCount: state.analysisCount + 1,
      estimatedSpentUSCents,
      blocked: estimatedSpentUSCents + state.estimatedUnitCostUSCents > state.monthlyBudgetUSCents,
    }),
    charged: true,
    reason: "simulated_analysis_accounted" as const,
  });
}
