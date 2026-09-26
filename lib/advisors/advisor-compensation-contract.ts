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
