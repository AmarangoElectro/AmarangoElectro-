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

test("commercial snapshot freezes the exact payment schedule, including a different initial payment", async () => {
  const result = await runTs(`
    import { createImmutableCommercialSaleSnapshot } from './lib/integration/sale-snapshot.ts';
    const snapshot=createImmutableCommercialSaleSnapshot({
      financingMode:'PROTECTED',
      cashPrice:300000,
      initialPayment:150000,
      installments:3,
      installmentAmount:127500,
      financedTotal:405000,
      paymentSchedule:[
        {sequence:1,amount:150000,dueDate:'2026-09-27',graceThrough:'2026-09-30'},
        {sequence:2,amount:127500,dueDate:'2026-10-27',graceThrough:'2026-10-30'},
        {sequence:3,amount:127500,dueDate:'2026-11-27',graceThrough:'2026-11-30'},
      ],
      commission:37500,
      commissionPolicyVersion:'2026-09-26',
      pricingPolicyVersion:'2026-09-25',
      soldAt:'2026-09-27T15:00:00.000Z',
    });
    process.stdout.write(JSON.stringify({snapshot,frozen:Object.isFrozen(snapshot)&&Object.isFrozen(snapshot.paymentSchedule)&&Object.isFrozen(snapshot.paymentSchedule[0])}));
  `);
  assert.deepEqual(result.snapshot.paymentSchedule.map((row) => row.amount), [150000,127500,127500]);
  assert.equal(result.snapshot.paymentSchedule.length, 3);
  assert.equal(result.frozen, true);
});

test("commercial snapshot rejects schedules that do not reconcile to total or initial", async () => {
  const result = await runTs(`
    import { createImmutableCommercialSaleSnapshot } from './lib/integration/sale-snapshot.ts';
    const base={
      financingMode:'PROTECTED',cashPrice:300000,initialPayment:150000,installments:3,installmentAmount:127500,
      financedTotal:405000,commission:37500,commissionPolicyVersion:'2026-09-26',pricingPolicyVersion:'2026-09-25',
      soldAt:'2026-09-27T15:00:00.000Z'
    };
    const schedules=[
      [
        {sequence:1,amount:149999,dueDate:'2026-09-27',graceThrough:'2026-09-30'},
        {sequence:2,amount:127500,dueDate:'2026-10-27',graceThrough:'2026-10-30'},
        {sequence:3,amount:127501,dueDate:'2026-11-27',graceThrough:'2026-11-30'},
      ],
      [
        {sequence:1,amount:150000,dueDate:'2026-09-27',graceThrough:'2026-09-30'},
        {sequence:2,amount:100000,dueDate:'2026-10-27',graceThrough:'2026-10-30'},
        {sequence:3,amount:100000,dueDate:'2026-11-27',graceThrough:'2026-11-30'},
      ],
    ];
    process.stdout.write(JSON.stringify(schedules.map(paymentSchedule=>{
      try { createImmutableCommercialSaleSnapshot({...base,paymentSchedule}); return 'accepted'; }
      catch (error) { return error.message; }
    })));
  `);
  assert.match(result[0], /inicial/);
  assert.match(result[1], /financedTotal/);
});

test("prepared SQL stores payment amounts on quote and an immutable dated schedule on the sale", async () => {
  const sql = await source("supabase/migrations/20260927_v16_core_operational_prepared.sql");
  assert.match(sql, /payment_amounts jsonb not null/);
  assert.match(sql, /payment_schedule jsonb not null/);
  assert.match(sql, /v16_build_sale_payment_schedule/);
  assert.match(sql, /'graceThrough',\(v_due\+3\)::text/);
  assert.match(sql, /payment_schedule_total_mismatch/);
  assert.match(sql, /v16_payment_event_sync_sale_next_amount/);
  assert.match(sql, /set "montoCuota"=v_amount/);
  assert.match(sql, /\(v_quote\.payment_amounts->>0\)::numeric/);
});
