import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync=promisify(execFile);
const root=new URL("../",import.meta.url);
const source=(file)=>readFile(new URL(file,root),"utf8");
const standalone="AmarangoElectro-V16-V4.15.3.1-Full-Function-Inventory-Standalone-Android-Desktop.html";
async function runTs(script){const {stdout}=await execFileAsync(process.execPath,["--import","tsx","--input-type=module","-e",script],{cwd:root});return JSON.parse(stdout);}

test("V4.15.3.1 maps every named function from all four mandatory Legacy HTML sources",async()=>{
  const manifest=JSON.parse(await source("fixtures/v41531-legacy-capability-manifest.json"));
  assert.equal(manifest.totalNamedFunctions,1684);
  assert.deepEqual(Object.fromEntries(manifest.sources.map((item)=>[item.alias,item.namedFunctionCount])),{CRM_LEGACY_REAL:553,STORE_LEGACY_REAL:573,CALCULADORA_LEGACY:328,TIENDA_NUEVA_LEGACY:230});
  assert.equal(manifest.unmapped.length,0);
  assert.equal(manifest.functions.filter((item)=>!item.capabilityId).length,0);
  assert.equal(manifest.functions.length,1684);
});

test("V4.15.3.1 matrix IDs are unique and every row contains the complete contract",async()=>{
  const result=await runTs(`import {masterFunctionMatrix} from './lib/internal/audit/v41531-master-function-inventory.ts';const fields=['id','area','functionName','historicalSource','exactEvidence','v16State','routeUi','role','data','readWrite','dependencies','lossRisk','securityRisk','status','action','priority','futureGate','associatedTest'];process.stdout.write(JSON.stringify({count:masterFunctionMatrix.length,ids:masterFunctionMatrix.map(x=>x.id),invalid:masterFunctionMatrix.filter(x=>fields.some(f=>typeof x[f]!=='string'||!x[f].trim())).map(x=>x.id)}));`);
  assert.equal(result.count,162);
  assert.equal(new Set(result.ids).size,result.ids.length);
  assert.deepEqual(result.invalid,[]);
});

test("every scanner capability cluster has a stable master-matrix row",async()=>{
  const manifest=JSON.parse(await source("fixtures/v41531-legacy-capability-manifest.json"));
  const result=await runTs(`import {masterFunctionMatrix} from './lib/internal/audit/v41531-master-function-inventory.ts';process.stdout.write(JSON.stringify(masterFunctionMatrix.map(x=>x.id)));`);
  for(const id of Object.keys(manifest.capabilityCounts))assert.ok(result.includes(id),id);
});

test("confirmed omissions have independent rows and are not collapsed into generic investment or CRM",async()=>{
  const result=await runTs(`import {masterFunctionMatrix,requiredClosureIds} from './lib/internal/audit/v41531-master-function-inventory.ts';const byId=Object.fromEntries(masterFunctionMatrix.map(x=>[x.id,x]));process.stdout.write(JSON.stringify({required:requiredClosureIds,rows:Object.fromEntries(requiredClosureIds.map(id=>[id,byId[id]]))}));`);
  for(const id of ["CRM.CHAT.INTERNAL","CRM.NOTIFY.COLLECTIONS.DUE","CRM.TASKS.BADGE","FINANCE.INVESTOR.PAYABLES","FINANCE.RESELLER.PAYABLES","RECOVERY.CRM.FULL_BACKUP","HELP.OPERATIONAL.ASSISTANT"]){
    assert.ok(result.required.includes(id),id);assert.equal(result.rows[id].id,id);assert.match(result.rows[id].exactEvidence,/index\(8\)\.html|funciones nombradas/i);
  }
});

test("chat quick notices preserve all seven real Legacy templates",async()=>{
  const result=await runTs(`import {masterFunctionMatrix} from './lib/internal/audit/v41531-master-function-inventory.ts';process.stdout.write(JSON.stringify(masterFunctionMatrix.find(x=>x.id==='CRM.CHAT.QUICK.NOTICES')));`);
  for(const label of ["Mirá la planilla","Inversión a definir","Atraso de pago","Pendiente de entrega","Pago en efectivo","Pago transferencia","Revisar pendiente"])assert.match(result.exactEvidence,new RegExp(label,"i"),label);
  assert.equal(result.status,"PENDIENTE");
});

test("notifications, tasks and calendar preserve permission, dedupe, badges and reminders",async()=>{
  const ids=await runTs(`import {masterFunctionMatrix} from './lib/internal/audit/v41531-master-function-inventory.ts';process.stdout.write(JSON.stringify(masterFunctionMatrix.map(x=>x.id)));`);
  for(const id of ["CRM.NOTIFY.PERMISSION","CRM.NOTIFY.DEDUP","CRM.NOTIFY.BADGE.VISIBILITY","CRM.NOTIFY.PWA.STRATEGY","CRM.TASKS.CRUD","CRM.TASKS.REMINDERS","CRM.CALENDAR.OPERATIONAL","CRM.CALENDAR.TODAY","CRM.TASKS.DOMAIN.LINK"])assert.ok(ids.includes(id),id);
});

test("investor and reseller payables remain separate and future-subledger-only",async()=>{
  const rows=await runTs(`import {masterFunctionMatrix} from './lib/internal/audit/v41531-master-function-inventory.ts';process.stdout.write(JSON.stringify(masterFunctionMatrix.filter(x=>['FINANCE.INVESTOR.PAYABLES','FINANCE.RESELLER.PAYABLES','FINANCE.THIRD.PARTY.RELATION','FINANCE.THIRD.PARTY.SUBLEDGER'].includes(x.id))));`);
  assert.equal(rows.length,4);
  assert.ok(rows.every((row)=>row.status==="PENDIENTE"));
  assert.match(rows.find((row)=>row.id==="FINANCE.THIRD.PARTY.RELATION").action,/subledger/i);
  assert.notEqual(rows[0].id,rows[1].id);
});

test("full CRM backup is distinct from catalog backup and canary rollback",async()=>{
  const rows=await runTs(`import {masterFunctionMatrix} from './lib/internal/audit/v41531-master-function-inventory.ts';process.stdout.write(JSON.stringify(masterFunctionMatrix.filter(x=>x.id.startsWith('RECOVERY.CRM.'))));`);
  for(const id of ["RECOVERY.CRM.FULL_BACKUP","RECOVERY.CRM.EXPORT","RECOVERY.CRM.AUTO.LOCAL","RECOVERY.CRM.IMPORT.MERGE","RECOVERY.CRM.RESTORE","RECOVERY.CRM.AUDIT.ROLLBACK"])assert.ok(rows.some((row)=>row.id===id),id);
  assert.match(rows.find((row)=>row.id==="RECOVERY.CRM.FULL_BACKUP").v16State,/Distinguido de backup catálogo y rollback canario/i);
});

test("operational help is inventoried without connecting Margarita or productive WhatsApp",async()=>{
  const rows=await runTs(`import {masterFunctionMatrix} from './lib/internal/audit/v41531-master-function-inventory.ts';process.stdout.write(JSON.stringify(masterFunctionMatrix.filter(x=>x.id.startsWith('HELP.OPERATIONAL.'))));`);
  assert.equal(rows.length,2);
  assert.match(rows[0].v16State,/no se conecta Margarita ni IA/i);
  assert.match(rows[1].readWrite,/lectura|contexto/i);
});

test("candidate retirement remains an owner decision and no capability disappears silently",async()=>{
  const rows=await runTs(`import {masterFunctionMatrix} from './lib/internal/audit/v41531-master-function-inventory.ts';process.stdout.write(JSON.stringify(masterFunctionMatrix.filter(x=>x.status==='CANDIDATA A RETIRO')));`);
  assert.equal(rows.length,3);
  for(const row of rows)assert.match(`${row.action} ${row.futureGate}`,/dueño|owner|decisión/i,row.id);
});

test("Product V16, Photo Intelligence, Revenue Intelligence and previous premium UX files are unchanged from V4.15.3",async()=>{
  const protectedPaths=["lib/catalog","lib/integration","lib/internal/photo-intelligence","V4.15-REVENUE-INTELLIGENCE-DESIGN.md","V4.15-PHOTO-INTELLIGENCE-PRODUCTION-CONTRACT.md","V4.15-ROLLBACK-PLAN.md","AmarangoElectro-V16-V4.15.2-Product-Card-Premium-Polish-Standalone-Android.html","app/components/product-card.tsx"];
  const {stdout}=await execFileAsync("git",["diff","--name-only","18fdf29","--",...protectedPaths],{cwd:root});
  assert.equal(stdout.trim(),"");
});

test("the exact five-product canary remains unassigned and unexecuted",async()=>{
  const payload=JSON.parse(await source("V4.15-CANARY-PAYLOAD.json"));
  assert.equal(payload.products.length,5);
  for(const item of payload.products){assert.equal(item.futureCanonicalProductId,null);assert.equal(item.mapping.canonicalProductId,null);assert.equal(item.masterPayload.id,null);assert.equal(item.productV16.stableId,null);assert.equal(item.mutationExecuted,false);}
});

test("public and advisor roles still cannot import Admin tools or private projections",async()=>{
  const advisor=await source("app/components/advisor-workspace.tsx");
  const storefront=[await source("app/page.tsx"),await source("app/components/product-card.tsx")].join("\n");
  assert.doesNotMatch(advisor,/AmarangoCalculatorPanel|PlatesPanel|administrative\?\.costArs|lib\/internal\/admin|lib\/internal\/finance/);
  assert.doesNotMatch(storefront,/AdminConsolidatedWorkspace|AmarangoCalculatorPanel|PlatesPanel|lib\/internal\/admin/);
});

test("sanitized manifest contains only function metadata, never CRM row values or raw JSON",async()=>{
  const manifest=JSON.parse(await source("fixtures/v41531-legacy-capability-manifest.json"));
  for(const item of manifest.functions)assert.deepEqual(Object.keys(item).sort(),["capabilityId","line","name","source"]);
  for(const item of manifest.sources)assert.deepEqual(Object.keys(item).sort(),["alias","bytes","namedFunctionCount","sha256"]);
  assert.equal(manifest.generatedFromSanitizedMetadataOnly,true);
});

test("standalone is direct, self-contained, app-like and free of native selects/network/mutation APIs",async()=>{
  const html=await source(standalone);
  assert.match(html,/<!doctype html>/i);assert.doesNotMatch(html,/<iframe\b/i);assert.doesNotMatch(html,/<select\b/i);
  assert.doesNotMatch(html,/\bfetch\s*\(|XMLHttpRequest|createClient\s*\(|\.(?:insert|update|upsert|delete)\s*\(/i);
  assert.match(html,/class="overlay" id="overlay"/);assert.match(html,/class="chips" id="statusChips"/);assert.match(html,/env\(safe-area-inset-bottom\)/);assert.match(html,/prefers-reduced-motion/);
  const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)];assert.equal(scripts.length,1);assert.doesNotThrow(()=>new Function(scripts[0][1]));
});

test("responsive harness covers every required width and standalone includes overflow defenses",async()=>{
  const harness=await source("V4.15.3.1-RESPONSIVE-QA.html");const html=await source(standalone);
  for(const width of [320,360,390,412,768,1440])assert.match(harness,new RegExp(`V4\\.15\\.3\\.1 ${width}px`));
  assert.match(html,/min-width:0/);assert.match(html,/overflow-wrap:anywhere/);assert.match(html,/@media\(max-width:820px\)/);
});

test("closure reports expose exact final flags and unmapped zero",async()=>{
  const report=await source("V4.15.3.1-FULL-INVENTORY-CLOSURE-REPORT.md");
  for(const line of ["FULL FUNCTION INVENTORY: PASS","LEGACY PARITY MAPPED: PASS","UNMAPPED LEGACY FUNCTIONS: 0","PREVIOUS V16 FUNCTIONS PRESERVED: YES","PREMIUM APP UX PRESERVED: YES","CANARY READINESS PRESERVED: YES","CANONICAL IDS ASSIGNED: 0","PRODUCTION WRITES: 0","MAIN CHANGES: 0","DEPLOY: 0"])assert.ok(report.includes(line),line);
});

test("V4.15.3.1 safety scan proves zero mutation surface",async()=>{
  const {stdout}=await execFileAsync(process.execPath,["scripts/v41531-safety-scan.mjs"],{cwd:root});const result=JSON.parse(stdout);
  assert.equal(result.passed,true);assert.ok(Object.values(result.counts).every((count)=>count===0));
});
