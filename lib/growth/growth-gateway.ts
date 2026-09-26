import type {
  AcquisitionFilters,
  AcquisitionFunnelRow,
  AdvisorApplication,
  AdvisorGrowthLevelRule,
  AdvisorGrowthState,
  CustomerGrowthSnapshot,
  ReferralRecord,
  RewardPolicy,
} from "./referral-growth-contract";

export type GrowthGatewayResult<T> =
  | { status:"ok"; data:T }
  | { status:"not_connected" }
  | { status:"unauthorized" }
  | { status:"step_up_required" }
  | { status:"error"; message:string };

export interface GrowthGateway {
  getCurrentCustomerGrowth(): Promise<GrowthGatewayResult<CustomerGrowthSnapshot>>;
  listRewardPolicies(): Promise<GrowthGatewayResult<readonly RewardPolicy[]>>;
  saveRewardPolicy(policy: RewardPolicy): Promise<GrowthGatewayResult<RewardPolicy>>;
  getAcquisitionFunnel(filters?: AcquisitionFilters): Promise<GrowthGatewayResult<AcquisitionFunnelRow>>;
  listReferrals(filters?: AcquisitionFilters): Promise<GrowthGatewayResult<readonly ReferralRecord[]>>;
  listAdvisorLevels(): Promise<GrowthGatewayResult<readonly AdvisorGrowthLevelRule[]>>;
  saveAdvisorLevel(rule: AdvisorGrowthLevelRule): Promise<GrowthGatewayResult<AdvisorGrowthLevelRule>>;
  getAdvisorGrowthStates(): Promise<GrowthGatewayResult<readonly AdvisorGrowthState[]>>;
  getCurrentAdvisorGrowth(): Promise<GrowthGatewayResult<AdvisorGrowthState>>;
  requestAdvisorApplication(): Promise<GrowthGatewayResult<AdvisorApplication>>;
  listAdvisorApplications(): Promise<GrowthGatewayResult<readonly AdvisorApplication[]>>;
  reviewAdvisorApplication(applicationId: string, decision: "APPROVED" | "REJECTED"): Promise<GrowthGatewayResult<AdvisorApplication>>;
}

/**
 * Deliberately disconnected until a frozen/authenticated backend contract exists.
 * Never fabricate referral codes, rewards, advisor limits, or funnel metrics.
 */
export const NOT_CONNECTED_GROWTH_GATEWAY: GrowthGateway = Object.freeze({
  async getCurrentCustomerGrowth(){ return {status:"not_connected"}; },
  async listRewardPolicies(){ return {status:"not_connected"}; },
  async saveRewardPolicy(){ return {status:"not_connected"}; },
  async getAcquisitionFunnel(){ return {status:"not_connected"}; },
  async listReferrals(){ return {status:"not_connected"}; },
  async listAdvisorLevels(){ return {status:"not_connected"}; },
  async saveAdvisorLevel(){ return {status:"not_connected"}; },
  async getAdvisorGrowthStates(){ return {status:"not_connected"}; },
  async getCurrentAdvisorGrowth(){ return {status:"not_connected"}; },
  async requestAdvisorApplication(){ return {status:"not_connected"}; },
  async listAdvisorApplications(){ return {status:"not_connected"}; },
  async reviewAdvisorApplication(){ return {status:"not_connected"}; },
});

export function createGrowthGateway(): GrowthGateway {
  return NOT_CONNECTED_GROWTH_GATEWAY;
}
