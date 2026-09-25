import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
const c=fs.readFileSync("lib/catalog/categories.ts","utf8"), p=fs.readFileSync("app/categoria/[slug]/page.tsx","utf8"), i=fs.readFileSync("lib/catalog/index.ts","utf8");
test("Climatización remains a real Electrodomésticos subcategory",()=>{assert.match(c,/slug: "electrodomesticos"[\s\S]*sub\("climatizacion"/);});
test("Blanquería and Muebles remain inside real Hogar taxonomy",()=>{assert.match(c,/slug: "hogar"[\s\S]*sub\("hogar-y-deco"/);assert.match(c,/slug: "hogar"[\s\S]*sub\("blanqueria"/);});
test("Aire libre and mobility sources remain separate rather than destructively merged",()=>{assert.match(c,/slug: "camping-aire-libre-mascotas"[\s\S]*sub\("camping-y-aire-libre"/);assert.match(c,/slug: "auto-motos-energia"[\s\S]*sub\("auto-y-motos"/);});
test("Computación is not invented as a top-level taxonomy entry",()=>{assert.ok(!c.includes('slug: "computacion"'));});
test("category supports sector-scoped navigation",()=>{assert.match(p,/requestedSector/);assert.match(p,/searchParams/);});

test("Herramientas derives only unambiguous approved sectors before filtering",()=>{
  assert.match(i,/function deriveToolSubcategory/);
  assert.match(i,/matches\.size !== 1/);
  assert.match(i,/query\.category === "herramientas"/);
  assert.match(i,/delete sourceQuery\.subcategory/);
  assert.match(i,/merged\.filter\(\(product\) => product\.subcategory === query\.subcategory\)/);
});
test("Herramientas derivation covers the approved aliases",()=>{
  assert.match(i,/taladro\|taladros\|atornillador\|atornilladores\|percutor/);
  assert.match(i,/amoladora\|amoladoras/);
  assert.match(i,/sierra\|sierras\|caladora\|caladoras\|circular\|circulares/);
});

test("Audio derives only evidenced active sectors and keeps empty routes planned",()=>{
  assert.match(i,/function deriveAudioSubcategory/);
  assert.match(i,/parlante portatil/);
  assert.match(i,/barra de sonido/);
  assert.match(i,/matches\.add\("torres"\)/);
  assert.match(c,/sub\("auriculares"[\s\S]*navigationStatus: "planned"/);
  assert.match(c,/sub\("home-audio"[\s\S]*navigationStatus: "planned"/);
});
