import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { Script } from "node:vm";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");
const readJson = async (file) => JSON.parse(await source(file));
const standalone = "AmarangoElectro-V16-V4.15.1-Premium-App-UX-Closure-Standalone-Android.html";

function embeddedProducts(html) {
  const match = html.match(/const PRODUCTS=(\[[\s\S]*?\]);const state=/);
  assert.ok(match, "embedded Product V16 collection not found");
  return JSON.parse(match[1]);
}

test("V4.15.1 preserves the 92-product lab and exact five-product canary", async () => {
  const products = embeddedProducts(await source(standalone));
  assert.equal(products.length, 92);
  assert.deepEqual(products.filter((item) => item.canary).map((item) => item.name), [
    "IPHONE 17 PRO 256GB",
    "Samsung A16 128/4gb",
    "Moto G15 POWER 256/8gb",
    "Xiaomi Note 15 pro plus 5g 512/12gb",
    "INFINIX HOT 60 PRO NFC 8/256 GB",
  ]);
  assert.equal(products.filter((item) => item.canary).length, 5);
});

test("V4.15.1 keeps the V4.15 payload byte-identical and all canonical IDs null", async () => {
  const before = await source("V4.15-CANARY-PAYLOAD.json");
  execFileSync("npm", ["run", "generate:v4151"], { cwd: new URL(".", root), stdio: "pipe" });
  const after = await source("V4.15-CANARY-PAYLOAD.json");
  assert.equal(after, before);
  const payload = JSON.parse(after);
  assert.equal(payload.products.length, 5);
  for (const item of payload.products) {
    assert.equal(item.futureCanonicalProductId, null);
    assert.equal(item.productV16.stableId, null);
    assert.equal(item.masterPayload.id, null);
    assert.equal(item.mapping.canonicalProductId, null);
  }
});

test("V4.15.1 places the favorite on the upper-left with a comfortable touch target", async () => {
  const html = await source(standalone);
  assert.match(html, /\.fav\{[^}]*left:9px;right:auto;top:9px;width:42px;height:42px/);
  assert.doesNotMatch(html, /\.fav\{[^}]*right:9px/);
  assert.match(html, /data-fav="'\+p\.key\+'"/);
});

test("V4.15.1 keeps status, name and price outside the product photograph", async () => {
  const html = await source(standalone);
  const card = html.match(/function card\(p\)\{[\s\S]*?\nfunction render\(\)/)?.[0] ?? "";
  assert.match(card, /<div class="photo"><img[^>]+loading="lazy"><button class="fav/);
  assert.match(card, /<\/div><div class="content">'\+status/);
  const photoMarkup = card.match(/<div class="photo">[\s\S]*?<\/div><div class="content">/)?.[0] ?? "";
  assert.doesNotMatch(photoMarkup, /class="badge|<h3>|class="price/);
  assert.match(html, /\.card h3\{[^}]*overflow-wrap:anywhere/);
  assert.doesNotMatch(html, /text-overflow:ellipsis/);
  assert.match(html, /\.primary\{white-space:nowrap\}/);
});

test("V4.15.1 uses contain and a compact mobile product detail", async () => {
  const html = await source(standalone);
  assert.match(html, /\.photo img\{[^}]*object-fit:contain/);
  assert.match(html, /\.detail-media\{[^}]*overflow:hidden/);
  assert.match(html, /\.detail-media img\{[^}]*max-width:100%;max-height:100%;object-fit:contain/);
  assert.match(html, /\.detail-media\{height:min\(32dvh,260px\);padding:12px/);
  assert.match(html, /\.detail-title\{font-size:23px;margin:11px 0 8px\}/);
});

test("V4.15.1 sheets provide premium backdrop, safe areas and reduced motion", async () => {
  const html = await source(standalone);
  assert.match(html, /backdrop-filter:blur\(10px\)/);
  assert.match(html, /box-shadow:0 -26px 90px/);
  assert.match(html, /safe-area-inset-top/);
  assert.match(html, /overscroll-behavior:contain/);
  assert.match(html, /@media\(prefers-reduced-motion:reduce\)/);
  assert.equal((html.match(/role="dialog" aria-modal="true"/g) ?? []).length, 3);
});

test("V4.15.1 locks background scroll and supports four safe dismissal paths", async () => {
  const html = await source(standalone);
  assert.match(html, /html\.layer-open,body\.layer-open\{overflow:hidden!important/);
  assert.match(html, /function setLayerLock\(locked\)/);
  assert.match(html, /requestAnimationFrame\(\(\)=>\$\("\[data-close\]",layer\)\?\.focus\(\)\)/);
  assert.match(html, /\$\$\("\[data-close\]"\)\.forEach/);
  assert.match(html, /e\.key==="Escape"/);
  assert.match(html, /dy>72&&dy>Math\.abs\(dx\)\*1\.4/);
  assert.match(html, /\$\("#backdrop"\)\.addEventListener\("click",closeLayers\)/);
});

test("V4.15.1 remains standalone, app-like, progressive and script-valid", async () => {
  const html = await source(standalone);
  assert.doesNotMatch(html, /<iframe\b/i);
  assert.doesNotMatch(html, /<select\b/i);
  assert.match(html, /class="chip/);
  assert.match(html, /class="sheet bottom-sheet"/);
  assert.match(html, /loading="lazy"/);
  assert.match(html, /state\.limit\+=20/);
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length, 1);
  assert.doesNotThrow(() => new Script(scripts[0][1]));
});

test("V4.15.1 documentation seals the three roles and required final statuses", async () => {
  const closure = await source("V4.15.1-PREMIUM-APP-UX-CLOSURE.md");
  const qa = await source("V4.15.1-QA-REPORT.md");
  const visual = await source("V4.15.1-VISUAL-QA.md");
  assert.match(closure, /Cliente: simple/);
  assert.match(closure, /Asesor: producto oficial/);
  assert.match(closure, /Admin: misma identidad/);
  assert.match(qa, /PREMIUM APP UX: PASS/);
  assert.match(qa, /CANARY READINESS PRESERVED: YES/);
  assert.match(qa, /PRODUCTION WRITES: 0/);
  for (const width of [320, 360, 390, 412, 768, 1440]) assert.match(visual, new RegExp(`\\| ${width} \\| PASS`));
});

test("V4.15.1 generation is deterministic and its safety scan is all zero", async () => {
  const before = await source(standalone);
  execFileSync("npm", ["run", "generate:v4151"], { cwd: new URL(".", root), stdio: "pipe" });
  assert.equal(await source(standalone), before);
  const safety = JSON.parse(execFileSync(process.execPath, ["scripts/v4151-safety-scan.mjs"], { cwd: new URL(".", root), encoding: "utf8" }));
  assert.equal(safety.passed, true);
  assert.ok(Object.values(safety.counts).every((count) => count === 0));
  const payload = await readJson("V4.15-CANARY-PAYLOAD.json");
  assert.equal(payload.writeEnabled, false);
});
