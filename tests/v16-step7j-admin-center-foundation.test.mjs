import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

async function runTs(script) {
  const { stdout } = await execFileAsync(process.execPath, ["--experimental-strip-types", "--experimental-loader", "./tests/ts-extension-loader.mjs", "--input-type=module", "-e", script], { cwd: new URL("../", import.meta.url) });
  return JSON.parse(stdout);
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

test("Step 7J bulk parser is explicit and fail-closed around ambiguous currencies", async () => {
  const result = await runTs(`
    import { parseBulkPriceText } from './lib/internal/admin/bulk-price-parser.ts';
    process.stdout.write(JSON.stringify({
      sale: parseBulkPriceText('\\nSmart TV 50 | 310.000\\n', {mode:'sale_ars'}),
      usd: parseBulkPriceText('Samsung A17 | 185', {mode:'cost_usd'})[0],
      mixedUsd: parseBulkPriceText('Motorola G15 142usd', {mode:'mixed'})[0],
      ambiguous: parseBulkPriceText('Samsung A17 | $185', {mode:'mixed'})[0],
      mismatch: parseBulkPriceText('Samsung A17 | 185usd', {mode:'cost_ars'})[0],
    }));
  `);
  assert.equal(result.sale.length, 1);
  assert.equal(result.sale[0].status, "ready");
  assert.equal(result.sale[0].currency, "ARS");
  assert.equal(result.sale[0].priceKind, "sale");
  assert.equal(result.sale[0].rawAmount, 310000);
  assert.equal(result.usd.status, "ready");
  assert.equal(result.usd.currency, "USD");
  assert.equal(result.mixedUsd.status, "ready");
  assert.equal(result.mixedUsd.currency, "USD");
  assert.equal(result.ambiguous.status, "review");
  assert.ok(result.ambiguous.issues.includes("ambiguous_dollar_currency"));
  assert.equal(result.mismatch.status, "review");
  assert.ok(result.mismatch.issues.includes("currency_mismatch_usd_marker"));
});

test("Step 7J builds preview-only create/update proposals and keeps new products hidden", async () => {
  const result = await runTs(`
    import { parseBulkPriceText } from './lib/internal/admin/bulk-price-parser.ts';
    import { buildAdminImportPreview } from './lib/internal/admin/import-preview.ts';
    const policy={currency:'ARS',pricingTiers:[{maxCost:null,markupPercent:20}],installmentPlans:[{installments:2,surchargePercent:10,active:true}],commission:{cashPercent:1,financedPercent:1},rounding:{sale:1,installment:1,commission:1}};
    const existing=[{id:'p1',name:'Samsung A17',salePrice:300,costArs:200,costUsd:2,fxRate:100,supplier:'Old',category:'Celulares',imageUrl:'https://example.com/a.jpg',visible:true,priceUpdatedAt:1,priceConfirmedAt:null}];
    const lines=parseBulkPriceText('Samsung A17 | 3\\nMotorola G15 | 2',{mode:'cost_usd'});
    process.stdout.write(JSON.stringify(buildAdminImportPreview(lines,existing,{supplier:'Stagliano',category:'Celulares',imageUrl:'http://unsafe.test/x.jpg',fxRate:150,now:1000},policy)));
  `);
  assert.equal(result.writeAllowed, false);
  assert.equal(result.requiresAuthenticatedAdmin, true);
  assert.equal(result.requiresMfa, true);
  assert.equal(result.summary.update, 1);
  assert.equal(result.summary.create, 1);
  const updated = result.proposals.find((p) => p.action === "update");
  const created = result.proposals.find((p) => p.action === "create");
  assert.equal(updated.draft.costUsd, 3);
  assert.equal(updated.draft.costArs, 450);
  assert.equal(updated.draft.salePrice, 540);
  assert.equal(updated.draft.imageUrl, "https://example.com/a.jpg");
  assert.ok(updated.issues.includes("non_https_image_ignored"));
  assert.equal(created.draft.visible, false);
  assert.equal(created.draft.supplier, "Stagliano");
});

test("Step 7J never auto-selects among duplicate existing product names", async () => {
  const result = await runTs(`
    import { parseBulkPriceText } from './lib/internal/admin/bulk-price-parser.ts';
    import { buildAdminImportPreview } from './lib/internal/admin/import-preview.ts';
    const policy={currency:'ARS',pricingTiers:[{maxCost:null,markupPercent:10}],installmentPlans:[{installments:2,surchargePercent:10,active:true}],commission:{cashPercent:1,financedPercent:1},rounding:{sale:1,installment:1,commission:1}};
    const base={name:'Samsung A17',salePrice:1,costArs:1,costUsd:null,fxRate:null,supplier:null,category:null,imageUrl:null,visible:true,priceUpdatedAt:1,priceConfirmedAt:null};
    const lines=parseBulkPriceText('Samsung A17 | 100',{mode:'cost_ars'});
    process.stdout.write(JSON.stringify(buildAdminImportPreview(lines,[{...base,id:'a'},{...base,id:'b'}],{supplier:null,category:null,imageUrl:null,fxRate:null,now:1000},policy)));
  `);
  assert.equal(result.summary.reviewRequired, 1);
  assert.equal(result.proposals[0].matchedProductId, null);
  assert.ok(result.proposals[0].issues.includes("duplicate_existing_name"));
});

test("Step 7J admin modules and preview contain no network/write path and stay outside public storefront", async () => {
  const adminDir = fileURLToPath(new URL("../lib/internal/admin", import.meta.url));
  const adminFiles = (await walk(adminDir)).filter((file) => /\.(?:ts|tsx)$/.test(file));
  const adminSources = (await Promise.all(adminFiles.map((file) => readFile(file, "utf8")))).join("\n");
  assert.doesNotMatch(adminSources, /fetch\s*\(|XMLHttpRequest|createClient|\.insert\s*\(|\.upsert\s*\(|\.update\s*\(|\.delete\s*\(|\.rpc\s*\(/i);
  const contract = await source("lib/internal/admin/admin-center-contract.ts");
  assert.match(contract, /publicRouteEnabled:\s*false/);
  assert.match(contract, /productionWritesEnabled:\s*false/);
  assert.match(contract, /newProductsDefaultVisible:\s*false/);

  const appDir = fileURLToPath(new URL("../app", import.meta.url));
  const appFiles = (await walk(appDir)).filter((file) => /\.(?:ts|tsx)$/.test(file));
  const appSources = (await Promise.all(appFiles.map((file) => readFile(file, "utf8")))).join("\n");
  assert.doesNotMatch(appSources, /lib\/internal\/admin|@\/lib\/internal\/admin/);

  const preview = await source("prototypes/Admin-Center-Preview.html");
  assert.match(preview, /PROTOTIPO OFFLINE/);
  assert.doesNotMatch(preview, /fetch\s*\(|XMLHttpRequest|createClient|\.insert\s*\(|\.update\s*\(|\.upsert\s*\(/i);
});
