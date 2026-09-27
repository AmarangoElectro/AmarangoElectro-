/**
 * V16 advisor compensation policy.
 *
 * This module is the single source of truth for financed commissions and
 * monthly performance bonuses. Amounts are expressed in ARS and all range
 * checks use the final cash price of the product.
 */

export const ADVISOR_COMPENSATION_POLICY_VERSION = "2026-09-26";

export interface FinancedCommissionTier {
  readonly minCashPriceArs: number;
  readonly maxCashPriceArs: number | null;
  readonly commissionArs: number;
}

export interface MonthlyBonusTier {
  readonly equivalentSales: number;
  readonly bonusArs: number;
}

export const FINANCED_COMMISSION_PAYMENT_COUNT = 2 as const;
export const LOW_VALUE_SALE_THRESHOLD_ARS = 50_000;
export const LOW_VALUE_SALE_EQUIVALENCE = 0.5;
export const STANDARD_SALE_EQUIVALENCE = 1;
export const MONTHLY_BONUS_AFTER_TWENTY_ARS = 7_500;

export const FINANCED_COMMISSION_TIERS: readonly FinancedCommissionTier[] = Object.freeze([
  Object.freeze({ minCashPriceArs: 0, maxCashPriceArs: 49_999, commissionArs: 7_500 }),
  Object.freeze({ minCashPriceArs: 50_000, maxCashPriceArs: 99_999, commissionArs: 12_000 }),
  Object.freeze({ minCashPriceArs: 100_000, maxCashPriceArs: 149_999, commissionArs: 16_000 }),
  Object.freeze({ minCashPriceArs: 150_000, maxCashPriceArs: 199_999, commissionArs: 20_000 }),
  Object.freeze({ minCashPriceArs: 200_000, maxCashPriceArs: 249_999, commissionArs: 24_000 }),
  Object.freeze({ minCashPriceArs: 250_000, maxCashPriceArs: 299_999, commissionArs: 28_000 }),
  Object.freeze({ minCashPriceArs: 300_000, maxCashPriceArs: 399_999, commissionArs: 37_500 }),
  Object.freeze({ minCashPriceArs: 400_000, maxCashPriceArs: 499_999, commissionArs: 45_000 }),
  Object.freeze({ minCashPriceArs: 500_000, maxCashPriceArs: 599_999, commissionArs: 52_500 }),
  Object.freeze({ minCashPriceArs: 600_000, maxCashPriceArs: 699_999, commissionArs: 60_000 }),
  Object.freeze({ minCashPriceArs: 700_000, maxCashPriceArs: 799_999, commissionArs: 70_000 }),
  Object.freeze({ minCashPriceArs: 800_000, maxCashPriceArs: 899_999, commissionArs: 80_000 }),
  Object.freeze({ minCashPriceArs: 900_000, maxCashPriceArs: 999_999, commissionArs: 90_000 }),
  Object.freeze({ minCashPriceArs: 1_000_000, maxCashPriceArs: null, commissionArs: 100_000 }),
]);

export const MONTHLY_BONUS_TIERS: readonly MonthlyBonusTier[] = Object.freeze([
  Object.freeze({ equivalentSales: 5, bonusArs: 10_000 }),
  Object.freeze({ equivalentSales: 10, bonusArs: 35_000 }),
  Object.freeze({ equivalentSales: 15, bonusArs: 65_000 }),
  Object.freeze({ equivalentSales: 20, bonusArs: 100_000 }),
]);

