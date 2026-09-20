import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");
const writePattern = /createClient|\.insert\s*\(|\.upsert\s*\(|\.update\s*\(|\.delete\s*\(|\.rpc\s*\(|method\s*:\s*["'](?:POST|PATCH|PUT|DELETE)["']/i;

test("Step 7R.1 applies full-composition framing only to the three approved banners", async () => {
  const categories = await source("lib/catalog/categories.ts");
  assert.equal((categories.match(/bannerFraming: "full-composition"/g) ?? []).length, 3);
  for (const slug of ["tecnologia-accesorios", "hogar", "descanso"]) {
    const categoryBlock = categories.slice(categories.indexOf(`slug: "${slug}"`));
    assert.match(categoryBlock.slice(0, 1_400), /bannerFraming: "full-composition"/);
  }
});

test("Step 7R.1 exposes framing semantics without coupling the component to one asset", async () => {
  const hero = await source("app/components/premium-category-hero.tsx");
  assert.match(hero, /data-banner-framing=\{category\.bannerFraming \?\? "focused-art"\}/);
  assert.match(hero, /data-banner-slug=\{category\.slug\}/);
  assert.doesNotMatch(hero, /tecnologia-accesorios|hogar-premium|descanso-premium/);
});

test("Step 7R.1 keeps independent desktop, tablet and mobile framing rules", async () => {
  const css = await source("app/globals.css");
  assert.match(css, /data-banner-framing="full-composition"/);
  assert.match(css, /object-fit:\s*contain/);
  assert.match(css, /object-fit:\s*cover/);
  for (const slug of ["tecnologia-accesorios", "hogar", "descanso"]) {
    assert.match(css, new RegExp(`data-banner-slug="${slug}"`));
  }
  assert.match(css, /@media \(max-width: 980px\)/);
  assert.match(css, /@media \(max-width: 700px\)/);
});

test("Step 7R.1 banner presentation remains read-only", async () => {
  const sources = await Promise.all([
    source("lib/catalog/categories.ts"),
    source("app/components/premium-category-hero.tsx"),
    source("app/globals.css"),
  ]);
  assert.doesNotMatch(sources.join("\n"), writePattern);
});
