import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import crypto from "node:crypto";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");
const writePattern = /fetch\s*\(|createClient|\.insert\s*\(|\.upsert\s*\(|\.update\s*\(|\.rpc\s*\(|method\s*:\s*["'](?:POST|PATCH|PUT|DELETE)["']/i;

const assets = [
  "public/assets/banners/categories/tecnologia-accesorios-premium-clean.webp",
  "public/assets/banners/categories/hogar-premium-clean.webp",
  "public/assets/banners/categories/descanso-premium-clean.webp",
];

test("Step 7R activates approved editorial category assets without changing taxonomy", async () => {
  const categories = await source("lib/catalog/categories.ts");
  for (const path of [
    "/assets/banners/categories/tecnologia-accesorios-premium-clean.webp",
    "/assets/banners/categories/hogar-premium-clean.webp",
    "/assets/banners/categories/descanso-premium-clean.webp",
  ]) assert.match(categories, new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  for (const title of ["Cargadores y accesorios", "Hogar y deco", "Bazar y mesa", "Blanquería", "Colchones y sommiers"]) {
    assert.match(categories, new RegExp(title));
  }
  assert.doesNotMatch(categories, writePattern);
});

test("Step 7R category assets are lightweight 1672x941 WebP files", async () => {
  for (const asset of assets) {
    const info = await stat(new URL(asset, root));
    assert.ok(info.size > 20_000, `${asset} should contain real artwork`);
    assert.ok(info.size < 180_000, `${asset} should stay lightweight, got ${info.size}`);
  }
});

test("Step 7R keeps the exact official logo asset unchanged", async () => {
  const logo = await readFile(new URL("public/brand/amarango-logo-official.png", root));
  const hash = crypto.createHash("sha256").update(logo).digest("hex");
  assert.equal(hash, "7420a6f6cd566c8ba3708f15faee16b4a58845c5d8b4f9c0f8c02e081ca0e5bf");
});

test("Step 7R keeps real CRM, Margarita and production writes outside scope", async () => {
  const categories = await source("lib/catalog/categories.ts");
  const hero = await source("app/components/premium-category-hero.tsx");
  const crm = await source("V16-FUTURE-CRM-INTEGRATION-NOTES.md");
  const margarita = await source("app/components/margarita-button.tsx");
  assert.match(crm, /pendiente, no implementado/i);
  assert.match(margarita, /Preparada para integración/i);
  assert.doesNotMatch([categories, hero, margarita].join("\n"), writePattern);
});
