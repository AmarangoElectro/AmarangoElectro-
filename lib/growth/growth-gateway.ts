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

type GrowthBridgeAction =
  | "current_customer_snapshot"
  | "reward_policies_list"
  | "save_reward_policy"
  | "acquisition_funnel"
  | "referrals_list"
  | "advisor_levels_list"
  | "save_advisor_level"
  | "advisor_states_list"
  | "current_advisor_state"
  | "request_advisor_application"
  | "advisor_applications_list"
  | "review_advisor_application";

async function bridge(action:GrowthBridgeAction,args:Record<string,unknown>={}):Promise<GrowthGatewayResult<unknown>> {
  let response:Response;
  try {
    response=await fetch("/api/v16/growth",{
      method:"POST",
      headers:{"Content-Type":"application/json","Accept":"application/json"},
      body:JSON.stringify({action,args}),
      cache:"no-store",
    });
  } catch {
    return {status:"not_connected"};
  }

  let body:unknown;
  try { body=await response.json(); } catch { return {status:"error",message:"Growth server bridge returned non-JSON"}; }
  if(!body || typeof body!=="object") return {status:"error",message:"Growth server bridge returned an invalid response"};
  const result=body as {status?:string;data?:unknown;message?:string};

  if(result.status==="ok") return {status:"ok",data:result.data};
  if(result.status==="not_connected") return {status:"not_connected"};
  if(result.status==="unauthorized") return {status:"unauthorized"};
  if(result.status==="step_up_required") return {status:"step_up_required"};
  return {status:"error",message:result.message??`Growth server bridge failed (${response.status})`};
}

const n=(value:unknown)=>typeof value==="number"?value:Number(value ?? 0);
const nullableN=(value:unknown)=>value===null||value===undefined?null:n(value);
const s=(value:unknown)=>value===null||value===undefined?null:String(value);
const uuidOrNull=(value:string|undefined|null)=>value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)?value:null;
const first=<T>(value:unknown):T|null=>Array.isArray(value)?((value[0] as T)??null):((value as T)??null);

function policy(row:any):RewardPolicy {
  return {
    policyId:String(row.policy_id),
    name:String(row.name),
    active:Boolean(row.active),
    rewardType:row.reward_type,
    fixedValueArs:nullableN(row.fixed_value_ars),
    percentValue:nullableN(row.percent_value),
    maxValueArs:nullableN(row.max_value_ars),
    minimumPurchaseArs:nullableN(row.minimum_purchase_ars),
    expiresAfterDays:row.expires_after_days==null?null:n(row.expires_after_days),
    allowedProductIds:Array.isArray(row.allowed_product_ids)?row.allowed_product_ids.map(String):[],
    allowedCategoryIds:Array.isArray(row.allowed_category_ids)?row.allowed_category_ids.map(String):[],
    releaseCondition:row.release_condition,
    minimumPaidAmountArs:nullableN(row.minimum_paid_amount_ars),
    priority:n(row.priority ?? 100),
  };
}

function level(row:any):AdvisorGrowthLevelRule {
  return {
    levelId:String(row.level_id),
    label:String(row.label),
    order:n(row.sort_order),
    active:Boolean(row.active),
    maxExposurePerSaleArs:n(row.max_exposure_per_sale_ars),
    maxOpenExposureArs:n(row.max_open_exposure_ars),
    minimumPaidSales:n(row.minimum_paid_sales),
    minimumCompletedOperations:n(row.minimum_completed_operations),
    minimumPortfolioQuality:n(row.minimum_portfolio_quality),
    maximumDelinquencyRate:n(row.maximum_delinquency_rate),
    minimumRecurringClients:n(row.minimum_recurring_clients),
    minimumTenureDays:n(row.minimum_tenure_days),
    requiresCorrectDocumentation:Boolean(row.requires_correct_documentation),
    requiresAdminApproval:Boolean(row.requires_admin_approval),
    benefits:Array.isArray(row.benefits)?row.benefits.map(String):[],
  };
}

function advisorState(row:any):AdvisorGrowthState {
  return {
    advisorId:String(row.advisor_id),
    currentLevelId:s(row.current_level_id),
    openExposureArs:n(row.open_exposure_ars),
    openOperations:n(row.open_operations),
    portfolioQuality:nullableN(row.portfolio_quality),
    delinquencyRate:nullableN(row.delinquency_rate),
    paidSales:n(row.paid_sales),
    completedOperations:n(row.completed_operations),
    recurringClients:n(row.recurring_clients),
    tenureDays:n(row.tenure_days),
    correctDocumentation:Boolean(row.correct_documentation),
  };
}

function referral(row:any):ReferralRecord {
  return {
    referralId:String(row.referral_id),
    referralCode:String(row.referral_code),
    referrerCustomerId:String(row.referrer_customer_id),
    referrerDisplayName:s(row.referrer_display_name),
    referredCustomerId:s(row.referred_customer_id),
    referredDisplayName:null,
    leadId:s(row.lead_id),
    saleId:s(row.sale_id),
    productId:s(row.product_id),
    source:"CLIENT_REFERRAL",
    status:row.status,
    enteredAt:String(row.entered_at),
    updatedAt:String(row.updated_at),
  };
}

function application(row:any):AdvisorApplication {
  return {
    applicationId:String(row.application_id),
    customerId:String(row.customer_id),
    customerName:s(row.customer_name),
    status:row.status,
    createdAt:String(row.created_at),
    reviewedAt:s(row.reviewed_at),
    reviewedBy:s(row.reviewed_by),
  };
}

function periodFrom(filters:AcquisitionFilters) {
  if (filters.periodFrom) return filters.periodFrom;
  const days=filters.periodPreset==="7d"?7:filters.periodPreset==="90d"?90:30;
  return new Date(Date.now()-days*86400000).toISOString();
}

export class SameOriginGrowthGateway implements GrowthGateway {

  async getCurrentCustomerGrowth() {
    const result=await bridge("current_customer_snapshot");
    if(result.status!=="ok")return result;
    return {status:"ok",data:result.data as CustomerGrowthSnapshot};
  }

  async listRewardPolicies() {
    const result=await bridge("reward_policies_list");
    if(result.status!=="ok")return result;
    return {status:"ok",data:(Array.isArray(result.data)?result.data:[]).map(policy)};
  }

  async saveRewardPolicy(input:RewardPolicy) {
    const result=await bridge("save_reward_policy",{
      policy_id:uuidOrNull(input.policyId),name:input.name,active:input.active,reward_type:input.rewardType,
      fixed_value_ars:input.fixedValueArs??null,percent_value:input.percentValue??null,max_value_ars:input.maxValueArs??null,
      minimum_purchase_ars:input.minimumPurchaseArs??null,expires_after_days:input.expiresAfterDays??null,
      allowed_product_ids:input.allowedProductIds??[],allowed_category_ids:input.allowedCategoryIds??[],
      release_condition:input.releaseCondition,minimum_paid_amount_ars:input.minimumPaidAmountArs??null,priority:input.priority??100,
    });
    if(result.status!=="ok")return result;
    const row=first<any>(result.data); if(!row)return {status:"error",message:"Policy RPC returned no row"};
    return {status:"ok",data:policy(row)};
  }

  async getAcquisitionFunnel(filters:AcquisitionFilters={}) {
    const result=await bridge("acquisition_funnel",{
      source:filters.source??null,campaign_id:filters.campaignId??null,advisor_id:uuidOrNull(filters.advisorId),
      referrer_customer_id:filters.referrerCustomerId??null,product_id:filters.productId??null,category_id:filters.categoryId??null,
      period_preset:filters.periodPreset??"30d",period_from:filters.periodFrom??null,period_to:filters.periodTo??null,
    });
    if(result.status!=="ok")return result;
    const row=first<any>(result.data); if(!row)return {status:"error",message:"Funnel RPC returned no row"};
    return {status:"ok",data:{
      visits:n(row.visits),leads:n(row.leads),evaluations:n(row.evaluations),approved:n(row.approved),sales:n(row.sales),paid:n(row.paid),
      recurringCustomers:n(row.recurring_customers),referralsGenerated:n(row.referrals_generated),
      costPerLeadArs:nullableN(row.cost_per_lead_ars),costPerCustomerArs:nullableN(row.cost_per_customer_ars),
      approvalRate:nullableN(row.approval_rate),conversionRate:nullableN(row.conversion_rate),
      marginGeneratedArs:n(row.margin_generated_ars),marginCollectedArs:n(row.margin_collected_ars),
      delinquencyRate:nullableN(row.delinquency_rate),exposedCapitalArs:n(row.exposed_capital_ars),
      referralsPerCustomer:nullableN(row.referrals_per_customer),salesPerReferral:nullableN(row.sales_per_referral),
      collectedMarginOnExposure:nullableN(row.collected_margin_on_exposure),
    }};
  }

  async listReferrals(filters:AcquisitionFilters={}) {
    const result=await bridge("referrals_list",{
      source:filters.source??null,campaign_id:filters.campaignId??null,advisor_id:uuidOrNull(filters.advisorId),
      referrer_customer_id:filters.referrerCustomerId??null,product_id:filters.productId??null,category_id:filters.categoryId??null,
      period_from:periodFrom(filters),period_to:filters.periodTo??null,row_limit:200,row_offset:0,
    });
    if(result.status!=="ok")return result;
    return {status:"ok",data:(Array.isArray(result.data)?result.data:[]).map(referral)};
  }

  async listAdvisorLevels() {
    const result=await bridge("advisor_levels_list");
    if(result.status!=="ok")return result;
    return {status:"ok",data:(Array.isArray(result.data)?result.data:[]).map(level)};
  }

  async saveAdvisorLevel(input:AdvisorGrowthLevelRule) {
    const result=await bridge("save_advisor_level",{
      level_id:uuidOrNull(input.levelId),label:input.label,sort_order:input.order,active:input.active??false,
      max_exposure_per_sale_ars:input.maxExposurePerSaleArs,max_open_exposure_ars:input.maxOpenExposureArs,
      minimum_paid_sales:input.minimumPaidSales,minimum_completed_operations:input.minimumCompletedOperations,
      minimum_portfolio_quality:input.minimumPortfolioQuality,maximum_delinquency_rate:input.maximumDelinquencyRate,
      minimum_recurring_clients:input.minimumRecurringClients,minimum_tenure_days:input.minimumTenureDays,
      requires_correct_documentation:input.requiresCorrectDocumentation,requires_admin_approval:input.requiresAdminApproval,
      benefits:input.benefits??[],
    });
    if(result.status!=="ok")return result;
    const row=first<any>(result.data); if(!row)return {status:"error",message:"Advisor level RPC returned no row"};
    return {status:"ok",data:level(row)};
  }

  async getAdvisorGrowthStates() {
    const result=await bridge("advisor_states_list");
    if(result.status!=="ok")return result;
    return {status:"ok",data:(Array.isArray(result.data)?result.data:[]).map(advisorState)};
  }

  async getCurrentAdvisorGrowth() {
    const result=await bridge("current_advisor_state");
    if(result.status!=="ok")return result;
    const row=first<any>(result.data); if(!row)return {status:"error",message:"Advisor state RPC returned no row"};
    return {status:"ok",data:advisorState(row)};
  }

  async requestAdvisorApplication() {
    const result=await bridge("request_advisor_application");
    if(result.status!=="ok")return result;
    const row=first<any>(result.data); if(!row)return {status:"error",message:"Advisor application RPC returned no row"};
    return {status:"ok",data:application(row)};
  }

  async listAdvisorApplications() {
    const result=await bridge("advisor_applications_list");
    if(result.status!=="ok")return result;
    return {status:"ok",data:(Array.isArray(result.data)?result.data:[]).map(application)};
  }

  async reviewAdvisorApplication(applicationId:string,decision:"APPROVED"|"REJECTED") {
    const result=await bridge("review_advisor_application",{
      application_id:applicationId,decision:decision,note:null,
    });
    if(result.status!=="ok")return result;
    const row=first<any>(result.data); if(!row)return {status:"error",message:"Advisor review RPC returned no row"};
    return {status:"ok",data:application(row)};
  }
}

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
  return new SameOriginGrowthGateway();
}
