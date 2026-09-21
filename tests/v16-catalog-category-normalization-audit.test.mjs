import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
const tax=fs.readFileSync("lib/catalog/taxonomy.ts","utf8"), retail=fs.readFileSync("lib/catalog/retail-categories.ts","utf8"), cats=fs.readFileSync("lib/catalog/categories.ts","utf8");
test("normalization is alias-driven from canonical category definitions",()=>{assert.match(tax,/legacyAliases/);assert.match(tax,/normalize/);});
test("Informática currently routes safely through Tecnología & Accesorios",()=>{assert.match(retail,/id: "informatica"[\s\S]*categoryHref\("tecnologia-accesorios"\)/);});
test("Blanquería and Muebles already map to canonical Hogar subsectors",()=>{assert.match(retail,/id: "blanqueria"[\s\S]*categoryHref\("hogar", "blanqueria"\)/);assert.match(retail,/id: "muebles"[\s\S]*categoryHref\("hogar", "hogar-y-deco"\)/);});
test("Climatización already maps to canonical Electrodomésticos subsector",()=>{assert.match(retail,/id: "climatizacion"[\s\S]*categoryHref\("electrodomesticos", "climatizacion"\)/);});
test("Deporte y movilidad routes to its dedicated canonical V16 sector",()=>{assert.match(cats,/slug: "deportes-movilidad"/);assert.match(retail,/id: "deporte-movilidad"[\s\S]*categoryHref\("deportes-movilidad"\)/);});
