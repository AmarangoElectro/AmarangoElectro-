import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
const c=fs.readFileSync("lib/catalog/categories.ts","utf8"), p=fs.readFileSync("app/categoria/[slug]/page.tsx","utf8");
test("core approved sectors physically exist in taxonomy",()=>{for(const s of ["celulares","smart-tv","hogar","electrodomesticos","audio","gaming","herramientas","cuidado-personal-salud","tecnologia-accesorios"]) assert.ok(c.includes(`slug: "${s}"`),s);});
test("sector page uses premium banner system and real catalog",()=>{assert.match(p,/SubcategoryBannerCard/);assert.match(p,/<CatalogClient/);});
test("audit explicitly detects references not yet represented as top-level taxonomy",()=>{for(const s of ["computacion","climatizacion","blanqueria","muebles","movilidad"]) assert.ok(!c.includes(`slug: "${s}"`),s);});
