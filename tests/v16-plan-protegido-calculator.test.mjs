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

test("global coherent pricing uses exact markup boundaries and mandatory floors", async () => {
  const result = await runTs(`
    import { quoteCoherentCashPrice } from './lib/internal/finance/coherent-pricing.ts';
    const costs=[49998,49999,50000,50001,99999,100000,249999,250000,349999,350000,350001];
    process.stdout.write(JSON.stringify(costs.map(cost=>quoteCoherentCashPrice(cost))));
  `);

  assert.deepEqual(result.map(x=>x.markupPercent), [80,80,60,60,60,50,50,40,40,30,30]);
  assert.equal(result[1].commercialPrice, 89999);
  assert.equal(result[2].commercialPrice, 89999);
  assert.equal(result[4].commercialPrice, 159999);
  assert.equal(result[5].commercialPrice, 159999);
  assert.equal(result[6].commercialPrice, 374999);
  assert.equal(result[7].commercialPrice, 374999);
  assert.equal(result[8].commercialPrice, 489999);
  assert.equal(result[9].commercialPrice, 489999);
  assert.equal(result[2].coherenceFloor, 89998.2);
  assert.equal(result[5].coherenceFloor, 159998.4);
  assert.equal(result[7].coherenceFloor, 374998.5);
  assert.equal(result[9].coherenceFloor, 489998.6);
  assert.equal(result[2].coherenceApplied, true);
  assert.equal(result[5].coherenceApplied, true);
  assert.equal(result[7].coherenceApplied, true);
  assert.equal(result[9].coherenceApplied, true);
  for (const row of result) assert.ok(row.commercialPrice >= row.coherentPrice);
});

test("strategic commercial rounding is centralized and never rounds below coherent price", async () => {
  const result = await runTs(`
    import { strategicRoundUp } from './lib/internal/finance/coherent-pricing.ts';
    const values=[100000,100127,100300,100450,100500,100850,100999,101000];
    process.stdout.write(JSON.stringify(values.map(value=>[value,strategicRoundUp(value)])));
  `);
  assert.deepEqual(result, [
    [100000,100299],
    [100127,100299],
    [100300,100499],
    [100450,100499],
    [100500,100799],
    [100850,100999],
    [100999,100999],
    [101000,101299],
  ]);
  for (const [input,output] of result) assert.ok(output>=input);
});

test("cash price is monotonic for every whole-peso cost through 600k", async () => {
  const result = await runTs(`
    import { quoteCoherentCashPrice } from './lib/internal/finance/coherent-pricing.ts';
    let previous=quoteCoherentCashPrice(1).commercialPrice;
    let failure=null;
    for(let cost=2;cost<=600000;cost+=1){
      const current=quoteCoherentCashPrice(cost).commercialPrice;
      if(current<previous){failure={cost,previous,current};break;}
      previous=current;
    }
    process.stdout.write(JSON.stringify({failure,previous}));
  `);
  assert.equal(result.failure, null);
});

test("Classic and Plan Protegido share exactly the same definitive cash price", async () => {
  const result = await runTs(`
    import { quoteAmarangoCalculator } from './lib/internal/finance/amarango-calculator.ts';
    import { quotePlanProtegido } from './lib/internal/finance/plan-protegido.ts';
    const costs=[49998,49999,50000,50001,99999,100000,249999,250000,349999,350000,350001,477333];
    process.stdout.write(JSON.stringify(costs.map(cost=>{
      const classic=quoteAmarangoCalculator({mode:'cost_ars',amount:cost,installmentPlans:[2,4,6]});
      const protectedQuote=quotePlanProtegido(cost);
      return {cost,classic:classic.salePrice,protected:protectedQuote.cashPriceExact,markupClassic:classic.markupPercent,markupProtected:protectedQuote.markupPercent};
    })));
  `);
  for (const row of result) {
    assert.equal(row.classic,row.protected);
    assert.equal(row.markupClassic,row.markupProtected);
  }
});

test("Plan Protegido protects the initial above every later installment without breaking 55% cap", async () => {
  const result = await runTs(`
    import { quotePlanProtegido } from './lib/internal/finance/plan-protegido.ts';
    const costs=[49998,49999,50000,50001,99999,100000,249999,250000,349999,350000,350001,477333];
    process.stdout.write(JSON.stringify(costs.map(cost=>quotePlanProtegido(cost))));
  `);
  for (const q of result) {
    const initialBase=Math.min(q.costExact*.75,q.cashPriceExact*.55);
    assert.ok(Math.abs(q.initialBaseExact-initialBase)<0.011);
    assert.ok(q.initialExact+0.011>=q.plan3.totalExact/3);
    assert.ok(q.initialExact+0.011>=q.plan6.totalExact/6);
    assert.ok(q.initialExact<=q.cashPriceExact*.55+0.011);
    assert.ok(q.plan3.schedule.laterPesos.every(payment=>q.plan3.schedule.initialPesos>payment));
    assert.ok(q.plan6.schedule.laterPesos.every(payment=>q.plan6.schedule.initialPesos>payment));
    assert.ok(Math.abs(q.cashCommission.totalExact-q.cashPriceExact*.10)<0.011);
    assert.ok(Math.abs(q.plan3.commission.totalExact-q.cashPriceExact*.15)<0.011);
    assert.ok(Math.abs(q.plan6.commission.totalExact-q.cashPriceExact*.15)<0.011);
    assert.equal(q.plan3.commission.paymentCount,2);
    assert.equal(q.plan6.commission.paymentCount,3);
    assert.equal(q.plan6.surchargePercent,78);
    assert.ok(Math.abs(q.cashAmarangoNetExact-(q.cashPriceExact-q.costExact-q.cashCommission.totalExact))<0.011);
    assert.ok(Math.abs(q.plan3.amarangoNetExact-(q.plan3.totalExact-q.costExact-q.plan3.commission.totalExact))<0.011);
    assert.ok(Math.abs(q.plan6.amarangoNetExact-(q.plan6.totalExact-q.costExact-q.plan6.commission.totalExact))<0.011);
    assert.equal(q.plan3.schedule.initialPesos+q.plan3.schedule.laterPesos.reduce((a,b)=>a+b,0),q.plan3.schedule.totalPesos);
    assert.equal(q.plan6.schedule.initialPesos+q.plan6.schedule.laterPesos.reduce((a,b)=>a+b,0),q.plan6.schedule.totalPesos);
  }
});

test("commercial protected copy keeps private pricing mechanics out", async () => {
  const result = await runTs(`
    import { buildPlanProtegidoCommercialMessage, quotePlanProtegido } from './lib/internal/finance/plan-protegido.ts';
    const q=quotePlanProtegido(238666);
    process.stdout.write(JSON.stringify({message:buildPlanProtegidoCommercialMessage('SMART TV TEST',q)}));
  `);
  assert.match(result.message,/SMART TV TEST/);
  assert.match(result.message,/PLAN 3 CUOTAS/);
  assert.match(result.message,/PLAN 6 CUOTAS/);
  assert.match(result.message,/Contado:/);
  assert.doesNotMatch(result.message,/costo|markup|75%|55%|piso|coherencia|comisi[oó]n|ganancia/i);
});

test("Admin calculator exposes two cost-fed formulas without write paths", async () => {
  const [panel,engine]=await Promise.all([
    source("components/internal/admin/amarango-calculator-panel.tsx"),
    source("lib/internal/finance/coherent-pricing.ts"),
  ]);
  assert.match(panel,/Calculadora clásica/);
  assert.match(panel,/Plan Protegido/);
  assert.match(panel,/Precio de costo real/);
  assert.doesNotMatch(panel,/>Venta ARS</);
  assert.match(engine,/AMARANGO_STRATEGIC_TERMINATIONS/);
  assert.doesNotMatch([panel,engine].join("\n"),/fetch\s*\(|createClient|\.insert\s*\(|\.upsert\s*\(|\.update\s*\(|\.rpc\s*\(/i);
});


test("Plan Protegido QA cost 50k automatically raises initial just enough for strict later-payment relief", async () => {
  const result = await runTs(`
    import { quotePlanProtegido } from './lib/internal/finance/plan-protegido.ts';
    const q=quotePlanProtegido(50000);
    process.stdout.write(JSON.stringify(q));
  `);
  assert.equal(result.cashPriceExact,89999);
  assert.equal(result.initialBaseExact,37500);
  assert.ok(Math.abs(result.minInitial3Exact-(result.plan3.totalExact/3))<0.011);
  assert.equal(result.initialPesos,40501);
  assert.ok(Math.abs(result.initialExact-40500.55)<0.011);
  assert.deepEqual(result.plan3.schedule.laterPesos,[40499,40499]);
  assert.ok(result.plan6.schedule.laterPesos.every(payment=>result.initialPesos>payment));
  assert.ok(result.initialExact<=result.initialCapExact);
});

test("future protected-plan configuration must fail loudly when required initial exceeds 55-percent cap", async () => {
  const result = await runTs(`
    import { quotePlanProtegido } from './lib/internal/finance/plan-protegido.ts';
    import { AMARANGO_CURRENT_POLICY } from './lib/internal/finance/amarango-policy.ts';
    const invalidPolicy={
      ...AMARANGO_CURRENT_POLICY,
      installmentPlans: AMARANGO_CURRENT_POLICY.installmentPlans.map(plan =>
        plan.installments===6 ? {...plan,surchargePercent:300,active:true} : plan
      ),
    };
    let error=null;
    try { quotePlanProtegido(100000,invalidPolicy); }
    catch (value) { error={name:value?.name,code:value?.code,message:value?.message}; }
    process.stdout.write(JSON.stringify({error}));
  `);
  assert.equal(result.error.name,"ProtectedInitialConfigurationError");
  assert.equal(result.error.code,"PROTECTED_INITIAL_EXCEEDS_55_PERCENT_CASH_CAP");
  assert.match(result.error.message,/55% del contado|55%/i);
});
