import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");
async function runTs(script) {
  const { stdout } = await execFileAsync(process.execPath,["--experimental-strip-types","--experimental-loader","./tests/ts-extension-loader.mjs","--input-type=module","-e",script],{cwd:root});
  return JSON.parse(stdout);
}

test("V4.18B projection is fail-closed by role and context", async () => {
  const result = await runTs(`import {resolveV418BStorefrontProjection} from './lib/internal/admin/v418b-storefront-admin-mode.ts';const f=(role,internalLabContext,adminMode)=>resolveV418BStorefrontProjection({role,internalLabContext,adminMode});process.stdout.write(JSON.stringify({client:f('client',true,true),advisor:f('advisor',true,true),adminPublic:f('admin',false,true),adminOff:f('admin',true,false),adminOn:f('admin',true,true)}));`);
  assert.deepEqual(result,{client:"client",advisor:"advisor",adminPublic:"client",adminOff:"client",adminOn:"admin-overlay"});
});

test("V4.18B activation contract cannot be enabled from public, URL or persistence", async () => {
  const result = await runTs(`import {v418bStorefrontAdminModeContract} from './lib/internal/admin/v418b-storefront-admin-mode.ts';process.stdout.write(JSON.stringify(v418bStorefrontAdminModeContract));`);
  assert.equal(result.publicActivationEnabled,false);
  assert.equal(result.urlActivationEnabled,false);
  assert.equal(result.persistedActivationEnabled,false);
  assert.equal(result.serverSideBusinessAuthorizationImplemented,false);
  assert.equal(result.writeGate,"SIMULADO_BLOQUEADO");
});

test("V4.18B public Client and Advisor surfaces do not receive Admin Mode controls", async () => {
  const files=["app/page.tsx","app/categoria/[slug]/page.tsx","app/buscar/page.tsx","app/producto/[slug]/page.tsx","app/mi-amarango/page.tsx","app/components/advisor-workspace.tsx","app/components/site-header.tsx"];
  for (const file of files) {
    const content=await source(file);
    assert.doesNotMatch(content,/adminOverlay|V418BStorefrontAdminPreview|ADMIN MODE|Quick Actions V4\.18A/);
  }
});

test("V4.18B activation exists only in the internal Administration LAB surface", async () => {
  const [admin,workspace,preview]=await Promise.all([source("app/administracion/page.tsx"),source("app/components/admin-consolidated-workspace.tsx"),source("components/internal/admin/v418b-storefront-admin-preview.tsx")]);
  assert.match(admin,/V4\.18B · LAB/);
  assert.match(workspace,/V418BStorefrontAdminPreview/);
  assert.match(workspace,/Tienda Admin/);
  assert.match(preview,/role: "admin", internalLabContext: true/);
});

test("V4.18B Admin Mode OFF returns the unchanged Customer card path", async () => {
  const catalog=await source("app/components/catalog-client.tsx");
  assert.match(catalog,/const customerCard = \(/);
  assert.match(catalog,/if \(!adminOverlay\?\.enabled\) return customerCard;/);
  assert.match(catalog,/data-v418b-admin-control="true"/);
  assert.match(catalog,/adminOverlay\.onQuickActions\(product\)/);
});

test("V4.18B reuses the V4.18A Quick Actions sheet without changing its Write Gate", async () => {
  const preview=await source("components/internal/admin/v418b-storefront-admin-preview.tsx");
  assert.match(preview,/V418AQuickActionsSheet/);
  const contract=await runTs(`import {v418aWriteGate} from './lib/internal/admin/v418a-quick-actions.ts';process.stdout.write(JSON.stringify(v418aWriteGate));`);
  assert.equal(contract.mode,"SIMULADO_BLOQUEADO");
  assert.equal(contract.productionWritesEnabled,false);
  assert.equal(contract.persistenceEnabled,false);
});

test("V4.18B mode and selected product remain ephemeral React state", async () => {
  const preview=await source("components/internal/admin/v418b-storefront-admin-preview.tsx");
  assert.match(preview,/useState\(false\)/);
  assert.match(preview,/useState<string \| null>\(null\)/);
  assert.doesNotMatch(preview,/localStorage|sessionStorage|indexedDB|document\.cookie|URLSearchParams|location\.search/);
});

test("V4.18B overlay does not render sensitive Admin financial fields", async () => {
  const [preview,catalog]=await Promise.all([source("components/internal/admin/v418b-storefront-admin-preview.tsx"),source("app/components/catalog-client.tsx")]);
  assert.doesNotMatch([preview,catalog].join("\n"),/>\s*(?:Costo|Margen|USD|Inversi[oó]n|Proveedor interno)\s*</i);
  assert.match(preview,/costArs: null/);
  assert.match(preview,/supplier: null/);
});

test("V4.18B toggle OFF closes Quick Actions and cannot mutate the catalog", async () => {
  const preview=await source("components/internal/admin/v418b-storefront-admin-preview.tsx");
  assert.match(preview,/if \(!next\) setQuickProductId\(null\)/);
  assert.doesNotMatch(preview,/\.insert\s*\(|\.update\s*\(|\.upsert\s*\(|\.delete\s*\(|fetch\s*\(|\.storage\./i);
});

test("V4.18B responsive CSS is scoped and does not globally hide overflow", async () => {
  const css=await source("app/globals.css");
  assert.match(css,/\.v418b-storefront-lab/);
  assert.match(css,/@media \(max-width: 620px\)/);
  assert.doesNotMatch(css,/(?:^|[,}]\s*)(?:html|body|:root)\s*\{[^}]*overflow-x\s*:\s*hidden/mi);
});



test("V4.18B responsive harness covers the exact required widths", async () => {
  const harness=await source("public/V4.18B-Responsive-QA.html");
  for (const width of [320,360,390,412,768,1440]) assert.match(harness,new RegExp(`\\b${width}\\b`));
  assert.match(harness,/documentElement\.clientWidth/);
  assert.match(harness,/documentElement\.scrollWidth/);
});
test("V4.18B preserves Product V16, V4.16, V4.17 and V4.18A protected hashes with zero new write counters", async () => {
  const {stdout}=await execFileAsync(process.execPath,["scripts/v418b-safety-scan.mjs"],{cwd:root});
  const result=JSON.parse(stdout);
  assert.equal(result.passed,true);
  assert.ok(Object.values(result.counts).every((count)=>count===0));
  assert.ok(Object.values(result.protectedHashes).every((entry)=>entry.passed));
});
