import type { V414SuggestedProductMetadata } from "./v414-types";

export type V415PhotoAnalysisLevel = "deterministic" | "ocr" | "ai_fallback";

export interface V415PhotoAnalyzerRequest {
  readonly imageFingerprint: string;
  readonly imageReference: string;
  readonly requestedLevels: readonly V415PhotoAnalysisLevel[];
  readonly existingProductName: string | null;
  readonly explicitAdminAction: boolean;
  readonly reason: string;
}

export interface V415PhotoAnalyzerResult {
  readonly providerId: string;
  readonly providerVersion: string;
  readonly suggestion: V414SuggestedProductMetadata;
  readonly cache: "hit" | "miss";
  readonly estimatedCostUSCents: number;
  readonly externalCallMade: boolean;
  readonly humanApprovalRequired: true;
  readonly publishAutomatically: false;
}

/**
 * Integration boundary only. V4.15 intentionally ships without a network
 * implementation, credentials or a provider SDK.
 */
export interface PhotoAnalyzerProvider {
  readonly id: string;
  readonly version: string;
  readonly capabilities: readonly V415PhotoAnalysisLevel[];
  analyze(request: V415PhotoAnalyzerRequest): Promise<V415PhotoAnalyzerResult>;
}

export interface V415PhotoAnalyzerPolicy {
  readonly deterministicFirst: true;
  readonly cacheByFingerprint: true;
  readonly explicitReanalysisOnly: true;
  readonly humanApprovalRequired: true;
  readonly automaticPublishAllowed: false;
  readonly monthlyBudgetUSCents: number;
  readonly hardBudgetStop: true;
}

export const V415_PHOTO_ANALYZER_POLICY: V415PhotoAnalyzerPolicy = Object.freeze({
  deterministicFirst: true,
  cacheByFingerprint: true,
  explicitReanalysisOnly: true,
  humanApprovalRequired: true,
  automaticPublishAllowed: false,
  monthlyBudgetUSCents: 2_500,
  hardBudgetStop: true,
});

export function validatePhotoAnalyzerResult(
  result: V415PhotoAnalyzerResult,
  request: V415PhotoAnalyzerRequest,
  spentUSCents: number,
  policy: V415PhotoAnalyzerPolicy = V415_PHOTO_ANALYZER_POLICY,
): readonly string[] {
  const errors: string[] = [];
  if (result.suggestion.imageFingerprint !== request.imageFingerprint) errors.push("fingerprint_mismatch");
  if (result.humanApprovalRequired !== true) errors.push("human_approval_required");
  if (result.publishAutomatically !== false) errors.push("automatic_publish_forbidden");
  if (result.estimatedCostUSCents < 0) errors.push("negative_estimated_cost");
  if (result.cache === "hit" && result.estimatedCostUSCents !== 0) errors.push("cache_hit_must_cost_zero");
  if (result.externalCallMade && !request.explicitAdminAction) errors.push("explicit_admin_action_required");
  if (result.externalCallMade && spentUSCents + result.estimatedCostUSCents > policy.monthlyBudgetUSCents) {
    errors.push("monthly_budget_exceeded");
  }
  return Object.freeze(errors);
}

