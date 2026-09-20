import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const root = new URL("../", import.meta.url);
const source = (path) => readFile(new URL(path, root), "utf8");

test("V4.17 derives contextual links only from the authorized V16 taxonomy", async () => {
  const { stdout } = await execFileAsync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", `
    import { categories } from './lib/catalog/categories.ts';
    import { deriveSubcategoryContext } from './lib/navigation/subcategory-context.ts';
    const pick=(slug,input={})=>deriveSubcategoryContext(categories.find((item)=>item.slug===slug),input);
    process.stdout.write(JSON.stringify({electro:pick('electrodomesticos',{sector:'lavado'}),phones:pick('celulares',{brand:'Apple'}),empty:pick('cuidado-personal-salud')}));
  `], { cwd: root });
  const result = JSON.parse(stdout);
  assert.equal(result.electro.length, 7);
  assert.equal(result.electro.find((item) => item.slug === "lavado").href, "/categoria/electrodomesticos?sector=lavado#sector-activo");
  assert.equal(result.electro.find((item) => item.slug === "lavado").selected, true);
  assert.equal(result.phones.find((item) => item.slug === "apple-iphone").href, "/categoria/celulares?marca=Apple#catalogo");
  assert.equal(result.phones.find((item) => item.slug === "apple-iphone").selected, true);
  assert.deepEqual(result.empty, []);
});

test("V4.17 navigation renders before the hero, preserves URLs and selected state", async () => {
  const [page, component] = await Promise.all([
    source("app/categoria/[slug]/page.tsx"),
    source("app/components/subcategory-context-navigation.tsx"),
  ]);
  assert.ok(page.indexOf("<SubcategoryContextNavigation") < page.indexOf("<PremiumCategoryHero"));
  assert.match(page, /deriveSubcategoryContext\(category/);
  assert.match(component, /href=\{item\.href\}/);
  assert.match(component, /aria-current=\{item\.selected \? "page"/);
  assert.match(component, /if \(items\.length === 0\) return null/);
  assert.doesNotMatch(component, /use client|carousel|onClick/);
});

test("V4.17 replaces the duplicated phone department links without changing profile content", async () => {
  const phone = await source("app/components/celulares-navigation.tsx");
  assert.doesNotMatch(phone, /phone-department-nav|brandLinks|marca=/);
  assert.match(phone, /phone-choice-section/);
  for (const title of ["Diseño y cámara", "Para todos los días", "Batería y potencia", "Jugá, mirá y disfrutá"]) {
    assert.match(phone, new RegExp(title));
  }
});

test("V4.17 mobile behavior is native, compact and does not globally mask overflow", async () => {
  const css = await source("app/globals.css");
  assert.match(css, /\.subcategory-context-track[\s\S]*overflow-x: auto/);
  assert.match(css, /scroll-snap-type: x proximity/);
  assert.match(css, /overscroll-behavior-inline: contain/);
  assert.match(css, /\.catalog-heading h2 \{ font-size: clamp\(34px,10\.5vw,40px\); letter-spacing: -2\.2px; overflow-wrap: anywhere; \}/);
  assert.doesNotMatch(css, /(?:^|[,}]\s*)(?:html|body|:root)\s*\{[^}]*overflow-x\s*:\s*hidden/mi);
});

test("V4.17 covers exact QA widths and empty/full local history", async () => {
  const harness = await source("public/V4.17-Responsive-QA.html");
  for (const width of [320, 360, 390, 412, 768, 1440]) assert.match(harness, new RegExp(`data-width="${width}"`));
  assert.match(harness, /documentElement\.clientWidth/);
  assert.match(harness, /documentElement\.scrollWidth/);
  assert.match(harness, /history-full/);
  assert.match(harness, /history-empty/);
  assert.match(harness, /scenario-none/);
  assert.match(harness, /scenario-many/);
});

test("V4.17 Safety Seal proves read-only navigation and protected V4.16/canonical files", async () => {
  const { stdout } = await execFileAsync(process.execPath, ["scripts/v417-safety-scan.mjs"], { cwd: root });
  const result = JSON.parse(stdout);
  assert.equal(result.passed, true);
  assert.equal(result.branch, "recovery/amarango-v16-v417-final-v1");
  assert.equal(result.hasMainBranch, false);
  assert.ok(Object.values(result.counts).every((count) => count === 0));
  assert.ok(Object.values(result.protectedHashes).every((entry) => entry.passed));
});
