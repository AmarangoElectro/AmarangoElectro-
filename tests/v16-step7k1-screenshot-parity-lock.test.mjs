import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync=promisify(execFile);
const root=new URL("../",import.meta.url);
const source=(file)=>readFile(new URL(file,root),"utf8");
async function runTs(script){const {stdout}=await execFileAsync(process.execPath,["--experimental-strip-types","--experimental-loader","./tests/ts-extension-loader.mjs","--input-type=module","-e",script],{cwd:new URL("../",import.meta.url)});return JSON.parse(stdout)}
async function walk(dir){const entries=await readdir(dir,{withFileTypes:true});const out=[];for(const entry of entries){const full=path.join(dir,entry.name);if(entry.isDirectory())out.push(...await walk(full));else out.push(full)}return out}

test("Step 7K.1 locks screenshot-only Admin capabilities into parity",async()=>{
  const result=await runTs(`
    import { legacyAdminParity, legacyRequiredAdminFeatureIds } from './lib/internal/admin/legacy-admin-parity.ts';
    import { adminScreenshotParity, lockedScreenshotLabels } from './lib/internal/admin/admin-screenshot-parity.ts';
    process.stdout.write(JSON.stringify({count:legacyAdminParity.length,required:legacyRequiredAdminFeatureIds,labels:lockedScreenshotLabels,targets:adminScreenshotParity.map(x=>x.targetFeatureId)}));
  `);
  assert.ok(result.count>=70,result.count);
  for(const id of ["insights.demand","insights.promote","catalog.rare.cleanup","collaborator.program","catalog.share.multiple","store.qr","store.share","store.appearance.color","store.appearance.sound","store.appearance.theme","auth.logout","events.team","catalog.product.copy","catalog.product.instagram","catalog.product.image_download","catalog.product.cost_to_sale","catalog.product.sale_to_cost","catalog.bulk.replace_all","images.admin_session"]) assert.ok(result.required.includes(id),id);
  for(const label of ["Qué busca tu gente","Qué promocionar","Compartir varios","Código QR","Color de la tienda","Modo claro / oscuro","Costo → Venta","Venta → Costo","Reemplazar todo el catálogo","Equipo de eventos"]) assert.ok(result.labels.includes(label),label);
});

test("Step 7K.1 keeps the product editor dense and fast instead of adding navigation depth",async()=>{
  const result=await runTs(`
    import { adminProductEditorContract, adminProductContextActions, adminToolGroups } from './lib/internal/admin/admin-workspace.ts';
    process.stdout.write(JSON.stringify({contract:adminProductEditorContract,actions:adminProductContextActions,groups:adminToolGroups}));
  `);
  assert.equal(result.contract.singleSurfaceRequired,true);
  assert.equal(result.contract.tabsRequired,false);
  assert.equal(result.contract.costAndSaleVisibleTogether,true);
  assert.equal(result.contract.costToSaleOneTap,true);
  assert.equal(result.contract.saleToCostOneTap,true);
  assert.equal(result.contract.mobilePrimaryActionSticky,true);
  for(const id of ["catalog.product.edit","catalog.product.copy","catalog.product.instagram","catalog.product.image_download","catalog.featured","catalog.product_day","catalog.visibility","catalog.stock"]) assert.ok(result.actions.some(x=>x.featureId===id),id);
  assert.ok(result.groups.length>=7);
});

test("Step 7K.1 global Admin search reaches functions seen in the screenshots",async()=>{
  const result=await runTs(`
    import { searchAdminCommands } from './lib/internal/admin/admin-workspace.ts';
    const q={busca:searchAdminCommands('que busca'),promocionar:searchAdminCommands('promocionar'),qr:searchAdminCommands('codigo qr'),oscuro:searchAdminCommands('modo oscuro'),instagram:searchAdminCommands('instagram'),eventos:searchAdminCommands('eventos')};
    process.stdout.write(JSON.stringify(q));
  `);
  assert.ok(result.busca.some(x=>x.featureId==="insights.demand"));
  assert.ok(result.promocionar.some(x=>x.featureId==="insights.promote"));
  assert.ok(result.qr.some(x=>x.featureId==="store.qr"));
  assert.ok(result.oscuro.some(x=>x.featureId==="store.appearance.theme"));
  assert.ok(result.instagram.some(x=>x.featureId==="catalog.product.instagram"));
  assert.ok(result.eventos.some(x=>x.featureId==="events.team"));
});

test("Step 7K.1 preview shows parity plus safer/faster workflows and remains offline",async()=>{
  const html=await source('prototypes/Admin-Center-Preview.html');
  for(const text of ["PROTOTIPO OFFLINE","PARIDAD BLOQUEADA POR CAPTURAS","Centro de herramientas","Costo→Venta","Venta→Costo","Reemplazar todo el catálogo","Qué busca tu gente","Qué promocionar","Código QR","Equipo de eventos","Nada se guarda todavía","Guardado real bloqueado"]) assert.match(html,new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'));
  assert.doesNotMatch(html,/fetch\s*\(|XMLHttpRequest|createClient|\.insert\s*\(|\.upsert\s*\(|\.update\s*\(|\.rpc\s*\(/i);
  const dir=fileURLToPath(new URL('../lib/internal/admin',import.meta.url));
  const files=(await walk(dir)).filter(f=>/\.(?:ts|tsx)$/.test(f));
  const all=(await Promise.all(files.map(f=>readFile(f,'utf8')))).join('\n');
  assert.doesNotMatch(all,/fetch\s*\(|XMLHttpRequest|createClient|\.insert\s*\(|\.upsert\s*\(|\.update\s*\(|\.delete\s*\(|\.rpc\s*\(/i);
  const contract=await source('lib/internal/admin/admin-center-contract.ts');
  assert.match(contract,/screenshotParityLockRequired:\s*true/);
  assert.match(contract,/adminUxMayReduceStepsButNotCapabilities:\s*true/);
});
