export const V16_GROWTH_CONTRACT_VERSION = "V16_GROWTH_REFERRALS_1" as const;

export type ReferralStatus =
  | "CLICK"
  | "LEAD"
  | "EVALUATION"
  | "APPROVED"
  | "REJECTED"
  | "SALE_CREATED"
  | "PAYMENT_CONFIRMED"
  | "REWARD_AVAILABLE"
  | "REWARD_USED"
  | "CANCELLED";

export type RewardType =
  | "AMARANGO_BALANCE"
  | "NEXT_PURCHASE_DISCOUNT"
  | "COUPON"
  | "GIFT"
  | "SPECIAL_BENEFIT"
  | "SHIPPING_BENEFIT"
  | "OTHER";

export type RewardReleaseCondition =
  | "FIRST_VALID_PAYMENT"
  | "MINIMUM_PAID_AMOUNT"
  | "DELIVERY_AND_VALID_PAYMENT"
  | "SALE_PAID_IN_FULL"
  | "ADMIN_APPROVAL";

export type AcquisitionSource =
  | "DIRECT"
  | "WHATSAPP"
  | "INSTAGRAM"
  | "FACEBOOK"
  | "META_ADS"
  | "CLIENT_REFERRAL"
  | "ADVISOR"
  | "ORGANIC"
  | "CAMPAIGN"
  | "OTHER";

export interface SourceAttribution {
  source: AcquisitionSource;
  referralCode?: string | null;
  referrerCustomerId?: string | null;
  advisorId?: string | null;
  campaignId?: string | null;
  productId?: string | null;
  categoryId?: string | null;
  capturedAt: string;
}

export interface ReferralRecord {
  referralId: string;
  referralCode: string;
  referrerCustomerId: string;
  referrerDisplayName?: string | null;
  referredCustomerId: string | null;
  referredDisplayName?: string | null;
  leadId: string | null;
  saleId: string | null;
  productId: string | null;
  source: "CLIENT_REFERRAL";
  status: ReferralStatus;
  enteredAt: string;
  updatedAt: string;
}

export interface ReferralSummary {
  sentCount: number;
  generatedSalesCount: number;
  pendingBenefitsCount: number;
  availableBenefitsCount: number;
  usedBenefitsCount: number;
}

export interface CustomerReferralIdentity {
  customerId: string;
  referralCode: string;
  referralPath: string;
  displayName: string | null;
}

export interface RewardPolicy {
  policyId: string;
  name: string;
  active: boolean;
  rewardType: RewardType;
  fixedValueArs?: number | null;
  percentValue?: number | null;
  maxValueArs?: number | null;
  minimumPurchaseArs?: number | null;
  expiresAfterDays?: number | null;
  allowedProductIds?: readonly string[];
  allowedCategoryIds?: readonly string[];
  releaseCondition: RewardReleaseCondition;
  minimumPaidAmountArs?: number | null;
  priority?: number;
}

export interface CustomerBenefit {
  benefitId: string;
  rewardType: RewardType;
  label: string;
  valueArs: number | null;
  percentValue: number | null;
  availableAt: string | null;
  expiresAt: string | null;
  usedAt: string | null;
  status: "PENDING" | "AVAILABLE" | "USED" | "EXPIRED" | "CANCELLED";
  sourceReferralId: string | null;
}

export interface CustomerGrowthSnapshot {
  identity: CustomerReferralIdentity;
  summary: ReferralSummary;
  referrals: readonly ReferralRecord[];
  benefits: readonly CustomerBenefit[];
}

export interface AdvisorGrowthLevelRule {
  levelId: string;
  label: string;
  order: number;
  active?: boolean;
  maxExposurePerSaleArs: number;
  maxOpenExposureArs: number;
  minimumPaidSales: number;
  minimumCompletedOperations: number;
  minimumPortfolioQuality: number;
  maximumDelinquencyRate: number;
  minimumRecurringClients: number;
  minimumTenureDays: number;
  requiresCorrectDocumentation: boolean;
  requiresAdminApproval: boolean;
  benefits?: readonly string[];
}

export interface AdvisorGrowthState {
  advisorId: string;
  currentLevelId: string | null;
  openExposureArs: number;
  openOperations: number;
  portfolioQuality: number | null;
  delinquencyRate: number | null;
  paidSales: number;
  completedOperations: number;
  recurringClients: number;
  tenureDays: number;
  correctDocumentation: boolean;
}

export interface AdvisorGrowthProjection {
  currentLevel: AdvisorGrowthLevelRule;
  nextLevel: AdvisorGrowthLevelRule | null;
  availableOpenExposureArs: number;
  progressPercent: number;
  blockers: readonly string[];
}

export interface CapitalExposureInput {
  costRealArs: number;
  directCostsArs: number;
  committedCommissionsArs: number;
  collectedArs: number;
}

export interface ReferralFraudInput {
  referrerCustomerId: string;
  referredCustomerId?: string | null;
  referrerDni?: string | null;
  referredDni?: string | null;
  referrerPhone?: string | null;
  referredPhone?: string | null;
  sharedDeviceSignal?: boolean;
  sharedIpSignal?: boolean;
}

export type ReferralFraudSignal =
  | "SAME_CUSTOMER"
  | "SAME_DNI"
  | "SAME_PHONE"
  | "SHARED_DEVICE_REVIEW"
  | "SHARED_IP_REVIEW";

export interface AcquisitionFilters {
  source?: AcquisitionSource | null;
  campaignId?: string | null;
  advisorId?: string | null;
  referrerCustomerId?: string | null;
  productId?: string | null;
  categoryId?: string | null;
  periodPreset?: "7d" | "30d" | "90d" | null;
  periodFrom?: string | null;
  periodTo?: string | null;
}

export interface AcquisitionFunnelRow {
  visits: number;
  leads: number;
  evaluations: number;
  approved: number;
  sales: number;
  paid: number;
  recurringCustomers: number;
  referralsGenerated: number;
  costPerLeadArs: number | null;
  costPerCustomerArs: number | null;
  approvalRate: number | null;
  conversionRate: number | null;
  marginGeneratedArs: number;
  marginCollectedArs: number;
  delinquencyRate: number | null;
  exposedCapitalArs: number;
  referralsPerCustomer: number | null;
  salesPerReferral: number | null;
  collectedMarginOnExposure: number | null;
}

export type GrowthDomainEventType =
  | "PRODUCT_DELIVERED"
  | "VALID_PAYMENT_CONFIRMED"
  | "CREDIT_COMPLETED"
  | "CUSTOMER_LEVEL_CHANGED"
  | "BENEFIT_AVAILABLE"
  | "REFERRAL_STATUS_CHANGED"
  | "ADVISOR_LEVEL_CHANGED";

export interface GrowthDomainEvent {
  eventId: string;
  type: GrowthDomainEventType;
  occurredAt: string;
  customerId?: string | null;
  advisorId?: string | null;
  saleId?: string | null;
  referralId?: string | null;
  benefitId?: string | null;
  metadata?: Readonly<Record<string, string | number | boolean | null>>;
}

export interface AdvisorApplication {
  applicationId: string;
  customerId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  customerName?: string | null;
}

export const REFERRAL_STATUS_FLOW: Readonly<Record<ReferralStatus, readonly ReferralStatus[]>> = Object.freeze({
  CLICK: Object.freeze(["LEAD","CANCELLED"]),
  LEAD: Object.freeze(["EVALUATION","REJECTED","CANCELLED"]),
  EVALUATION: Object.freeze(["APPROVED","REJECTED","CANCELLED"]),
  APPROVED: Object.freeze(["SALE_CREATED","CANCELLED"]),
  REJECTED: Object.freeze([]),
  SALE_CREATED: Object.freeze(["PAYMENT_CONFIRMED","CANCELLED"]),
  PAYMENT_CONFIRMED: Object.freeze(["REWARD_AVAILABLE","CANCELLED"]),
  REWARD_AVAILABLE: Object.freeze(["REWARD_USED","CANCELLED"]),
  REWARD_USED: Object.freeze([]),
  CANCELLED: Object.freeze([]),
});
