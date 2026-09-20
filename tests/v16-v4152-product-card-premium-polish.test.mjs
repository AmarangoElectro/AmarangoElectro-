import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { Script } from "node:vm";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");
const readJson = async (file) => JSON.parse(await source(file));
const standalone = "AmarangoElectro-V16-V4.15.2-Product-Card-Premium-Polish-Standalone-Android.html";

function embeddedProducts(html) {
  const match = html.match(/const PRODUCTS=(\[[\s\S]*?\]);const UI_CONFIG=/);
  assert.ok(match, "embedded Product V16 collection not found");
  return JSON.parse(match[1]);
}

function cardFunction(html) {
  return html.match(/function card\(p\)\{[\s\S]*?\nfunction render\(\)/)?.[0] ?? "";
}

test("V4.15.2 preserves the 92-product lab and exact five-product canary", async () => {
  const products = embeddedProducts(await source(standalone));
  assert.equal(products.length, 92);
  assert.deepEqual(products.filter((item) => item.canary).map((item) => item.position), [10, 18, 45, 73, 87]);
  assert.equal(products.filter((item) => item.canary).length, 5);
});

test("V4.15.2 leaves the V4.15 canary payload and V4.15.1 standalone byte-identical", async () => {
  const payloadBefore = await source("V4.15-CANARY-PAYLOAD.json");
  const priorBefore = await source("AmarangoElectro-V16-V4.15.1-Premium-App-UX-Closure-Standalone-Android.html");
  execFileSync("npm", ["run", "generate:v4152"], { cwd: new URL(".", root), stdio: "pipe" });
  assert.equal(await source("V4.15-CANARY-PAYLOAD.json"), payloadBefore);
  assert.equal(await source("AmarangoElectro-V16-V4.15.1-Premium-App-UX-Closure-Standalone-Android.html"), priorBefore);
  const payload = JSON.parse(payloadBefore);
  assert.ok(payload.products.every((item) => item.futureCanonicalProductId === null && item.productV16.stableId === null));
});

test("V4.15.2 client card contains only the approved commercial hierarchy", async () => {
  const card = cardFunction(await source(standalone));
  const order = ["class=\"photo\"", "class=\"specs\"", "<h3>", "class=\"price-label\"", "class=\"price\"", "class=\"availability\"", "class=\"actions\""];
  let cursor = -1;
  for (const token of order) {
    const next = card.indexOf(token, cursor + 1);
    assert.ok(next > cursor, `missing/out-of-order card token: ${token}`);
    cursor = next;
  }
  assert.doesNotMatch(card, /<ul class="features"|p\.features\.slice|Pantalla|Procesador|Cámaras|Batería|Carga rápida/);
  assert.match(card, /\[p\.brand,p\.memory,p\.ram\]\.filter\(Boolean\)/);
  assert.match(card, /Disponibilidad a confirmar/);
});

test("V4.15.2 frames vertical flyers without crop and protects Android columns", async () => {
  const html = await source(standalone);
  assert.match(html, /\.photo\{aspect-ratio:4\/5;[^}]*display:flex;[^}]*overflow:hidden/);
  assert.match(html, /\.photo img\{[^}]*max-width:100%;max-height:100%;object-fit:contain/);
  assert.match(html, /@media\(max-width:680px\)[\s\S]*?\.grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(html, /@media\(max-width:339px\)\{\.grid\{grid-template-columns:1fr\}/);
  assert.match(html, /\.fav\{[^}]*left:9px;right:auto;[^}]*width:42px;height:42px/);
});

test("V4.15.2 lab trace is configurable and fail-closed for production client", async () => {
  const html = await source(standalone);
  assert.match(html, /const UI_CONFIG=Object\.freeze\(\{mode:"laboratory",showLabTraceInClient:true,showLabTraceInAdvisor:false\}\)/);
  assert.match(html, /if\(UI_CONFIG\.mode==="production"&&role==="client"\)return false/);
  assert.match(html, /if\(role==="admin"\)return true/);
  assert.doesNotMatch(html, /role==="advisor"\)return true/);
  assert.match(cardFunction(html), /data-lab-trace/);
});

test("V4.15.2 product detail retains complete features, favorite and share", async () => {
  const html = await source(standalone);
  const detail = html.match(/function showDetail\(p\)\{[\s\S]*?\n\$\("\[data-photo\]"\)/)?.[0] ?? "";
  assert.match(detail, /p\.features\.map/);
  assert.doesNotMatch(detail, /p\.features\.slice/);
  assert.match(detail, /data-detail-fav/);
  assert.match(detail, /data-detail-share/);
  assert.match(detail, /shareFromDetail/);
  assert.match(html, /\.detail-media img\{[^}]*object-fit:contain/);
  assert.match(html, /backdrop-filter:blur\(10px\)/);
});

test("V4.15.2 differentiates roles without creating another product source", async () => {
  const html = await source(standalone);
  const card = cardFunction(html);
  assert.equal((html.match(/const PRODUCTS=/g) ?? []).length, 1);
  assert.match(card, /state\.role==="admin"/);
  assert.match(card, /características auditadas/);
  assert.match(card, /data-card-role/);
  assert.doesNotMatch(card, /construir precio|costo|proveedor|mayorista|margen|comisi[oó]n|usd/i);
});

test("V4.15.2 does not invent or reserve financing in product cards", async () => {
  const html = await source(standalone);
  const card = cardFunction(html);
  assert.doesNotMatch(card, /financing|cuotas|financiaci[oó]n/i);
  assert.match(card, /<span class="price-label">Contado<\/span>/);
  assert.doesNotMatch(card, /financing-placeholder|installment-placeholder|min-height:[^;]*financ/i);
  const payload = await readJson("V4.15-CANARY-PAYLOAD.json");
  assert.ok(payload.products.every((item) => Array.isArray(item.productV16.financing) && item.productV16.financing.length === 0));
});

test("V4.15.2 remains direct, progressive, app-like and script-valid", async () => {
  const html = await source(standalone);
  assert.doesNotMatch(html, /<iframe\b/i);
  assert.doesNotMatch(html, /<select\b/i);
  assert.match(html, /loading="lazy"/);
  assert.match(html, /state\.limit\+=20/);
  assert.match(html, /function openFilter\(key\)/);
  assert.match(html, /openLayer\("#filterSheet"\)/);
  assert.match(html, /html\.layer-open,body\.layer-open/);
  assert.match(html, /prefers-reduced-motion:reduce/);
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length, 1);
  assert.doesNotThrow(() => new Script(scripts[0][1]));
});

test("V4.15.2 documents the required statuses and passes the zero-write safety scan", async () => {
  const qa = await source("V4.15.2-QA-REPORT.md");
  const visual = await source("V4.15.2-VISUAL-QA.md");
  assert.match(qa, /PRODUCT CARD PREMIUM POLISH: PASS/);
  assert.match(qa, /PREMIUM APP UX PRESERVED: YES/);
  assert.match(qa, /CANARY READINESS PRESERVED: YES/);
  assert.match(qa, /PRODUCTION WRITES: 0/);
  for (const width of [320, 360, 390, 412, 768, 1440]) assert.match(visual, new RegExp(`\\| ${width} \\|`));
  const safety = JSON.parse(execFileSync(process.execPath, ["scripts/v4152-safety-scan.mjs"], { cwd: new URL(".", root), encoding: "utf8" }));
  assert.equal(safety.passed, true);
  assert.ok(Object.values(safety.counts).every((count) => count === 0));
});
