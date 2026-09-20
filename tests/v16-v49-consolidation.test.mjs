import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");
const networkWrite = /fetch\s*\(|createClient|\.insert\s*\(|\.upsert\s*\(|\.update\s*\(|\.delete\s*\(|\.rpc\s*\(|method\s*:\s*["'](?:POST|PATCH|PUT|DELETE)["']/i;

test("V4.9 exposes exactly the 22 approved commercial entries over the V16 taxonomy", async () => {
  const { stdout } = await execFileAsync(process.execPath, ["--experimental-strip-types", "--experimental-loader", "./tests/ts-extension-loader.mjs", "--input-type=module", "-e", `import { retailCategories } from './lib/catalog/retail-categories.ts'; process.stdout.write(JSON.stringify(retailCategories.map(x=>x.title)));`], { cwd: root });
  assert.deepEqual(JSON.parse(stdout), ["Celulares","Smart TV","Audio","Refrigeración","Cocción","Climatización","Lavado","Pequeños electrodomésticos","Limpieza","Colchones y sommiers","Blanquería","Muebles","Hogar y decoración","Deporte y movilidad","Informática","Cargadores y accesorios","Cuidado personal y salud","Bebés","Accesorios para auto y motos","Mascotas","Gaming","Otros"]);
});

test("customer header is retail-first and keeps authorized spaces behind its menu", async () => {
  const header = await source("app/components/site-header.tsx");
  assert.match(header, /header-search/);
  assert.match(header, /Ayuda para comprar/);
  assert.match(header, /favoritos/);
  assert.match(header, /ACCESO AUTORIZADO/);
  assert.doesNotMatch(header, />Tienda<\/Link>\s*<Link[^>]*>Asesores/);
});

test("full-composition artwork and transparent official logo remain protected on mobile", async () => {
  const css = await source("app/globals.css");
  const hero = await source("app/components/hero-slider.tsx");
  const logo = await stat(new URL("public/logo-320.webp", root));
  assert.match(hero, /data-artwork-framing/);
  assert.match(css, /--slide-mobile-safe-top/);
  assert.match(css, /object-fit: contain/);
  assert.match(css, /@media \(max-width: 320px\)/);
  assert.ok(logo.size > 1_000 && logo.size < 100_000);
});

test("advisor stays commercial while Admin modules stay in the protected route", async () => {
  const advisor = await source("app/components/advisor-workspace.tsx");
  const admin = await source("app/components/admin-consolidated-workspace.tsx");
  assert.match(advisor, /no muestra costos, markup/);
  assert.doesNotMatch(advisor, /costArs|grossMargin|supplierImage/);
  assert.match(admin, /AmarangoCalculatorPanel/);
  assert.match(admin, /PlatesPanel/);
  assert.match(admin, /flyer económico/i);
  assert.match(admin, /Ofertas & Outlet V4\.7/i);
});

test("V4.9 labs use local persistence only and contain no production write path", async () => {
  const files = await Promise.all(["app/components/admin-consolidated-workspace.tsx","app/components/advisor-workspace.tsx","app/components/offers-showcase.tsx","lib/os-lab/offers-store.ts","lib/catalog/retail-categories.ts"].map(source));
  const text = files.join("\n");
  assert.match(text, /localStorage/);
  assert.doesNotMatch(text, networkWrite);
});

test("all unified spaces have routable entry points and the identity handoff stays reserved", async () => {
  for (const file of ["app/mi-amarango/page.tsx","app/administracion/page.tsx","app/plataforma/page.tsx","app/amarango-os/page.tsx"]) assert.ok((await source(file)).length > 100, file);
  const internalHeader = await source("app/components/internal-space-header.tsx");
  assert.match(internalHeader, /Maxi\/Angie/);
  assert.match(internalHeader, /sesión persistente/);
});
