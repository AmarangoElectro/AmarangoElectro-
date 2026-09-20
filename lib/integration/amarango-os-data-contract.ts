export type EntityId = string;
export type IsoDateTime = string;
export type ArsAmount = number;

export interface CustomerRecord {
  id: EntityId;
  fullName: string;
  documentNumber: string | null;
  phone: string | null;
  address: string | null;
  locality: string | null;
  occupation: string | null;
  references: readonly string[];
  notes: string | null;
  createdAt: IsoDateTime;
}

export interface SaleRecord {
  id: EntityId;
  customerId: EntityId;
  resellerId: EntityId | null;
  frequency: "monthly" | "biweekly";
  discountArs: ArsAmount;
  shippingArs: ArsAmount;
  status: "draft" | "confirmed" | "cancelled" | "completed";
  soldAt: IsoDateTime | null;
}

export interface SaleItemRecord {
  id: EntityId;
  saleId: EntityId;
  productId: EntityId;
  productNameSnapshot: string;
  modelSnapshot: string | null;
  unitPriceArsSnapshot: ArsAmount;
  unitCostArsSnapshot: ArsAmount | null;
  supplierSnapshot: string | null;
  priceUpdatedAtSnapshot: IsoDateTime | null;
}

export interface InstallmentRecord {
  id: EntityId;
  saleId: EntityId;
  sequence: number;
  dueAt: IsoDateTime;
  amountArs: ArsAmount;
  status: "pending" | "partial" | "paid" | "overdue" | "cancelled";
}

export interface PaymentRecord {
  id: EntityId;
  customerId: EntityId;
  saleId: EntityId | null;
  installmentId: EntityId | null;
  amountArs: ArsAmount;
  paidAt: IsoDateTime;
  receiptId: EntityId | null;
}

export interface ResellerRecord {
  id: EntityId;
  displayName: string;
  active: boolean;
}

export interface CommissionRecord {
  id: EntityId;
  saleId: EntityId;
  resellerId: EntityId;
  baseAmountArs: ArsAmount;
  percentage: number | null;
  amountArs: ArsAmount;
  status: "pending" | "approved" | "paid" | "cancelled";
}

export interface ResponsibleAssignmentRecord {
  id: EntityId;
  saleId: EntityId;
  responsibleUserId: EntityId;
  responsibility: string;
}

export interface InvestorRecord {
  id: EntityId;
  displayName: string;
  active: boolean;
}

export interface SaleInvestmentRecord {
  id: EntityId;
  saleId: EntityId;
  investorId: EntityId;
  participationPercentage: number;
  capitalRequestedArs: ArsAmount;
  capitalContributedArs: ArsAmount | null;
  profitShareArs: ArsAmount | null;
  status: "requested" | "accepted" | "rejected" | "settled";
}

export interface CashMovementRecord {
  id: EntityId;
  direction: "income" | "expense";
  amountArs: ArsAmount;
  occurredAt: IsoDateTime;
  saleId: EntityId | null;
  paymentId: EntityId | null;
  category: string;
  responsibleUserId: EntityId;
}

export interface DeliveryRecord {
  id: EntityId;
  saleId: EntityId;
  mode: "delivery" | "pickup";
  status: "pending" | "scheduled" | "delivered" | "cancelled";
  scheduledAt: IsoDateTime | null;
  deliveredAt: IsoDateTime | null;
  addressSnapshot: string | null;
  observations: string | null;
}

export interface ReceiptRecord {
  id: EntityId;
  storageReference: string;
  mimeType: string;
  createdAt: IsoDateTime;
  uploadedByUserId: EntityId;
}

export interface AuditEventRecord {
  id: EntityId;
  actorUserId: EntityId;
  action: string;
  entityType: string;
  entityId: EntityId;
  occurredAt: IsoDateTime;
  beforeDigest: string | null;
  afterDigest: string | null;
}

export const amarangoOsDataContract = Object.freeze({
  version: "amarango-os/v3",
  status: "documentation-only",
  persistenceEnabled: false,
  realDataEnabled: false,
  storefrontCatalogIsCanonical: true,
  saleItemsUseHistoricalSnapshots: true,
  administrativeDomainsStayPrivate: true,
});
