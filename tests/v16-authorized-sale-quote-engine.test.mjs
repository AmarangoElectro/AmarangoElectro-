import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const root = new URL("../", import.meta.url);

async function runTs(script) {
  const { stdout } = await execFileAsync(
    process.execPath,
    ["--experimental-strip-types", "--experimental-loader", "./tests/ts-extension-loader.mjs", "--input-type=module", "-e", script],
    { cwd: root },
  );
  return JSON.parse(stdout);
}

test("CLASSIC authorized quote uses trusted server facts and exact payment schedule", async () => {
  const result = await runTs(`
    import { buildV16AuthorizedQuoteDraft } from './lib/operations/authorized-sale-quote-engine.ts';
    const quote=buildV16AuthorizedQuoteDraft(
      {productId:'electro:-12',productName:'Sierra',productModel:null,currentSalePriceArs:96000,costArs:60000},
      'CLASSIC',
      {paymentMode:'FINANCED',installments:4},
    );
    process.stdout.write(JSON.stringify(quote));
  `);
  assert.equal(result.financingMode, "CLASSIC");
  assert.equal(result.paymentMode, "FINANCED");
  assert.equal(result.paymentAmounts.length, 4);
  assert.equal(result.paymentAmounts[0], result.initialPayment);
  assert.equal(Math.round(result.paymentAmounts.reduce((a,b)=>a+b,0)*100), Math.round(result.financedTotal*100));
  assert.equal(result.commission, 12000);
});

test("CLASSIC may use server-certified sale price when cost is unavailable", async () => {
  const result = await runTs(`
    import { buildV16AuthorizedQuoteDraft } from './lib/operations/authorized-sale-quote-engine.ts';
    const quote=buildV16AuthorizedQuoteDraft(
      {productId:'v16-cell:4',productName:'Samsung A17',productModel:'Samsung A17',currentSalePriceArs:250000,costArs:null},
      'CLASSIC',
      {paymentMode:'CASH',installments:1},
    );
    process.stdout.write(JSON.stringify(quote));
  `);
  assert.equal(result.cashPrice, 250000);
  assert.deepEqual(result.paymentAmounts, [250000]);
  assert.equal(result.commission, 25000);
});

test("PROTECTED fails closed without a server-certified cost", async () => {
  const result = await runTs(`
    import { buildV16AuthorizedQuoteDraft } from './lib/operations/authorized-sale-quote-engine.ts';
    try {
      buildV16AuthorizedQuoteDraft(
        {productId:'v16-cell:4',productName:'Samsung A17',productModel:'Samsung A17',currentSalePriceArs:250000,costArs:null},
        'PROTECTED',
        {paymentMode:'FINANCED',installments:3},
      );
      process.stdout.write(JSON.stringify({status:'accepted'}));
    } catch (error) {
      process.stdout.write(JSON.stringify({status:'rejected',message:error.message}));
    }
  `);
  assert.equal(result.status, "rejected");
  assert.match(result.message, /PROTECTED_REQUIRES_SERVER_CERTIFIED_COST/);
});

test("PROTECTED exact schedule preserves a distinct initial payment", async () => {
  const result = await runTs(`
    import { buildV16AuthorizedQuoteDraft } from './lib/operations/authorized-sale-quote-engine.ts';
    const quote=buildV16AuthorizedQuoteDraft(
      {productId:'exp50:-12',productName:'Sierra Caladora',productModel:null,currentSalePriceArs:96000,costArs:60000},
      'PROTECTED',
      {paymentMode:'FINANCED',installments:3},
    );
    process.stdout.write(JSON.stringify(quote));
  `);
  assert.equal(result.financingMode, "PROTECTED");
  assert.equal(result.paymentAmounts.length, 3);
  assert.equal(result.paymentAmounts[0], result.initialPayment);
  assert.ok(result.initialPayment > result.paymentAmounts[1]);
  assert.equal(Math.round(result.paymentAmounts.reduce((a,b)=>a+b,0)*100), Math.round(result.financedTotal*100));
});
