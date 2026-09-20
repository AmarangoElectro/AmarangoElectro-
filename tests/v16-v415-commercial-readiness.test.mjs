import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { Script } from "node:vm";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");
const readJson = async (file) => JSON.parse(await source(file));

function runLab(script) {
  return JSON.parse(execFileSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", script], {
    cwd: new URL(".", root),
    encoding: "utf8",
  }).trim());
}

test("V4.15 selects exactly one clean product from each requested segment", async () => {
  const payload = await readJson("V4.15-CANARY-PAYLOAD.json");
  assert.equal(payload.canarySize, 5);
  assert.deepEqual(payload.products.map((item) => item.legacyPosition), [10, 18, 45, 73, 87]);
  assert.deepEqual(payload.products.map((item) => item.representedBrand), ["Apple", "Samsung", "Motorola", "Xiaomi", "Infinix"]);
  assert.equal(new Set(payload.products.map((item) => item.legacyCellphoneKey)).size, 5);
  assert.equal(new Set(payload.products.map((item) => item.productV16.image)).size, 5);
});

test("V4.15 canary keeps IDs unassigned and publication fail-closed", async () => {
  const payload = await readJson("V4.15-CANARY-PAYLOAD.json");
  for (const item of payload.products) {
    assert.equal(item.futureCanonicalProductId, null);
    assert.equal(item.productV16.stableId, null);
    assert.equal(item.masterPayload.id, null);
    assert.equal(item.mapping.canonicalProductId, null);
    assert.equal(item.productV16.visibility, "pending");
    assert.equal(item.productV16.availability, "unknown");
    assert.deepEqual(item.productV16.financing, []);
    assert.equal(item.mutationExecuted, false);
  }
  assert.equal(payload.writeEnabled, false);
});

test("V4.15 explicitly excludes the ambiguous Infinix bundle", async () => {
  const payload = await readJson("V4.15-CANARY-PAYLOAD.json");
  assert.equal(payload.blockedFromCanary.legacyPosition, 91);
  assert.ok(payload.blockedFromCanary.reasons.includes("gamer_kit_bundle_not_visible"));
  assert.ok(payload.products.every((item) => item.legacyPosition !== 91));
});

test("V4.15 client card keeps full name, audited specs and at most four features", () => {
  const result = runLab(String.raw`
    import { createV415ClientCard } from "./lib/commerce/v415-client-card.ts";
    const card=createV415ClientCard({legacyMappingKey:"k",name:"Nombre completo sin truncar",brand:"Marca",model:"Modelo",memory:"256 GB",ram:"8 GB",image:"https://example.com/a.jpg",cashPriceARS:1234567,financing:[],availability:"unknown",featureDetails:[1,2,3,4,5].map((n)=>({label:"F"+n,value:"V"+n,provenance:"explicit_visual",confidence:1}))});
    console.log(JSON.stringify(card));
  `);
  assert.equal(result.fullName, "Nombre completo sin truncar");
  assert.deepEqual(result.specs, ["256 GB", "8 GB"]);
  assert.equal(result.features.length, 4);
  assert.equal(result.financing, null);
  assert.equal(result.availabilityLabel, "Disponibilidad a confirmar");
  assert.equal(result.primaryAction, "Ver producto");
});

test("V4.15 client card rejects unaudited financing and invalid public imagery", () => {
  const result = runLab(String.raw`
    import { createV415ClientCard } from "./lib/commerce/v415-client-card.ts";
    const base={legacyMappingKey:"k",name:"N",brand:"B",model:"M",memory:"128 GB",ram:"4 GB",cashPriceARS:1,availability:"unknown",featureDetails:[]};
    let financing="",image="";try{createV415ClientCard({...base,image:"https://x/a.jpg",financing:[{term:6}]})}catch(e){financing=e.message}try{createV415ClientCard({...base,image:"http://x/a.jpg",financing:[]})}catch(e){image=e.message}console.log(JSON.stringify({financing,image}));
  `);
  assert.equal(result.financing, "unaudited_financing_forbidden");
  assert.equal(result.image, "https_image_required");
});

test("V4.15 PhotoAnalyzerProvider policy is provider-agnostic and blocks auto publication", () => {
  const result = runLab(String.raw`
    import { V415_PHOTO_ANALYZER_POLICY } from "./lib/photo-intelligence/v415-photo-analyzer-provider.ts";
    console.log(JSON.stringify(V415_PHOTO_ANALYZER_POLICY));
  `);
  assert.equal(result.deterministicFirst, true);
  assert.equal(result.cacheByFingerprint, true);
  assert.equal(result.explicitReanalysisOnly, true);
  assert.equal(result.humanApprovalRequired, true);
  assert.equal(result.automaticPublishAllowed, false);
  assert.equal(result.hardBudgetStop, true);
});

test("V4.15 PhotoAnalyzerProvider validator enforces fingerprint, cache, action and budget", () => {
  const result = runLab(String.raw`
    import { validatePhotoAnalyzerResult } from "./lib/photo-intelligence/v415-photo-analyzer-provider.ts";
    const suggestion={imageFingerprint:"expected",humanApprovalRequired:true};
    const request={imageFingerprint:"expected",imageReference:"local",requestedLevels:["ai_fallback"],existingProductName:null,explicitAdminAction:false,reason:"test"};
    const bad={providerId:"p",providerVersion:"1",suggestion:{...suggestion,imageFingerprint:"wrong"},cache:"hit",estimatedCostUSCents:2,externalCallMade:true,humanApprovalRequired:true,publishAutomatically:true};
    console.log(JSON.stringify(validatePhotoAnalyzerResult(bad,request,2500)));
  `);
  assert.ok(result.includes("fingerprint_mismatch"));
  assert.ok(result.includes("automatic_publish_forbidden"));
  assert.ok(result.includes("cache_hit_must_cost_zero"));
  assert.ok(result.includes("explicit_admin_action_required"));
  assert.ok(result.includes("monthly_budget_exceeded"));
});

test("V4.15 Revenue Intelligence defines eight disabled privacy-minimized drafts", () => {
  const result = runLab(String.raw`
    import { V415_REVENUE_EVENT_NAMES, createV415RevenueEventDraft } from "./lib/analytics/v415-revenue-intelligence.ts";
    const draft=createV415RevenueEventDraft({eventName:"search_no_result",rawQuery:"Samsung A16",resultCount:0});
    console.log(JSON.stringify({names:V415_REVENUE_EVENT_NAMES,draft,keys:Object.keys(draft)}));
  `);
  assert.equal(result.names.length, 8);
  assert.equal(new Set(result.names).size, 8);
  assert.equal(result.draft.collectionEnabled, false);
  assert.equal(result.draft.containsPersonalData, false);
  assert.equal(result.draft.queryTokenCount, 2);
  assert.ok(!result.keys.includes("rawQuery"));
});

test("V4.15 public canary payload excludes private and raw legacy fields", async () => {
  const payload = await readJson("V4.15-CANARY-PAYLOAD.json");
  const forbidden = /^(?:usd|cotizUsada|raw|rawLegacyJson|cost|costo|supplier|proveedor|wholesaler|mayorista|margin|margen|commission|comision|prompt|internalPrompt)$/i;
  const visit = (value) => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      assert.equal(forbidden.test(key), false, `forbidden key: ${key}`);
      visit(child);
    }
  };
  payload.products.forEach((item) => visit(item));
});

test("V4.15 standalone is direct, app-like, progressive and mutation-free", async () => {
  const html = await source("AmarangoElectro-V16-V4.15-Commercial-Excellence-Canary-Readiness-Standalone-Android.html");
  assert.doesNotMatch(html, /<iframe\b/i);
  assert.doesNotMatch(html, /<select\b/i);
  assert.match(html, /data-role="client"/);
  assert.match(html, /data-role="advisor"/);
  assert.match(html, /data-role="admin"/);
  assert.match(html, /data-scope="canary"/);
  assert.match(html, /id="loadMore"/);
  assert.match(html, /state\.limit\+=20/);
  assert.match(html, /loading="lazy"/);
  assert.match(html, /slice\(0,4\)/);
  assert.doesNotMatch(html, /\b(?:XMLHttpRequest|sendBeacon|WebSocket|service_role)\b/i);
  assert.doesNotMatch(html, /method\s*:\s*["'](?:POST|PUT|PATCH|DELETE)/i);
});

test("V4.15 standalone preserves token search and contains one valid script", async () => {
  const html = await source("AmarangoElectro-V16-V4.15-Commercial-Excellence-Canary-Readiness-Standalone-Android.html");
  assert.match(html, /q\.split\(\/\\s\+\//);
  assert.doesNotMatch(html, /q\.split\(\/s\+\//);
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length, 1);
  assert.doesNotThrow(() => new Script(scripts[0][1]));
});

test("V4.15 standalone keeps one product source and role privacy boundaries", async () => {
  const html = await source("AmarangoElectro-V16-V4.15-Commercial-Excellence-Canary-Readiness-Standalone-Android.html");
  assert.equal((html.match(/const PRODUCTS=/g) ?? []).length, 1);
  assert.match(html, /mismo|Product V16|Producto oficial/i);
  assert.doesNotMatch(html, /\b(?:cotizUsada|mayorista|proveedor|margen|comisi[oó]n|service_role)\b/i);
  assert.match(html, /edición bloqueada/);
});

test("V4.15 documents conditional GO, exact rollback and the closed safety seal", async () => {
  const selection = await source("V4.15-CANARY-SELECTION.md");
  const rollback = await source("V4.15-ROLLBACK-PLAN.md");
  const safety = await source("V4.15-SAFETY-SEAL.md");
  assert.match(selection, /GO para solicitar autorización humana/);
  assert.match(selection, /NO-GO para ejecutar escrituras ahora/);
  assert.match(rollback, /Rollback canario solamente/);
  assert.match(rollback, /snapshot de master y mapping/);
  assert.match(safety, /\| INSERT \| 0 \|/);
  assert.match(safety, /\| Deploy \| 0 \|/);
  assert.match(safety, /\| Celulares migrados \| 0 \|/);
});

test("V4.15 generation is deterministic, preserves V4.14 and passes safety scan", async () => {
  const before = await source("V4.15-CANARY-PAYLOAD.json");
  execFileSync("npm", ["run", "generate:v415"], { cwd: new URL(".", root), stdio: "pipe" });
  const after = await source("V4.15-CANARY-PAYLOAD.json");
  assert.equal(after, before);
  const v414 = await readJson("V4.14-MIGRATION-PREFLIGHT.json");
  assert.deepEqual(v414.counts, { source: 92, prepared: 91, humanReviewRequired: 1, conflict: 0, resolvedWithVisualEvidence: 1, simulatedAiFallbacks: 1 });
  const safety = JSON.parse(execFileSync(process.execPath, ["scripts/v415-safety-scan.mjs"], { cwd: new URL(".", root), encoding: "utf8" }));
  assert.equal(safety.passed, true);
  assert.ok(Object.values(safety.counts).every((count) => count === 0));
});

