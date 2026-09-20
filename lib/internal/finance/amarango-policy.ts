import type { CommercePolicy } from "./calculator-engine";

/**
 * Most recent AmarangoElectro internal pricing policy audited in the Legacy
 * calculator and the July 2026 collaborator model. Admin-only. Never import
 * this module from the public storefront.
 */
export const AMARANGO_POLICY_VERSION = "2026-07-19";

export const AMARANGO_CURRENT_POLICY: CommercePolicy = Object.freeze({
  currency: "ARS" as const,
  pricingTiers: Object.freeze([
    Object.freeze({ maxCost: 50_000, markupPercent: 80 }),
    Object.freeze({ maxCost: 100_000, markupPercent: 60 }),
    Object.freeze({ maxCost: 250_000, markupPercent: 50 }),
    Object.freeze({ maxCost: 350_000, markupPercent: 40 }),
    Object.freeze({ maxCost: null, markupPercent: 30 }),
  ]),
  installmentPlans: Object.freeze([
    Object.freeze({ installments: 2, surchargePercent: 15, active: true }),
    Object.freeze({ installments: 3, surchargePercent: 36, active: false }),
    Object.freeze({ installments: 4, surchargePercent: 55, active: true }),
    Object.freeze({ installments: 5, surchargePercent: 66, active: false }),
    Object.freeze({ installments: 6, surchargePercent: 78, active: true }),
    Object.freeze({ installments: 7, surchargePercent: 87, active: false }),
    Object.freeze({ installments: 8, surchargePercent: 93, active: false }),
    Object.freeze({ installments: 9, surchargePercent: 99, active: false }),
    Object.freeze({ installments: 10, surchargePercent: 105, active: false }),
    Object.freeze({ installments: 11, surchargePercent: 111, active: false }),
    Object.freeze({ installments: 12, surchargePercent: 117, active: false }),
  ]),
  commission: Object.freeze({ cashPercent: 10, financedPercent: 15 }),
  rounding: Object.freeze({ sale: 500, installment: 1_000, commission: 500 }),
});

export const amarangoPolicyGovernance = Object.freeze({
  adminOnly: true,
  publicStorefrontMayReadValidatedQuotesOnly: true,
  editableOnlyThroughAuthorizedAdminPolicy: true,
  versionRequired: true,
  auditLogRequired: true,
  mfaRequiredToPublishPolicyChange: true,
  localStorageIsNeverAuthoritative: true,
});
