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
    { cwd: new URL("../", import.meta.url) },
  );
  return JSON.parse(stdout);
}

test("Plan Protegido uses exact non-overlapping cost boundaries", async () => {
  const result = await runTs(`
    import { quotePlanProtegido } from './lib/internal/finance/plan-protegido.ts';
    const costs=[49999,50000,99999,100000,249999,250000,349999,350000];
    process.stdout.write(JSON.stringify(costs.map(cost=>{const q=quotePlanProtegido(cost);return {cost,markup:q.markupPercent,cash:q.cashPriceExact}})));
  `);

  assert.deepEqual(result.map((row) => row.markup), [80,60,60,50,50,40,40,30]);
  const expectedCash=[89998.2,80000,159998.4,150000,374998.5,350000,489998.6,455000];
  result.forEach((row,index)=>assert.ok(Math.abs(row.cash-expectedCash[index])<1e-7));
});

test("Plan Protegido keeps Formula 1 untouched and reuses its active 6-plan surcharge", async () => {
  const result = await runTs(`
    import { quoteAmarangoCalculator } from './lib/internal/finance/amarango-calculator.ts';
    import { quotePlanProtegido } from './lib/internal/finance/plan-protegido.ts';
    const current=quoteAmarangoCalculator({mode:'cost_ars',amount:50000,installmentPlans:[2,4,6]});
    const protectedQuote=quotePlanProtegido(50000);
    process.stdout.write(JSON.stringify({current,protectedQuote}));
  `);

  assert.equal(result.current.markupPercent,80);
  assert.equal(result.current.salePrice,90000);
  assert.deepEqual(result.current.installments.map((plan)=>[plan.installments,plan.surchargePercent]),[[2,15],[4,55],[6,78]]);
  assert.equal(result.protectedQuote.markupPercent,60);
  assert.equal(result.protectedQuote.cashPriceExact,80000);
  assert.equal(result.protectedQuote.plan6.surchargePercent,78);
  assert.equal(result.protectedQuote.plan6.totalExact,142400);
});

test("Plan Protegido customer schedules always close exactly in displayed pesos", async () => {
  const result = await runTs(`
    import { quotePlanProtegido } from './lib/internal/finance/plan-protegido.ts';
    const costs=[1,49999,50000,99999,100000,249999,250000,349999,350000,477333];
    process.stdout.write(JSON.stringify(costs.map(cost=>{const q=quotePlanProtegido(cost);return {
      cost,
      p3:{total:q.plan3.schedule.totalPesos,initial:q.plan3.schedule.initialPesos,later:q.plan3.schedule.laterPesos},
      p6:{total:q.plan6.schedule.totalPesos,initial:q.plan6.schedule.initialPesos,later:q.plan6.schedule.laterPesos},
      c3:q.plan3.commission,
      c6:q.plan6.commission,
    }})));
  `);

  for (const row of result) {
    assert.equal(row.p3.initial + row.p3.later.reduce((a,b)=>a+b,0), row.p3.total);
    assert.equal(row.p6.initial + row.p6.later.reduce((a,b)=>a+b,0), row.p6.total);
    assert.equal(row.c3.paymentPesos.reduce((a,b)=>a+b,0), row.c3.totalPesos);
    assert.equal(row.c6.paymentPesos.reduce((a,b)=>a+b,0), row.c6.totalPesos);
  }
});

test("Plan Protegido commissions use cash price and preserve 10/15 percent plus 2/3 payouts", async () => {
  const result = await runTs(`
    import { quotePlanProtegido } from './lib/internal/finance/plan-protegido.ts';
    const q=quotePlanProtegido(238666);
    process.stdout.write(JSON.stringify(q));
  `);

  assert.equal(result.markupPercent,50);
  assert.equal(result.cashPriceExact,357999);
  assert.equal(result.cashCommission.percent,10);
  assert.ok(Math.abs(result.cashCommission.totalExact-35799.9)<1e-7);
  assert.equal(result.plan3.commission.percent,15);
  assert.equal(result.plan3.commission.paymentCount,2);
  assert.ok(Math.abs(result.plan3.commission.totalExact-53699.85)<1e-7);
  assert.equal(result.plan6.commission.percent,15);
  assert.equal(result.plan6.commission.paymentCount,3);
  assert.ok(Math.abs(result.plan6.commission.totalExact-53699.85)<1e-7);
});

test("commercial Plan Protegido copy exposes no private cost, markup or 75-percent rule", async () => {
  const result = await runTs(`
    import { buildPlanProtegidoCommercialMessage, quotePlanProtegido } from './lib/internal/finance/plan-protegido.ts';
    const q=quotePlanProtegido(238666);
    process.stdout.write(JSON.stringify({message:buildPlanProtegidoCommercialMessage('SMART TV TEST',q)}));
  `);

  assert.match(result.message,/SMART TV TEST/);
  assert.match(result.message,/PLAN 3 CUOTAS/);
  assert.match(result.message,/PLAN 6 CUOTAS/);
  assert.match(result.message,/Contado:/);
  assert.doesNotMatch(result.message,/costo|markup|75%|75 %|comisi[oó]n|ganancia/i);
  assert.doesNotMatch(result.message,/PLAN 2|PLAN 4|2 CUOTAS|4 CUOTAS/);
});

test("Admin calculator exposes two formulas and keeps protected flow local-only", async () => {
  const [panel,engine]=await Promise.all([
    source("components/internal/admin/amarango-calculator-panel.tsx"),
    source("lib/internal/finance/plan-protegido.ts"),
  ]);
  assert.match(panel,/Fórmula actual/);
  assert.match(panel,/Plan Protegido/);
  assert.match(panel,/Precio de costo real/);
  assert.match(panel,/Copiar mensaje/);
  assert.match(engine,/quoteInstallmentPlan\(cashPriceExact, 6, policy\)/);
  assert.doesNotMatch([panel,engine].join("\n"),/fetch\s*\(|createClient|\.insert\s*\(|\.upsert\s*\(|\.update\s*\(|\.rpc\s*\(/i);
});
