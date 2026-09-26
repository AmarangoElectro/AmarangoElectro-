import {
  REFERRAL_STATUS_FLOW,
  type AcquisitionFunnelRow,
  type AdvisorGrowthLevelRule,
  type AdvisorGrowthProjection,
  type AdvisorGrowthState,
  type CapitalExposureInput,
  type ReferralFraudInput,
  type ReferralFraudSignal,
  type ReferralStatus,
  type RewardPolicy,
  type SourceAttribution,
} from "./referral-growth-contract";

function finiteNonNegative(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${label} must be finite and non-negative`);
  return value;
}

function rate(numerator: number, denominator: number) {
  if (!denominator) return null;
  return numerator / denominator;
}

export function normalizeReferralCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 32);
}

export function isValidReferralCode(value: string) {
  const normalized = normalizeReferralCode(value);
  return normalized.length >= 4 && normalized.length <= 32;
}

export function buildReferralPath(code: string) {
  const normalized = normalizeReferralCode(code);
  if (!isValidReferralCode(normalized)) throw new Error("Invalid referral code");
  return `/r/${encodeURIComponent(normalized)}`;
}

export function addReferralToUrl(url: string, referralCode: string, productId?: string | null) {
  const normalized = normalizeReferralCode(referralCode);
  if (!isValidReferralCode(normalized)) return url;
  const parsed = new URL(url, "https://amarango.local");
  parsed.searchParams.set("ref", normalized);
  parsed.searchParams.set("source", "CLIENT_REFERRAL");
  if (productId) parsed.searchParams.set("product", productId);
  return parsed.origin === "https://amarango.local" ? `${parsed.pathname}${parsed.search}${parsed.hash}` : parsed.toString();
}

export function canTransitionReferralStatus(from: ReferralStatus, to: ReferralStatus) {
  return REFERRAL_STATUS_FLOW[from].includes(to);
}

export function assertReferralStatusTransition(from: ReferralStatus, to: ReferralStatus) {
  if (!canTransitionReferralStatus(from, to)) throw new Error(`Invalid referral transition: ${from} -> ${to}`);
}

export function rewardCanBeReleased(input: {
  policy: RewardPolicy;
  status: ReferralStatus;
  validPaidAmountArs: number;
  delivered: boolean;
  salePaidInFull: boolean;
  adminApproved: boolean;
}) {
  if (!input.policy.active || input.status !== "PAYMENT_CONFIRMED") return false;
  const paid = finiteNonNegative(input.validPaidAmountArs, "validPaidAmountArs");
  switch (input.policy.releaseCondition) {
    case "FIRST_VALID_PAYMENT": return paid > 0;
    case "MINIMUM_PAID_AMOUNT": return paid >= (input.policy.minimumPaidAmountArs ?? 0);
    case "DELIVERY_AND_VALID_PAYMENT": return input.delivered && paid > 0;
    case "SALE_PAID_IN_FULL": return input.salePaidInFull;
    case "ADMIN_APPROVAL": return input.adminApproved;
  }
}

export function calculateCapitalExposure(input: CapitalExposureInput) {
  const cost = finiteNonNegative(input.costRealArs, "costRealArs");
  const direct = finiteNonNegative(input.directCostsArs, "directCostsArs");
  const commissions = finiteNonNegative(input.committedCommissionsArs, "committedCommissionsArs");
  const collected = finiteNonNegative(input.collectedArs, "collectedArs");
  return Math.max(0, cost + direct + commissions - collected);
}

export function projectAdvisorGrowth(
  state: AdvisorGrowthState,
  levels: readonly AdvisorGrowthLevelRule[],
): AdvisorGrowthProjection {
  const ordered = [...levels].sort((a,b)=>a.order-b.order);
  const current = ordered.find(level=>level.levelId===state.currentLevelId);
  if (!current) throw new Error("Current advisor level is not configured");
  const next = ordered.find(level=>level.order>current.order) ?? null;
  const availableOpenExposureArs = Math.max(0,current.maxOpenExposureArs-state.openExposureArs);
  if (!next) return Object.freeze({ currentLevel:current,nextLevel:null,availableOpenExposureArs,progressPercent:100,blockers:Object.freeze([]) });

  const checks = [
    { ok: state.paidSales >= next.minimumPaidSales, label:"Ventas cobradas" },
    { ok: state.completedOperations >= next.minimumCompletedOperations, label:"Operaciones completadas" },
    { ok: state.portfolioQuality >= next.minimumPortfolioQuality, label:"Calidad de cartera" },
    { ok: state.delinquencyRate <= next.maximumDelinquencyRate, label:"Mora" },
    { ok: state.recurringClients >= next.minimumRecurringClients, label:"Clientes recurrentes" },
    { ok: state.tenureDays >= next.minimumTenureDays, label:"Antigüedad" },
    { ok: !next.requiresCorrectDocumentation || state.correctDocumentation, label:"Documentación" },
  ];
  const blockers = checks.filter(check=>!check.ok).map(check=>check.label);
  if (next.requiresAdminApproval) blockers.push("Evaluación administrativa");
  const completed = checks.length - blockers.filter(label=>label!=="Evaluación administrativa").length;
  const progressPercent = Math.round((completed/checks.length)*100);
  return Object.freeze({ currentLevel:current,nextLevel:next,availableOpenExposureArs,progressPercent,blockers:Object.freeze(blockers) });
}

function normalizeDigits(value?: string | null) {
  return (value ?? "").replace(/\D/g,"");
}

export function referralFraudSignals(input: ReferralFraudInput): readonly ReferralFraudSignal[] {
  const signals: ReferralFraudSignal[] = [];
  if (input.referredCustomerId && input.referrerCustomerId === input.referredCustomerId) signals.push("SAME_CUSTOMER");
  const aDni=normalizeDigits(input.referrerDni), bDni=normalizeDigits(input.referredDni);
  if (aDni && bDni && aDni===bDni) signals.push("SAME_DNI");
  const aPhone=normalizeDigits(input.referrerPhone), bPhone=normalizeDigits(input.referredPhone);
  if (aPhone && bPhone && aPhone===bPhone) signals.push("SAME_PHONE");
  if (input.sharedDeviceSignal) signals.push("SHARED_DEVICE_REVIEW");
  if (input.sharedIpSignal) signals.push("SHARED_IP_REVIEW");
  return Object.freeze(signals);
}

export function referralMustBeRejected(signals: readonly ReferralFraudSignal[]) {
  return signals.some(signal=>signal==="SAME_CUSTOMER" || signal==="SAME_DNI" || signal==="SAME_PHONE");
}

export function buildAcquisitionFunnel(input: Omit<AcquisitionFunnelRow,
  "approvalRate"|"conversionRate"|"referralsPerCustomer"|"salesPerReferral"|"collectedMarginOnExposure"
>): AcquisitionFunnelRow {
  return Object.freeze({
    ...input,
    approvalRate: rate(input.approved,input.evaluations),
    conversionRate: rate(input.sales,input.leads),
    referralsPerCustomer: rate(input.referralsGenerated,input.recurringCustomers || input.paid),
    salesPerReferral: rate(input.sales,input.referralsGenerated),
    collectedMarginOnExposure: rate(input.marginCollectedArs,input.exposedCapitalArs),
  });
}

export function mergeAttribution(first: SourceAttribution | null, incoming: SourceAttribution): SourceAttribution {
  if (!first) return Object.freeze(incoming);
  return Object.freeze({
    ...first,
    productId: incoming.productId ?? first.productId ?? null,
    categoryId: incoming.categoryId ?? first.categoryId ?? null,
  });
}
