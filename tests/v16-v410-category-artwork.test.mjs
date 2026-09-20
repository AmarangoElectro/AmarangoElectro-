import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");
const writePattern = /fetch\s*\(|createClient|\.insert\s*\(|\.upsert\s*\(|\.update\s*\(|\.delete\s*\(|\.rpc\s*\(|method\s*:\s*["'](?:POST|PATCH|PUT|DELETE)["']/i;
const officialFullComposition = new Set(["celulares", "smart-tv", "audio", "refrigeracion", "climatizacion", "lavado", "hogar-decoracion", "gaming"]);

async function categories() {
  const { stdout } = await execFileAsync(process.execPath, ["--experimental-strip-types", "--experimental-loader", "./tests/ts-extension-loader.mjs", "--input-type=module", "-e", `import { retailCategories } from './lib/catalog/retail-categories.ts'; process.stdout.write(JSON.stringify(retailCategories));`], { cwd: root });
  return JSON.parse(stdout);
}

test("V4.10 assigns one unique desktop and mobile campaign to every approved category", async () => {
  const entries = await categories();
  assert.equal(entries.length, 22);
  assert.equal(new Set(entries.map((item) => item.image)).size, 22);
  assert.equal(new Set(entries.map((item) => item.mobileImage)).size, 22);
  for (const item of entries) {
    if (officialFullComposition.has(item.id)) {
      assert.equal(item.artworkMode, "embedded");
      assert.equal(item.artworkRatio, "4:3");
      assert.match(item.image, new RegExp(`/assets/category-art/v410/official/${item.id}\\.webp$`));
      assert.match(item.mobileImage, new RegExp(`/assets/category-art/v410/official/mobile/${item.id}\\.webp$`));
    } else {
      assert.equal(item.artworkMode, "background");
      assert.equal(item.artworkRatio, "3:2");
      assert.match(item.image, new RegExp(`/assets/category-art/v410/${item.id}\\.webp$`));
      assert.match(item.mobileImage, new RegExp(`/assets/category-art/v410/mobile/${item.id}\\.webp$`));
    }
  }
});

test("every V4.10 campaign is an optimized WebP in its declared no-crop ratio", async () => {
  const entries = await categories();
  const hashes = new Set();
  for (const item of entries) {
    for (const [variant, path] of [["desktop", item.image], ["mobile", item.mobileImage]]) {
      const file = new URL(`public${path}`, root);
      const info = await stat(file);
      assert.ok(info.size > 8_000 && info.size < 400_000, `${item.id} ${variant}: ${info.size} bytes`);
      const bytes = await readFile(file);
      hashes.add(createHash("sha256").update(bytes).digest("hex"));
      const { stdout } = await execFileAsync("identify", ["-format", "%w %h", fileURLToPath(file)]);
      const [width, height] = stdout.trim().split(/\s+/).map(Number);
      const expectedRatio = item.artworkRatio === "4:3" ? 4 / 3 : 3 / 2;
      assert.equal(width / height, expectedRatio, `${item.id} ${variant} must preserve ${item.artworkRatio}`);
    }
  }
  assert.equal(hashes.size, 44, "every category/viewport asset must be a distinct file");
});

test("category cards separate embedded full-composition art from layered background art", async () => {
  const component = await source("app/components/retail-category-showcase.tsx");
  const css = await source("app/globals.css");
  assert.match(component, /data-artwork-framing=\{category\.artworkMode === "embedded" \? "full-composition" : "ratio-designed"\}/);
  assert.match(component, /data-artwork-mode=\{category\.artworkMode\}/);
  assert.match(component, /category\.artworkMode === "background"/);
  assert.match(component, /<picture className="retail-art-picture"/);
  assert.match(component, /source media="\(max-width: 760px\)"/);
  assert.match(component, /retail-art-copy/);
  assert.match(component, /\/logo-320\.webp/);
  assert.match(css, /V16 V4\.10/);
  assert.match(css, /data-artwork-ratio="3:2"[\s\S]*?aspect-ratio: 3 \/ 2/);
  assert.match(css, /data-artwork-ratio="4:3"[\s\S]*?aspect-ratio: 4 \/ 3/);
  assert.match(css, /\.retail-art-picture img[\s\S]*?object-fit: cover/);
  assert.match(css, /data-artwork-mode="embedded"[\s\S]*?object-fit: contain/);
  assert.doesNotMatch(component + css, writePattern);
});

test("the visual-only gate leaves Admin, Offers, Product Bridge and internal routes untouched", async () => {
  const home = await source("app/page.tsx");
  assert.match(home, /HeroSlider/);
  assert.match(home, /BrandLogoRail/);
  assert.match(home, /OffersShowcase/);
  for (const file of ["app/administracion/page.tsx", "app/mi-amarango/page.tsx", "app/plataforma/page.tsx", "app/amarango-os/page.tsx"]) {
    assert.ok((await source(file)).length > 100);
  }
});
