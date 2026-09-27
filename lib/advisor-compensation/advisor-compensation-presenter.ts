import type { AdvisorMonthClose } from "@/lib/internal/finance/advisor-compensation-engine";
import type { AdvisorMonthReadModel } from "./advisor-compensation-read-model";

/** Maps an immutable, server-authoritative close into the role-safe UI model. */
export function presentAdvisorMonthClose(close: AdvisorMonthClose, advisorName: string): AdvisorMonthReadModel {
  return Object.freeze({
    policyVersion: close.policyVersion,
    advisorId: close.advisorId,
    advisorName,
    period: close.period,
    closedAt: close.closedAt,
    validSales: close.validSales,
    equivalentSales: close.equivalentSales,
    progressPercent: close.bonus.progressPercent,
    bonusArs: close.bonus.bonusArs,
    mainGoalReached: close.bonus.mainGoalReached,
    additionalEquivalentSales: close.bonus.additionalEquivalentSales,
    additionalBonusArs: close.bonus.additionalBonusArs,
    nextGoalEquivalentSales: close.bonus.nextGoalEquivalentSales,
    nextGoalBonusArs: close.bonus.nextGoalBonusArs,
    remainingEquivalentSales: close.bonus.remainingEquivalentSales,
    commissionGeneratedArs: close.commissionGeneratedArs,
    commissionCollectedArs: close.commissionCollectedArs,
    commissionPendingArs: close.commissionPendingArs,
    acceptedOperations: close.acceptedOperations,
    pendingOperations: close.pendingOperations,
    excludedOperations: close.excludedOperations,
    operations: Object.freeze(close.operations.map((operation) => Object.freeze({
      saleId: operation.saleId,
      productLabel: operation.productLabel,
      finalCashPriceArs: operation.finalCashPriceArs,
      modality: operation.modality,
      commissionTotalArs: operation.commission.totalCommissionArs,
      commissionPayments: Object.freeze(operation.commissionPayments.map((payment) => Object.freeze({ ...payment }))),
      commissionCollectedArs: operation.commissionCollectedArs,
      commissionPendingArs: operation.commissionPendingArs,
      countsForBonus: operation.countsForBonus,
      validation: operation.validation,
      validationReason: operation.validationReason,
    }))),
  });
}

