import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
const r=fs.readFileSync("lib/catalog/retail-categories.ts","utf8"), s=fs.readFileSync("app/components/all-sectors-sheet.tsx","utf8"), h=fs.readFileSync("app/page.tsx","utf8");
test("the retail bridge is the real All Sectors source",()=>{assert.match(s,/import \{ retailCategories \}/);assert.match(s,/filtered\.map\(\(category\)/);assert.match(s,/href=\{category\.href\}/);});
test("approved commercial subsectors route into canonical V16 sectors",()=>{for(const x of ['id: "climatizacion"','categoryHref("electrodomesticos", "climatizacion")','id: "blanqueria"','categoryHref("hogar", "blanqueria")','id: "muebles"','categoryHref("hogar", "hogar-y-deco")','id: "informatica"','categoryHref("tecnologia-accesorios")']) assert.ok(r.includes(x),x);});
test("deporte/movilidad no longer falls into generic Otros",()=>{assert.match(r,/id: "deporte-movilidad"[\s\S]*categoryHref\("camping-aire-libre-mascotas", "camping-y-aire-libre"\)/);});
test("Home keeps approved AllSectorsSheet entry point",()=>{assert.match(h,/<AllSectorsSheet/);assert.doesNotMatch(h,/RetailCategoryShowcase/);});
