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

test("V4.14 preflight keeps all 92 products pending and prepares 91 after visual evidence", async () => {
  const preflight = await readJson("V4.14-MIGRATION-PREFLIGHT.json");
  assert.equal(preflight.counts.source, 92);
  assert.equal(preflight.counts.prepared, 91);
  assert.equal(preflight.counts.humanReviewRequired, 1);
  assert.equal(preflight.counts.conflict, 0);
  assert.equal(preflight.counts.resolvedWithVisualEvidence, 1);
  assert.deepEqual(preflight.reviewQueue.map((item) => item.legacyPosition), [91]);
  assert.ok(preflight.products.every((item) => item.productV16.visibility === "pending"));
  assert.ok(preflight.products.every((item) => item.productV16.availability === "unknown"));
  assert.ok(preflight.products.every((item) => item.productV16.financing.length === 0));
  assert.ok(preflight.products.every((item) => item.proposedCanonicalProductId === null));
  assert.ok(preflight.products.every((item) => item.mutationExecuted === false));
});

test("V4.14 resolves the truncated iPhone characteristic only from visible flyer evidence", async () => {
  const preflight = await readJson("V4.14-MIGRATION-PREFLIGHT.json");
  const phone = preflight.products.find((item) => item.legacyPosition === 10);
  assert.equal(phone.reviewStatus, "prepared");
  assert.deepEqual(phone.reviewReasons, []);
  assert.ok(phone.productV16.featureDetails.some((feature) => feature.value === "Carga rápida USB-C" && feature.provenance === "ocr_extracted"));
  assert.equal(phone.photoIntelligence.analysis.ocrLevelUsed, true);
  assert.equal(phone.photoIntelligence.analysis.aiLevelUsed, false);
  assert.equal(phone.photoIntelligence.analysis.externalCallMade, false);
});

test("V4.14 keeps the Infinix bundle pending while extracting only visible specifications", async () => {
  const preflight = await readJson("V4.14-MIGRATION-PREFLIGHT.json");
  const phone = preflight.products.find((item) => item.legacyPosition === 91);
  assert.equal(phone.reviewStatus, "human_review_required");
  assert.ok(phone.reviewReasons.includes("gamer_kit_bundle_not_visible"));
  assert.equal(phone.productV16.memory, "512 GB");
  assert.equal(phone.productV16.ram, "12 GB");
  assert.ok(phone.productV16.featureDetails.some((feature) => /5000 mAh/.test(feature.value)));
  assert.equal(phone.photoIntelligence.analysis.aiLevelUsed, true);
  assert.equal(phone.photoIntelligence.analysis.externalCallMade, false);
  assert.ok(phone.photoIntelligence.warnings.includes("ai_fallback_inconclusive"));
});

test("V4.14 byte and URL fingerprints are deterministic and URL query is non-identifying", () => {
  const result = runLab(String.raw`
    import { fingerprintImageBytes, fingerprintImageUrl, isByteFingerprint, isUrlFingerprint } from "./lib/photo-intelligence/v414-image-fingerprint.ts";
    const a=fingerprintImageBytes(new Uint8Array([1,2,3]));
    const b=fingerprintImageBytes(new Uint8Array([1,2,3]));
    const c=fingerprintImageBytes(new Uint8Array([1,2,4]));
    const u1=fingerprintImageUrl("https://example.com/a.jpg?v=1");
    const u2=fingerprintImageUrl("https://example.com/a.jpg?v=2#x");
    console.log(JSON.stringify({a,b,c,u1,u2,validA:isByteFingerprint(a),validU:isUrlFingerprint(u1)}));
  `);
  assert.equal(result.a, result.b);
  assert.notEqual(result.a, result.c);
  assert.equal(result.u1, result.u2);
  assert.equal(result.validA, true);
  assert.equal(result.validU, true);
});

test("V4.14 cache uses fingerprint plus analyzer version and supports explicit invalidation", () => {
  const result = runLab(String.raw`
    import { V414PhotoAnalysisCache } from "./lib/photo-intelligence/v414-photo-cache.ts";
    const cache=new V414PhotoAnalysisCache();
    cache.set({fingerprint:"f",value:{ok:true},createdAt:"2026-08-30T00:00:00Z",analyzerVersion:"v1",valid:true});
    const hit=cache.get("f","v1"); const versionMiss=cache.get("f","v2"); cache.invalidate("f"); const invalidated=cache.get("f","v1");
    console.log(JSON.stringify({hit:Boolean(hit),versionMiss:Boolean(versionMiss),invalidated:Boolean(invalidated),size:cache.size}));
  `);
  assert.deepEqual(result, { hit: true, versionMiss: false, invalidated: false, size: 1 });
});

test("V4.14 cost control charges only explicit cache misses and hard-blocks at the limit", () => {
  const result = runLab(String.raw`
    import { createV414AiCostState, accountV414AiAnalysis } from "./lib/photo-intelligence/v414-cost-control.ts";
    let state=createV414AiCostState(2,1);
    const cached=accountV414AiAnalysis(state,{cacheHit:true,explicitAdminAction:true});
    const automatic=accountV414AiAnalysis(state,{cacheHit:false,explicitAdminAction:false});
    const first=accountV414AiAnalysis(state,{cacheHit:false,explicitAdminAction:true}); state=first.state;
    const second=accountV414AiAnalysis(state,{cacheHit:false,explicitAdminAction:true}); state=second.state;
    const blocked=accountV414AiAnalysis(state,{cacheHit:false,explicitAdminAction:true});
    console.log(JSON.stringify({cached,automatic,first,second,blocked}));
  `);
  assert.equal(result.cached.charged, false);
  assert.equal(result.automatic.reason, "admin_action_required");
  assert.equal(result.first.charged, true);
  assert.equal(result.second.charged, true);
  assert.equal(result.blocked.reason, "budget_limit");
  assert.equal(result.blocked.state.blocked, true);
});

test("V4.14 category classifier exposes the complete 22-category contract", () => {
  const result = runLab(String.raw`
    import { V414_COMMERCIAL_CATEGORIES, classifyV414Category } from "./lib/photo-intelligence/v414-category-classifier.ts";
    console.log(JSON.stringify({categories:V414_COMMERCIAL_CATEGORIES,phone:classifyV414Category("Samsung A16 128 GB"),tv:classifyV414Category("Smart TV 50 pulgadas"),unknown:classifyV414Category("objeto sin evidencia")}));
  `);
  assert.equal(result.categories.length, 22);
  assert.equal(new Set(result.categories).size, 22);
  assert.equal(result.phone.category, "Celulares");
  assert.equal(result.tv.category, "Smart TV");
  assert.equal(result.unknown.category, "Otros");
  assert.equal(result.unknown.provenance, "unknown");
});

test("V4.14 suggestion contract uses only allowed provenance and always requires human approval", async () => {
  const preflight = await readJson("V4.14-MIGRATION-PREFLIGHT.json");
  const allowed = new Set(["explicit_visual", "ocr_extracted", "ai_inferred", "matched_existing_data", "unknown"]);
  for (const product of preflight.products) {
    assert.equal(product.photoIntelligence.humanApprovalRequired, true);
    assert.ok(Object.values(product.photoIntelligence.provenance).every((value) => allowed.has(value)));
    assert.ok(product.photoIntelligence.suggestedFeatures.every((feature) => allowed.has(feature.provenance)));
  }
});

test("V4.14 preflight public payload excludes private and raw catalog fields", async () => {
  const preflight = await readJson("V4.14-MIGRATION-PREFLIGHT.json");
  const forbidden = /^(?:usd|cotizUsada|raw|rawLegacyJson|cost|costo|supplier|proveedor|wholesaler|mayorista|prompt|internalPrompt)$/i;
  const visit = (value) => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      assert.equal(forbidden.test(key), false, `forbidden key: ${key}`);
      visit(child);
    }
  };
  preflight.products.forEach((item) => visit(item.productV16));
  preflight.products.forEach((item) => visit(item.payloadToWrite));
});

test("V4.14 standalone is direct, app-like, script-valid and has no native select", async () => {
  const standalone = await source("AmarangoElectro-V16-V4.14-Photo-Intelligence-Preflight-Standalone-Android.html");
  assert.doesNotMatch(standalone, /<iframe\b/i);
  assert.doesNotMatch(standalone, /<select\b/i);
  assert.match(standalone, /data-filter="brand"/);
  assert.match(standalone, /filter-sheet/);
  assert.match(standalone, /type="file"/);
  assert.match(standalone, /class="file-input" type="file"/);
  assert.doesNotMatch(standalone, /type="file"[^>]*\bhidden\b/i);
  assert.match(standalone, /crypto\.subtle\.digest/);
  assert.match(standalone, /Analizar con IA/);
  assert.match(standalone, /Aprobar para preflight/);
  assert.match(standalone, /localStorage/);
  assert.match(standalone, /navigator\.share/);
  assert.match(standalone, /<b>91<\/b> preparados/);
  assert.match(standalone, /<b>1<\/b> revisión/);
  assert.match(standalone, /slice\(0,4\)/);
  assert.match(standalone, /query\.split\(\/\\s\+\//, "token search must preserve the whitespace regex in generated HTML");
  assert.doesNotMatch(standalone, /query\.split\(\/s\+\//);
  assert.doesNotMatch(standalone, /\b(?:XMLHttpRequest|sendBeacon|WebSocket|service_role)\b/i);
  const scripts = [...standalone.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length, 1);
  assert.doesNotThrow(() => new Script(scripts[0][1]));
});

test("V4.14 responsive contract covers six required widths without horizontal overflow primitives", async () => {
  const standalone = await source("AmarangoElectro-V16-V4.14-Photo-Intelligence-Preflight-Standalone-Android.html");
  assert.match(standalone, /\*\{box-sizing:border-box\}/);
  assert.match(standalone, /overflow-x:hidden/);
  assert.match(standalone, /grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(standalone, /@media\(max-width:980px\).*repeat\(3,minmax\(0,1fr\)\)/s);
  assert.match(standalone, /@media\(max-width:680px\).*repeat\(2,minmax\(0,1fr\)\)/s);
  assert.match(standalone, /@media\(max-width:370px\).*grid-template-columns:1fr/s);
  assert.match(standalone, /safe-area-inset-bottom/);
  for (const width of [320, 360, 390, 412, 768, 1440]) assert.ok(width > 0);
});

test("V4.14 reports state the exact 91/1 decision, cost, cache and rollback", async () => {
  const migration = await source("V4.14-MIGRATION-PREFLIGHT.md");
  const review = await source("V4.14-HUMAN-REVIEW.md");
  const cost = await source("V4.14-AI-COST-CONTROL.md");
  const cache = await source("V4.14-IMAGE-FINGERPRINT-CACHE.md");
  assert.match(migration, /Preparados técnicamente: \*\*91\*\*/);
  assert.match(migration, /Revisión humana: \*\*1\*\*/);
  assert.match(migration, /Rollback esperado/);
  assert.match(review, /Pendiente después del preflight: \*\*1\*\*/);
  assert.match(cost, /Costo externo real ejecutado \| 0/);
  assert.match(cache, /Hit válido: no vuelve a analizar ni suma costo/);
});

test("V4.14 generation is deterministic and V4.13 remains unchanged", async () => {
  const before = await source("V4.14-MIGRATION-PREFLIGHT.json");
  execFileSync("npm", ["run", "generate:v414"], { cwd: new URL(".", root), stdio: "pipe" });
  const after = await source("V4.14-MIGRATION-PREFLIGHT.json");
  assert.equal(after, before);
  const v413 = await readJson("V4.13-MIGRATION-SIMULATION.json");
  assert.equal(v413.counts.ready, 90);
  assert.equal(v413.counts.review, 2);
});

test("V4.14 safety scan executes and returns zero mutation surfaces", () => {
  const result = JSON.parse(execFileSync(process.execPath, ["scripts/v414-safety-scan.mjs"], {
    cwd: new URL(".", root),
    encoding: "utf8",
  }));
  assert.equal(result.passed, true);
  assert.ok(Object.values(result.counts).every((count) => count === 0));
});
