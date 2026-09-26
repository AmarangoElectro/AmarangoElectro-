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
