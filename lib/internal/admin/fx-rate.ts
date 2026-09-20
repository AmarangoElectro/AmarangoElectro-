export interface FxRateDraft {
  currency: "USD";
  arsPerUnit: number;
  effectiveAt: number;
  sourceNote?: string | null;
}

export function validateFxRateDraft(draft: FxRateDraft): void {
  if (draft.currency !== "USD") throw new Error("Only USD is supported by this admin foundation");
  if (!Number.isFinite(draft.arsPerUnit) || draft.arsPerUnit <= 0) throw new RangeError("arsPerUnit must be positive");
  if (!Number.isSafeInteger(draft.arsPerUnit)) throw new RangeError("arsPerUnit must be an integer ARS quote");
  if (!Number.isFinite(draft.effectiveAt) || draft.effectiveAt <= 0) throw new RangeError("effectiveAt must be valid");
}

export function usdCostToArs(usd: number, fx: FxRateDraft): number {
  validateFxRateDraft(fx);
  if (!Number.isFinite(usd) || usd <= 0) throw new RangeError("usd must be positive");
  return Math.round(usd * fx.arsPerUnit);
}

export const fxMutationRequirements = Object.freeze({
  authenticatedAdmin: true,
  mfa: true,
  serverSideAuthorization: true,
  auditBeforeAfter: true,
  clientOnlyMutationAllowed: false,
});
