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
  const entries = await readdir(dir, { withFileTypes: true }); const files=[];
  for (const entry of entries) { const full=path.join(dir,entry.name); if(entry.isDirectory()) files.push(...await walk(full)); else files.push(full); }
  return files;
}

test("Step 7J.1 freezes broad Legacy Admin parity instead of a reduced admin rewrite", async () => {
  const result = await runTs(`
    import { legacyAdminParity, legacyRequiredAdminFeatureIds } from './lib/internal/admin/legacy-admin-parity.ts';
    process.stdout.write(JSON.stringify({count:legacyAdminParity.length, required:legacyRequiredAdminFeatureIds, labels:legacyAdminParity.map(x=>x.legacyLabel)}));
  `);
  assert.ok(result.count >= 50);
  for (const id of ["catalog.bulk","phones.bulk","phones.fx.reprice","phones.features.bulk","phones.photos.bank","catalog.price.confirm","catalog.fx.product","finance.calculator","finance.commissions","finance.investment","trash","backups.restore","suppliers","orders.history","clients","stats","sales.team","banner","coupons","catalog.pdf","client.preview"]) assert.ok(result.required.includes(id), id);
  assert.ok(result.labels.includes("Cargar / actualizar celulares"));
  assert.ok(result.labels.includes("Actualizar dólar sin pegar nada"));
});

test("Step 7J.1 phone parser preserves Legacy multiline, WhatsApp strikeout, colors and name variants", async () => {
  const result = await runTs(`
    import { parseLegacyPhoneList, canonicalPhoneKey } from './lib/internal/admin/phone-bulk-import.ts';
    const text='LISTA PRECIOS\\nSamsung A17 128GB\\n$ 310.000 (blue-black)\\nMoto G15 256GB ~\\$300.000~ \\$ 340.000\\niPhone 13 128GB 110usd (white)';
    process.stdout.write(JSON.stringify({rows:parseLegacyPhoneList(text,'sale_ars'), k1:canonicalPhoneKey('Moto G15 128gb'), k2:canonicalPhoneKey('Motorola G15 128 GB')}));
  `);
  assert.equal(result.rows.length,3);
  assert.equal(result.rows[0].name,"Samsung A17 128GB");
  assert.equal(result.rows[0].sourceAmount,310000);
  assert.deepEqual(result.rows[0].colors,["blue","black"]);
  assert.equal(result.rows[1].sourceAmount,340000);
  assert.equal(result.k1,result.k2);
});

test("Step 7J.1 phone preview updates without losing metadata, keeps creates hidden and exposes missing decisions", async () => {
  const result = await runTs(`
    import { parseLegacyPhoneList, buildLegacyPhoneImportPreview, previewPhoneFxUpdate } from './lib/internal/admin/phone-bulk-import.ts';
    const policy={currency:'ARS',pricingTiers:[{maxCost:null,markupPercent:20}],installmentPlans:[{installments:2,surchargePercent:10,active:true}],commission:{cashPercent:1,financedPercent:1},rounding:{sale:1,installment:1,commission:1}};
    const existing=[
      {id:'a',name:'Motorola G15 128GB',salePrice:1,imageUrl:'https://img/g15.jpg',visible:true,features:'specs',category:'Celulares',outOfStock:false,originalUsd:100,fxRate:1000},
      {id:'b',name:'Samsung A16 128GB',salePrice:2,imageUrl:null,visible:true,features:null,category:'Celulares',outOfStock:false}
    ];
    const parsed=parseLegacyPhoneList('Moto G15 128GB 120usd\\nSamsung A17 128GB 130usd','cost_usd');
    const preview=buildLegacyPhoneImportPreview(parsed,existing,'cost_usd',1500,policy);
    const fx=previewPhoneFxUpdate(existing,1600,policy);
    process.stdout.write(JSON.stringify({preview,fx}));
  `);
  assert.equal(result.preview.writeAllowed,false);
  assert.equal(result.preview.updates.length,1);
  assert.equal(result.preview.updates[0].next.imageUrl,"https://img/g15.jpg");
  assert.equal(result.preview.updates[0].next.features,"specs");
  assert.equal(result.preview.creates.length,1);
  assert.equal(result.preview.creates[0].visible,false);
  assert.equal(result.preview.missing.length,1);
  assert.equal(result.preview.missingDecisionRequired,true);
  assert.equal(result.fx.writeAllowed,false);
  assert.equal(result.fx.updates.length,1);
});

test("Step 7J.1 parity layer stays internal and has no network/write primitive", async () => {
  const dir=fileURLToPath(new URL('../lib/internal/admin',import.meta.url));
  const files=(await walk(dir)).filter((file)=>/\.(?:ts|tsx)$/.test(file));
  const all=(await Promise.all(files.map((file)=>readFile(file,'utf8')))).join('\n');
  assert.doesNotMatch(all,/fetch\s*\(|XMLHttpRequest|createClient|\.insert\s*\(|\.upsert\s*\(|\.update\s*\(|\.delete\s*\(|\.rpc\s*\(/i);
  const contract=await source('lib/internal/admin/admin-center-contract.ts');
  assert.match(contract,/legacyAdminParityRequired:\s*true/);
  assert.match(contract,/legacyPasteFormatsMustRemainCompatible:\s*true/);
  assert.match(contract,/legacyFeatureRemovalRequiresOwnerApproval:\s*true/);
  const appDir=fileURLToPath(new URL('../app',import.meta.url));
  const appFiles=(await walk(appDir)).filter((file)=>/\.(?:ts|tsx)$/.test(file));
  const app=(await Promise.all(appFiles.map((file)=>readFile(file,'utf8')))).join('\n');
  assert.doesNotMatch(app,/legacy-admin-parity|phone-bulk-import|lib\/internal\/admin/);
});
