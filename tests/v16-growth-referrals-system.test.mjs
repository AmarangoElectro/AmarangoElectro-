import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync=promisify(execFile);
const root=new URL("../",import.meta.url);
const source=(file)=>readFile(new URL(file,root),"utf8");

async function runTs(script){
  const {stdout}=await execFileAsync(process.execPath,[
    "--experimental-strip-types","--experimental-loader","./tests/ts-extension-loader.mjs","--input-type=module","-e",script,
  ],{cwd:new URL("../",import.meta.url)});
  return JSON.parse(stdout);
}

test("referral lifecycle cannot jump from sale creation directly to reward",async()=>{
  const result=await runTs(`
    import {canTransitionReferralStatus} from './lib/growth/referral-growth-engine.ts';
    process.stdout.write(JSON.stringify({
      clickLead:canTransitionReferralStatus('CLICK','LEAD'),
      salePaid:canTransitionReferralStatus('SALE_CREATED','PAYMENT_CONFIRMED'),
      saleReward:canTransitionReferralStatus('SALE_CREATED','REWARD_AVAILABLE'),
      paidReward:canTransitionReferralStatus('PAYMENT_CONFIRMED','REWARD_AVAILABLE'),
    }));
  `);
  assert.equal(result.clickLead,true);
  assert.equal(result.salePaid,true);
  assert.equal(result.saleReward,false);
  assert.equal(result.paidReward,true);
});

test("reward release is configurable and requires the configured valid-payment condition",async()=>{
  const result=await runTs(`
    import {rewardCanBeReleased} from './lib/growth/referral-growth-engine.ts';
    const policy={policyId:'p',name:'beneficio',active:true,rewardType:'COUPON',releaseCondition:'MINIMUM_PAID_AMOUNT',minimumPaidAmountArs:50000};
    process.stdout.write(JSON.stringify({
      saleCreated:rewardCanBeReleased({policy,status:'SALE_CREATED',validPaidAmountArs:100000,delivered:true,salePaidInFull:false,adminApproved:false}),
      lowPaid:rewardCanBeReleased({policy,status:'PAYMENT_CONFIRMED',validPaidAmountArs:49999,delivered:true,salePaidInFull:false,adminApproved:false}),
      enough:rewardCanBeReleased({policy,status:'PAYMENT_CONFIRMED',validPaidAmountArs:50000,delivered:false,salePaidInFull:false,adminApproved:false}),
    }));
  `);
  assert.deepEqual(result,{saleCreated:false,lowPaid:false,enough:true});
});

test("anti-fraud blocks obvious self referrals but shared device or IP only trigger review",async()=>{
  const result=await runTs(`
    import {referralFraudSignals,referralMustBeRejected} from './lib/growth/referral-growth-engine.ts';
    const hard=referralFraudSignals({referrerCustomerId:'a',referredCustomerId:'a',referrerDni:'123',referredDni:'123'});
    const review=referralFraudSignals({referrerCustomerId:'a',referredCustomerId:'b',sharedDeviceSignal:true,sharedIpSignal:true});
    process.stdout.write(JSON.stringify({hard,rejectHard:referralMustBeRejected(hard),review,rejectReview:referralMustBeRejected(review)}));
  `);
  assert.equal(result.rejectHard,true);
  assert.ok(result.hard.includes("SAME_CUSTOMER"));
  assert.ok(result.hard.includes("SAME_DNI"));
  assert.equal(result.rejectReview,false);
  assert.deepEqual(result.review,["SHARED_DEVICE_REVIEW","SHARED_IP_REVIEW"]);
});

test("advisor exposure uses capital committed minus money actually collected",async()=>{
  const result=await runTs(`
    import {calculateCapitalExposure} from './lib/growth/referral-growth-engine.ts';
    process.stdout.write(JSON.stringify({
      exposure:calculateCapitalExposure({costRealArs:300000,directCostsArs:15000,committedCommissionsArs:30000,collectedArs:180000}),
      zero:calculateCapitalExposure({costRealArs:100000,directCostsArs:0,committedCommissionsArs:0,collectedArs:150000}),
    }));
  `);
  assert.equal(result.exposure,165000);
  assert.equal(result.zero,0);
});

test("one large sale never unlocks advisor level when portfolio quality requirements fail",async()=>{
  const result=await runTs(`
    import {projectAdvisorGrowth} from './lib/growth/referral-growth-engine.ts';
    const levels=[
      {levelId:'l1',label:'Inicial',order:1,maxExposurePerSaleArs:100000,maxOpenExposureArs:200000,minimumPaidSales:0,minimumCompletedOperations:0,minimumPortfolioQuality:0,maximumDelinquencyRate:1,minimumRecurringClients:0,minimumTenureDays:0,requiresCorrectDocumentation:false,requiresAdminApproval:false,benefits:[]},
      {levelId:'l2',label:'Siguiente',order:2,maxExposurePerSaleArs:300000,maxOpenExposureArs:600000,minimumPaidSales:5,minimumCompletedOperations:5,minimumPortfolioQuality:.9,maximumDelinquencyRate:.05,minimumRecurringClients:2,minimumTenureDays:30,requiresCorrectDocumentation:true,requiresAdminApproval:true,benefits:['Mayor capacidad']},
    ];
    const state={advisorId:'a',currentLevelId:'l1',openExposureArs:50000,openOperations:1,portfolioQuality:.4,delinquencyRate:.3,paidSales:1,completedOperations:1,recurringClients:0,tenureDays:5,correctDocumentation:false};
    process.stdout.write(JSON.stringify(projectAdvisorGrowth(state,levels)));
  `);
  assert.ok(result.progressPercent<100);
  assert.ok(result.blockers.includes("Calidad de cartera"));
  assert.ok(result.blockers.includes("Mora"));
  assert.ok(result.blockers.includes("Evaluación administrativa"));
});

test("referral deep links preserve product attribution and public code only",async()=>{
  const result=await runTs(`
    import {addReferralToUrl,buildReferralPath} from './lib/growth/referral-growth-engine.ts';
    process.stdout.write(JSON.stringify({
      path:buildReferralPath('abc-123'),
      product:addReferralToUrl('https://amarangoelectro.com.ar/producto/tv','abc-123','p-7'),
    }));
  `);
  assert.equal(result.path,"/r/ABC-123");
  assert.match(result.product,/ref=ABC-123/);
  assert.match(result.product,/source=CLIENT_REFERRAL/);
  assert.match(result.product,/product=p-7/);
  assert.doesNotMatch(result.product,/dni|telefono|customerId/i);
});

test("acquisition funnel calculates the primary collected-margin over exposed-capital metric",async()=>{
  const result=await runTs(`
    import {buildAcquisitionFunnel} from './lib/growth/referral-growth-engine.ts';
    process.stdout.write(JSON.stringify(buildAcquisitionFunnel({
      visits:1000,leads:100,evaluations:80,approved:40,sales:30,paid:20,recurringCustomers:10,referralsGenerated:15,
      costPerLeadArs:1000,costPerCustomerArs:5000,marginGeneratedArs:500000,marginCollectedArs:300000,
      delinquencyRate:.05,exposedCapitalArs:600000,
    })));
  `);
  assert.equal(result.approvalRate,.5);
  assert.equal(result.conversionRate,.3);
  assert.equal(result.collectedMarginOnExposure,.5);
});

test("growth UI is native to V16 but never fabricates backend success",async()=>{
  const [gateway,admin,hub,share,snapshot,layout]=await Promise.all([
    source("lib/growth/growth-gateway.ts"),
    source("components/internal/admin/growth-acquisition-panel.tsx"),
    source("app/components/customer-referral-hub.tsx"),
    source("lib/commerce/share-product.ts"),
    source("lib/integration/sale-snapshot.ts"),
    source("app/layout.tsx"),
  ]);
  assert.match(gateway,/NOT_CONNECTED_GROWTH_GATEWAY/);
  assert.doesNotMatch(gateway,/fetch\s*\(|createClient|\.insert\s*\(|\.upsert\s*\(|\.rpc\s*\(/i);
  assert.match(admin,/MÉTRICA PRINCIPAL/);
  assert.match(admin,/No es multinivel/);
  assert.match(hub,/RECOMENDÁ Y GANÁ/);
  assert.match(hub,/MIS BENEFICIOS/);
  assert.match(share,/referralCode/);
  assert.match(snapshot,/sourceAttribution/);
  assert.match(layout,/GrowthAttributionCapture/);
});

test("growth contract includes universal source attribution statuses reward types and provider-neutral events",async()=>{
  const [contract,events]=await Promise.all([
    source("lib/growth/referral-growth-contract.ts"),
    source("lib/growth/growth-events.ts"),
  ]);
  for(const token of ["CLICK","LEAD","EVALUATION","APPROVED","REJECTED","SALE_CREATED","PAYMENT_CONFIRMED","REWARD_AVAILABLE","REWARD_USED","CANCELLED"]) assert.match(contract,new RegExp(token));
  for(const token of ["DIRECT","WHATSAPP","INSTAGRAM","FACEBOOK","META_ADS","CLIENT_REFERRAL","ADVISOR","ORGANIC","CAMPAIGN","OTHER"]) assert.match(contract,new RegExp(token));
  for(const token of ["AMARANGO_BALANCE","NEXT_PURCHASE_DISCOUNT","COUPON","GIFT","SPECIAL_BENEFIT","SHIPPING_BENEFIT","OTHER"]) assert.match(contract,new RegExp(token));
  for(const token of ["PRODUCT_DELIVERED","VALID_PAYMENT_CONFIRMED","CREDIT_COMPLETED","CUSTOMER_LEVEL_CHANGED","BENEFIT_AVAILABLE"]) assert.match(contract,new RegExp(token));
  assert.match(events,/amarango:growth-domain-event/);
});
