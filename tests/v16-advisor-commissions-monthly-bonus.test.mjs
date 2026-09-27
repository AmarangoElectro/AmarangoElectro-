import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

async function runTs(script) {
  const { stdout } = await execFileAsync(
    process.execPath,
    ["--experimental-strip-types", "--experimental-loader", "./tests/ts-extension-loader.mjs", "--input-type=module", "-e", script],
    { cwd: root },
  );
  return JSON.parse(stdout);
}

test("financed commissions use every exact final-cash-price boundary and split into two parts", async () => {
  const prices = [
    1,49_999,50_000,99_999,100_000,149_999,150_000,199_999,200_000,249_999,
    250_000,299_999,300_000,399_999,400_000,499_999,500_000,599_999,
    600_000,699_999,700_000,799_999,800_000,899_999,900_000,999_999,1_000_000,1_500_000,
  ];
  const result = await runTs(`
    import { quoteAdvisorOperationCommission } from './lib/internal/finance/advisor-compensation-engine.ts';
    const prices=${JSON.stringify(prices)};
    process.stdout.write(JSON.stringify(prices.map(price=>quoteAdvisorOperationCommission(price,'financed'))));
  `);
  const expected = [
    7_500,7_500,12_000,12_000,16_000,16_000,20_000,20_000,24_000,24_000,
    28_000,28_000,37_500,37_500,45_000,45_000,52_500,52_500,60_000,60_000,
    70_000,70_000,80_000,80_000,90_000,90_000,100_000,100_000,
  ];
  assert.deepEqual(result.map((quote) => quote.totalCommissionArs), expected);
  for (const quote of result) {
    assert.equal(quote.calculation, "financed_fixed_tier");
    assert.equal(quote.paymentsArs.length, 2);
    assert.equal(quote.paymentsArs[0] + quote.paymentsArs[1], quote.totalCommissionArs);
    assert.equal(quote.paymentsArs[0], quote.paymentsArs[1]);
  }
  assert.deepEqual(result[6].paymentsArs, [10_000,10_000]);
  assert.deepEqual(result[12].paymentsArs, [18_750,18_750]);
  assert.deepEqual(result[18].paymentsArs, [30_000,30_000]);
  assert.deepEqual(result[26].paymentsArs, [50_000,50_000]);
});

test("cash commission remains the existing 10 percent model", async () => {
  const result = await runTs(`
    import { quoteAdvisorOperationCommission } from './lib/internal/finance/advisor-compensation-engine.ts';
    process.stdout.write(JSON.stringify(quoteAdvisorOperationCommission(350000,'cash')));
  `);
  assert.equal(result.calculation, "cash_percentage");
  assert.equal(result.cashPercent, 10);
  assert.equal(result.totalCommissionArs, 35_000);
  assert.deepEqual(result.paymentsArs, [35_000]);
});

test("monthly bonus is non-cumulative, keeps half sales, and has no fake post-20 target", async () => {
  const values = [0,4.5,5,9.5,10,14.5,15,19.5,20,20.5,21,25];
  const result = await runTs(`
    import { quoteAdvisorMonthlyBonus } from './lib/internal/finance/advisor-compensation-engine.ts';
    const values=${JSON.stringify(values)};
    process.stdout.write(JSON.stringify(values.map(value=>quoteAdvisorMonthlyBonus(value))));
  `);
  assert.deepEqual(result.map((quote) => quote.bonusArs), [0,0,10_000,10_000,35_000,35_000,65_000,65_000,100_000,100_000,107_500,137_500]);
  assert.deepEqual(result.slice(0,8).map((quote) => quote.nextGoalEquivalentSales), [5,5,10,10,15,15,20,20]);
  assert.equal(result[8].mainGoalReached, true);
  assert.equal(result[8].nextGoalEquivalentSales, null);
  assert.equal(result[9].additionalEquivalentSales, 0);
  assert.equal(result[10].additionalEquivalentSales, 1);
  assert.equal(result[11].additionalEquivalentSales, 5);
});

test("two products below 50k equal one sale and exactly 50k equals one sale", async () => {
  const result = await runTs(`
    import { equivalentSalesForCashPrice } from './lib/internal/finance/advisor-compensation-engine.ts';
    process.stdout.write(JSON.stringify([49999,49999,50000].map(equivalentSalesForCashPrice)));
  `);
  assert.deepEqual(result, [0.5,0.5,1]);
  assert.equal(result[0] + result[1], 1);
});

test("commercial validation excludes cancellation and arrears while pending facts never count early", async () => {
  const result = await runTs(`
    import { projectAdvisorOperation } from './lib/internal/finance/advisor-compensation-engine.ts';
    const base={saleId:'sale',advisorId:'advisor',productLabel:'Producto',finalCashPriceArs:100000,modality:'financed',cancelled:false,delivered:true,paidAccordingToTerms:true,financedCurrentAtClose:true};
    const variants=[
      {...base,saleId:'accepted'},
      {...base,saleId:'cancelled',cancelled:true},
      {...base,saleId:'delivery',delivered:false},
      {...base,saleId:'collection',paidAccordingToTerms:null},
      {...base,saleId:'arrears',financedCurrentAtClose:false},
      {...base,saleId:'current-unknown',financedCurrentAtClose:null},
    ];
    process.stdout.write(JSON.stringify(variants.map(projectAdvisorOperation)));
  `);
  assert.deepEqual(result.map((operation) => operation.validation), ["accepted","excluded","pending","pending","excluded","pending"]);
  assert.deepEqual(result.map((operation) => operation.countsForBonus), [true,false,false,false,false,false]);
  assert.deepEqual(result.map((operation) => operation.equivalentSales), [1,0,0,0,0,0]);
});

test("month close freezes audited totals and keeps commission separate from bonus", async () => {
  const result = await runTs(`
    import { closeAdvisorMonth } from './lib/internal/finance/advisor-compensation-engine.ts';
    const operations=Array.from({length:9},(_,index)=>({saleId:'normal-'+index,advisorId:'advisor',productLabel:'Normal',finalCashPriceArs:150000,modality:'financed',cancelled:false,delivered:true,paidAccordingToTerms:true,financedCurrentAtClose:true,commissionPaymentsCollected:index===0?2:0}));
    operations.push({saleId:'low-1',advisorId:'advisor',productLabel:'Menor',finalCashPriceArs:49999,modality:'cash',cancelled:false,delivered:true,paidAccordingToTerms:true,financedCurrentAtClose:null,commissionPaymentsCollected:1});
    operations.push({saleId:'low-2',advisorId:'advisor',productLabel:'Menor',finalCashPriceArs:49999,modality:'cash',cancelled:false,delivered:true,paidAccordingToTerms:true,financedCurrentAtClose:null});
    const close=closeAdvisorMonth({advisorId:'advisor',period:'2026-09',closedAt:'2026-10-01T00:00:00.000Z',operations});
    const before=close.commissionGeneratedArs;
    operations[0].finalCashPriceArs=1000000;
    process.stdout.write(JSON.stringify({close,before,frozen:Object.isFrozen(close)&&Object.isFrozen(close.operations)}));
  `);
  assert.equal(result.close.equivalentSales, 10);
  assert.equal(result.close.bonus.bonusArs, 35_000);
  assert.equal(result.close.commissionGeneratedArs, result.before);
  assert.equal(result.close.commissionCollectedArs, 20_000 + 5_000);
  assert.equal(result.close.commissionPendingArs, result.close.commissionGeneratedArs - 25_000);
  assert.equal(result.frozen, true);
});

test("advisor and admin surfaces expose the required audited read model without local authority", async () => {
  const [advisor,admin,model,presenter] = await Promise.all([
    source("app/components/advisor-month-dashboard.tsx"),
    source("components/internal/admin/advisor-compensation-admin-panel.tsx"),
    source("lib/advisor-compensation/advisor-compensation-read-model.ts"),
    source("lib/advisor-compensation/advisor-compensation-presenter.ts"),
  ]);
  for (const text of [advisor,admin]) assert.doesNotMatch(text,/localStorage|sessionStorage|Math\.random/i);
  assert.match(advisor,/TU MES/);
  assert.match(advisor,/VENTAS EQUIVALENTES/);
  assert.match(advisor,/COMISIONES DEL MES/);
  assert.match(advisor,/Meta principal alcanzada/);
  assert.match(advisor,/Precio contado/);
  assert.match(advisor,/Pendiente/);
  assert.match(admin,/Aceptadas/);
  assert.match(admin,/Excluidas/);
  assert.match(admin,/CIERRE MENSUAL/);
  assert.match(model,/server-authoritative month close/);
  assert.match(presenter,/presentAdvisorMonthClose/);
});
