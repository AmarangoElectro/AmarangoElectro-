/**
 * Read-only UI contract for V16 advisor compensation.
 *
 * The read model must be built from a server-authoritative month close (sale,
 * delivery, collection, advisor and commission-payment facts). The storefront
 * never persists or derives an authoritative month in localStorage.
 */

export type AdvisorCompensationReadResult<T> =
  | { readonly status: "ok"; readonly data: T }
  | { readonly status: "not_connected" }
  | { readonly status: "unauthorized" }
  | { readonly status: "error"; readonly message: string };

export interface AdvisorCommissionOperationReadModel {
  readonly saleId: string;
  readonly productLabel: string;
  readonly finalCashPriceArs: number;
  readonly modality: "cash" | "financed";
  readonly commissionTotalArs: number;
  readonly commissionPayments: readonly {
    readonly part: number;
    readonly amountArs: number;
    readonly status: "collected" | "pending";
  }[];
  readonly commissionCollectedArs: number;
  readonly commissionPendingArs: number;
  readonly countsForBonus: boolean;
  readonly validation: "accepted" | "pending" | "excluded";
  readonly validationReason: string;
}

export interface AdvisorMonthReadModel {
  readonly policyVersion: string;
  readonly advisorId: string;
  readonly advisorName: string;
  readonly period: string;
  readonly closedAt: string | null;
  readonly validSales: number;
  readonly equivalentSales: number;
  readonly progressPercent: number;
  readonly bonusArs: number;
  readonly mainGoalReached: boolean;
  readonly additionalEquivalentSales: number;
  readonly additionalBonusArs: number;
  readonly nextGoalEquivalentSales: number | null;
  readonly nextGoalBonusArs: number | null;
  readonly remainingEquivalentSales: number;
  readonly commissionGeneratedArs: number;
  readonly commissionCollectedArs: number;
  readonly commissionPendingArs: number;
  readonly acceptedOperations: number;
  readonly pendingOperations: number;
  readonly excludedOperations: number;
  readonly operations: readonly AdvisorCommissionOperationReadModel[];
}

export const NOT_CONNECTED_ADVISOR_MONTH: AdvisorCompensationReadResult<AdvisorMonthReadModel> = Object.freeze({
  status: "not_connected",
});

export const NOT_CONNECTED_ADVISOR_MONTHS: AdvisorCompensationReadResult<readonly AdvisorMonthReadModel[]> = Object.freeze({
  status: "not_connected",
});

