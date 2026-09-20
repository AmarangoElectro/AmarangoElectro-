import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
async function runTs(script) {
  const { stdout } = await execFileAsync(process.execPath, ["--experimental-strip-types", "--experimental-loader", "./tests/ts-extension-loader.mjs", "--input-type=module", "-e", script], { cwd: new URL("../", import.meta.url) });
  return JSON.parse(stdout);
}
async function walk(dir) {
  const entries=await readdir(dir,{withFileTypes:true}); const out=[];
  for (const entry of entries) { const full=path.join(dir,entry.name); if(entry.isDirectory()) out.push(...await walk(full)); else out.push(full); }
  return out;
}

test("Step 7K puts the daily admin actions within the quick workspace", async () => {
  const result=await runTs(`
    import { adminQuickActions, adminUsabilityContract } from './lib/internal/admin/admin-workspace.ts';
    process.stdout.write(JSON.stringify({daily:adminQuickActions.filter(x=>x.daily).map(x=>x.featureId), contract:adminUsabilityContract}));
  `);
  for (const id of ["phones.bulk","catalog.bulk","catalog.product.edit","catalog.price.confirm","sales.register","clients"]) assert.ok(result.daily.includes(id), id);
  assert.equal(result.contract.dailyTasksTargetMaxTaps,2);
  assert.equal(result.contract.mobileQuickDockRequired,true);
  assert.equal(result.contract.destructiveActionsNeverPrimary,true);
});

test("Step 7K command search reaches legacy tools without removing parity", async () => {
  const result=await runTs(`
    import { searchAdminCommands, buildAdminCommandIndex } from './lib/internal/admin/admin-workspace.ts';
    const q={dolar:searchAdminCommands('dolar'), stagliano:searchAdminCommands('mayorista'), papelera:searchAdminCommands('papelera'), cupon:searchAdminCommands('cupon')};
    process.stdout.write(JSON.stringify({count:buildAdminCommandIndex().length,q}));
  `);
  assert.ok(result.count >= 50);
  assert.ok(result.q.dolar.some(x=>x.featureId==="catalog.fx.product"));
  assert.ok(result.q.stagliano.some(x=>x.featureId==="suppliers"));
  assert.ok(result.q.papelera.some(x=>x.featureId==="trash"));
  assert.ok(result.q.cupon.some(x=>x.featureId==="coupons"));
});

test("Step 7K today queue is deterministic and prioritizes price/import risk", async () => {
  const result=await runTs(`
    import { buildAdminTodayQueue } from './lib/internal/admin/admin-workspace.ts';
    const queue=buildAdminTodayQueue({stalePriceCount:8,warningPriceCount:20,missingPhoneCount:3,missingPhotoCount:4,outOfStockCount:6,importReviewCount:2,pendingSalesCount:1});
    process.stdout.write(JSON.stringify(queue));
  `);
  assert.equal(result[0].featureId,"catalog.price.confirm");
  assert.equal(result[1].featureId,"catalog.bulk");
  assert.ok(result.every((x,i,a)=>i===0 || a[i-1].priority>=x.priority));
});

test("Step 7K workspace remains internal, read-only and does not expose admin code to storefront", async () => {
  const dir=fileURLToPath(new URL('../lib/internal/admin',import.meta.url));
  const files=(await walk(dir)).filter((file)=>/\.(?:ts|tsx)$/.test(file));
  const internal=(await Promise.all(files.map((file)=>readFile(file,'utf8')))).join('\n');
  assert.doesNotMatch(internal,/fetch\s*\(|XMLHttpRequest|createClient|\.insert\s*\(|\.upsert\s*\(|\.update\s*\(|\.delete\s*\(|\.rpc\s*\(/i);
  const publicFiles=['../app/page.tsx','../app/layout.tsx','../app/categoria/[slug]/page.tsx','../app/producto/[slug]/page.tsx'];
  const storefront=(await Promise.all(publicFiles.map((file)=>readFile(new URL(file,import.meta.url),'utf8')))).join('\n');
  assert.doesNotMatch(storefront,/AdminConsolidatedWorkspace|legacy-admin-parity|phone-bulk-import|lib\/internal\/admin/);
  const adminRoute=await readFile(new URL('../app/administracion/page.tsx',import.meta.url),'utf8');
  assert.match(adminRoute,/AdminConsolidatedWorkspace/);
});
