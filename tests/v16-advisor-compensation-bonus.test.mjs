import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync=promisify(execFile);

async function runTs(script){
  const {stdout}=await execFileAsync(process.execPath,[
    "--experimental-strip-types","--experimental-loader","./tests/ts-extension-loader.mjs","--input-type=module","-e",script,
  ],{cwd:new URL("../",import.meta.url)});
  return JSON.parse(stdout);
}

test("financed advisor commission uses exact definitive cash-price tiers",async()=>{
  const result=await runTs(`
    import {quoteFinancedAdvisorCommission} from './lib/internal/finance/advisor-compensation.ts';
    const prices=[1,49999,50000,99999,100000,149999,150000,199999,200000,249999,250000,299999,300000,399999,400000,499999,500000,599999,600000,699999,700000,799999,800000,899999,900000,999999,1000000,1250000];
    process.stdout.write(JSON.stringify(prices.map(cash=>({cash,...quoteFinancedAdvisorCommission(cash)}))));
  `);
  assert.deepEqual(result.map(x=>x.commissionArs),[
    7500,7500,12000,12000,16000,16000,20000,20000,24000,24000,28000,28000,
    37500,37500,45000,45000,52500,52500,60000,60000,70000,70000,80000,80000,
    90000,90000,100000,100000,
  ]);
  for(const row of result){
    assert.equal(row.paymentCount,2);
    assert.equal(row.paymentArs.length,2);
    assert.equal(row.paymentArs.reduce((a,b)=>a+b,0),row.commissionArs);
  }
});

test("small products count as half an equivalent sale and 50k counts as one",async()=>{
  const result=await runTs(`
    import {equivalentSaleUnitsForCashPrice} from './lib/internal/finance/advisor-compensation.ts';
    process.stdout.write(JSON.stringify([
      equivalentSaleUnitsForCashPrice(49999),
      equivalentSaleUnitsForCashPrice(50000),
      equivalentSaleUnitsForCashPrice(150000),
    ]));
  `);
  assert.deepEqual(result,[0.5,1,1]);
});

test("monthly bonus milestones are non-cumulative and add 7.5k per completed sale after 20",async()=>{
  const result=await runTs(`
    import {monthlyBonusForEquivalentSales,projectAdvisorMonthlyProgress} from './lib/internal/finance/advisor-compensation.ts';
    const values=[0,4.5,5,9.5,10,14.5,15,19.5,20,20.5,21,21.5,25];
    process.stdout.write(JSON.stringify(values.map(v=>({v,bonus:monthlyBonusForEquivalentSales(v),progress:projectAdvisorMonthlyProgress(v)}))));
  `);
  assert.deepEqual(result.map(x=>x.bonus),[
    0,0,10000,10000,35000,35000,65000,65000,100000,100000,107500,107500,137500,
  ]);
  const at20=result.find(x=>x.v===20);
  assert.equal(at20.progress.achievedMilestone,20);
  assert.equal(at20.progress.extraBonusAfter20Ars,0);
  const at21=result.find(x=>x.v===21);
  assert.equal(at21.progress.extraBonusAfter20Ars,7500);
  assert.equal(at21.progress.nextTarget,22);
});

test("sale eligibility requires valid payment delivery non-cancelled status and financed installments current",async()=>{
  const result=await runTs(`
    import {evaluateAdvisorSaleForMonthlyBonus} from './lib/internal/finance/advisor-compensation.ts';
    const base={saleId:'s',cashPriceArs:100000,financed:false,validPayment:true,delivered:true,cancelled:false};
    const rows=[
      evaluateAdvisorSaleForMonthlyBonus(base),
      evaluateAdvisorSaleForMonthlyBonus({...base,saleId:'p',validPayment:false}),
      evaluateAdvisorSaleForMonthlyBonus({...base,saleId:'d',delivered:false}),
      evaluateAdvisorSaleForMonthlyBonus({...base,saleId:'c',cancelled:true}),
      evaluateAdvisorSaleForMonthlyBonus({...base,saleId:'m',financed:true,installmentsCurrent:false}),
      evaluateAdvisorSaleForMonthlyBonus({...base,saleId:'ok',financed:true,installmentsCurrent:true}),
    ];
    process.stdout.write(JSON.stringify(rows));
  `);
  assert.deepEqual(result.map(x=>x.status),[
    "VALID","PENDING_VALID_PAYMENT","PENDING_DELIVERY","CANCELLED","FINANCED_ARREARS","VALID",
  ]);
  assert.equal(result[4].eligible,false);
  assert.equal(result[5].eligible,true);
});

test("month summary preserves half-points and separates commission from bonus",async()=>{
  const result=await runTs(`
    import {summarizeAdvisorMonth} from './lib/internal/finance/advisor-compensation.ts';
    const sales=[];
    for(let i=0;i<9;i++) sales.push({saleId:'n'+i,cashPriceArs:100000,financed:true,validPayment:true,delivered:true,cancelled:false,installmentsCurrent:true,commissionPaidArs:8000});
    sales.push({saleId:'a',cashPriceArs:49999,financed:true,validPayment:true,delivered:true,cancelled:false,installmentsCurrent:true,commissionPaidArs:3750});
    sales.push({saleId:'b',cashPriceArs:49999,financed:true,validPayment:true,delivered:true,cancelled:false,installmentsCurrent:true,commissionPaidArs:3750});
    process.stdout.write(JSON.stringify(summarizeAdvisorMonth(sales)));
  `);
  assert.equal(result.equivalentSales,10);
  assert.equal(result.bonus.bonusArs,35000);
  assert.equal(result.validSaleCount,11);
  assert.equal(result.saleCount,11);
  assert.equal(result.commissionGeneratedArs,9*16000+2*7500);
  assert.equal(result.commissionPaidArs,9*8000+2*3750);
  assert.equal(result.commissionPendingArs,result.commissionGeneratedArs-result.commissionPaidArs);
});

test("duplicate sale ids fail instead of double-counting monthly progress",async()=>{
  const result=await runTs(`
    import {summarizeAdvisorMonth} from './lib/internal/finance/advisor-compensation.ts';
    let message='';
    try{
      summarizeAdvisorMonth([
        {saleId:'same',cashPriceArs:100000,financed:true,validPayment:true,delivered:true,cancelled:false,installmentsCurrent:true},
        {saleId:'same',cashPriceArs:100000,financed:true,validPayment:true,delivered:true,cancelled:false,installmentsCurrent:true},
      ]);
    }catch(error){message=error.message}
    process.stdout.write(JSON.stringify({message}));
  `);
  assert.match(result.message,/Duplicate advisor sale snapshot/);
});


test("cancelled sales generate neither bonus units nor monthly generated commission",async()=>{
  const result=await runTs(`
    import {summarizeAdvisorMonth} from './lib/internal/finance/advisor-compensation.ts';
    process.stdout.write(JSON.stringify(summarizeAdvisorMonth([
      {saleId:'cancelled',cashPriceArs:350000,financed:true,validPayment:true,delivered:true,cancelled:true,installmentsCurrent:true,commissionPaidArs:37500},
    ])));
  `);
  assert.equal(result.equivalentSales,0);
  assert.equal(result.commissionGeneratedArs,0);
  assert.equal(result.commissionPaidArs,0);
  assert.equal(result.bonus.bonusArs,0);
});

test("advisor UI exposes commission and targets but never product cost",async()=>{
  const {readFile}=await import("node:fs/promises");
  const root=new URL("../",import.meta.url);
  const [workspace,draft,summary,admin,adapter]=await Promise.all([
    readFile(new URL("app/components/advisor-workspace.tsx",root),"utf8"),
    readFile(new URL("app/components/advisor-sale-draft-panel.tsx",root),"utf8"),
    readFile(new URL("app/components/advisor-compensation-summary.tsx",root),"utf8"),
    readFile(new URL("components/internal/admin/advisor-compensation-admin-summary.tsx",root),"utf8"),
    readFile(new URL("lib/advisors/advisor-compensation-adapter.ts",root),"utf8"),
  ]);
  assert.match(workspace,/Comisión financiada/);
  assert.match(draft,/MI COMISIÓN/);
  assert.match(summary,/TU MES/);
  assert.match(summary,/PREMIO ALCANZADO/);
  assert.match(admin,/COMISIONES \+ PREMIO MENSUAL/);
  assert.match(adapter,/not_connected/);
  assert.doesNotMatch([workspace,draft,summary].join("\n"),/costo real|costReal|markup/i);
});

test("Plan Protegido uses the same fixed financed commission for Plan 3 and Plan 6 without changing customer totals",async()=>{
  const result=await runTs(`
    import {quotePlanProtegido} from './lib/internal/finance/plan-protegido.ts';
    import {quoteFinancedAdvisorCommission} from './lib/internal/finance/advisor-compensation.ts';
    const costs=[50000,100000,250000,350000,477333,800000];
    process.stdout.write(JSON.stringify(costs.map(cost=>{
      const q=quotePlanProtegido(cost);
      const commission=quoteFinancedAdvisorCommission(q.cashPriceExact);
      return {
        cash:q.cashPriceExact,
        plan3Total:q.plan3.totalExact,
        plan6Total:q.plan6.totalExact,
        c3:q.plan3.commission.totalExact,
        c6:q.plan6.commission.totalExact,
        expected:commission.commissionArs,
        p3:q.plan3.commission.paymentCount,
        p6:q.plan6.commission.paymentCount,
      };
    })));
  `);
  for(const row of result){
    assert.equal(row.c3,row.expected);
    assert.equal(row.c6,row.expected);
    assert.equal(row.p3,2);
    assert.equal(row.p6,2);
    assert.ok(row.plan3Total>row.cash);
    assert.ok(row.plan6Total>row.plan3Total);
  }
});


test("financed commission tiers are contiguous monotonic and split into two exactly equal payments",async()=>{
  const result=await runTs(`
    import {ADVISOR_FINANCED_COMMISSION_TIERS,quoteFinancedAdvisorCommission} from './lib/internal/finance/advisor-compensation.ts';
    const rows=ADVISOR_FINANCED_COMMISSION_TIERS.map((tier,index)=>({
      ...tier,
      index,
      quote:quoteFinancedAdvisorCommission(tier.minCashPriceArs || 1),
    }));
    process.stdout.write(JSON.stringify(rows));
  `);
  assert.equal(result.length,14);
  for(let i=0;i<result.length;i++){
    const row=result[i];
    assert.ok(row.commissionArs>0);
    assert.equal(row.quote.paymentArs.length,2);
    assert.equal(row.quote.paymentArs[0],row.quote.paymentArs[1]);
    if(i>0){
      const previous=result[i-1];
      assert.equal(previous.maxCashPriceArs+1,row.minCashPriceArs);
      assert.ok(row.commissionArs>=previous.commissionArs);
    }
  }
  assert.equal(result.at(-1).maxCashPriceArs,null);
});

test("active V16 advisor and calculator surfaces cannot fall back to legacy financedPercent",async()=>{
  const {readFile}=await import("node:fs/promises");
  const root=new URL("../",import.meta.url);
  const files=await Promise.all([
    "lib/internal/finance/plan-protegido.ts",
    "components/internal/admin/amarango-calculator-panel.tsx",
    "app/components/advisor-workspace.tsx",
    "app/components/advisor-sale-draft-panel.tsx",
  ].map(file=>readFile(new URL(file,root),"utf8")));
  const active=files.join("\n");
  assert.doesNotMatch(active,/commission\.financedPercent|financedPercent/);
  assert.match(active,/quoteFinancedAdvisorCommission/);
  assert.doesNotMatch(active,/Comisión total 15%|Comisión 15% contado|15% financiado/i);
});

test("bonus after 20 advances only on completed equivalent sales, preserving half-sale progress",async()=>{
  const result=await runTs(`
    import {monthlyBonusForEquivalentSales,projectAdvisorMonthlyProgress} from './lib/internal/finance/advisor-compensation.ts';
    const values=[20,20.5,21,21.5,22];
    process.stdout.write(JSON.stringify(values.map(value=>({
      value,
      bonus:monthlyBonusForEquivalentSales(value),
      progress:projectAdvisorMonthlyProgress(value),
    }))));
  `);
  assert.deepEqual(result.map(row=>row.bonus),[100000,100000,107500,107500,115000]);
  assert.equal(result[1].progress.nextTarget,21);
  assert.equal(result[1].progress.remainingEquivalentSales,0.5);
  assert.equal(result[3].progress.nextTarget,22);
  assert.equal(result[3].progress.remainingEquivalentSales,0.5);
});
