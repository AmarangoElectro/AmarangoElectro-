export interface AdvisorMonthlyCompensationSnapshot {
  monthKey: string;
  advisorId: string;
  validSales: number;
  equivalentSales: number;
  commissionGeneratedArs: number;
  commissionPaidArs: number;
  commissionPendingArs: number;
  bonusArs: number;
  pendingValidationCount: number;
  closed: boolean;
  closedAt: string | null;
}

export interface AdvisorMonthlyCompensationAdminRow extends AdvisorMonthlyCompensationSnapshot {
  advisorName: string;
  excludedCount: number;
}

export type AdvisorCompensationResult<T> =
  | { status: "ok"; data: T }
  | { status: "not_connected" }
  | { status: "unauthorized" }
  | { status: "step_up_required" }
  | { status: "error"; message: string };


export interface AdvisorMonthlyCompensationOperation {
  saleId: string;
  advisorId: string;
  advisorName?: string | null;
  productName: string;
  cashPriceArs: number;
  paymentMode: "CASH" | "FINANCED";
  commissionTotalArs: number;
  commissionPaymentCount: 1 | 2;
  commissionPaymentsArs: readonly number[];
  commissionPaidArs: number;
  commissionPendingArs: number;
  countsForBonus: boolean;
  equivalentSales: number;
  validationStatus: "VALID" | "PENDING_VALID_PAYMENT" | "PENDING_DELIVERY" | "FINANCED_ARREARS" | "CANCELLED";
  validationReason: string;
  delivered: boolean;
  installmentsCurrent: boolean | null;
}
