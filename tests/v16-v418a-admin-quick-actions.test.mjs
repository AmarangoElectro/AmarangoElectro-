import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");
async function runTs(script) {
  const { stdout } = await execFileAsync(process.execPath,["--experimental-strip-types","--experimental-loader","./tests/ts-extension-loader.mjs","--input-type=module","-e",script],{cwd:root});
  return JSON.parse(stdout);
}

test("V4.18A exposes the LAB surface only inside Administration", async () => {
  const [admin, grid] = await Promise.all([source("app/administracion/page.tsx"),source("components/internal/admin/admin-product-grid.tsx")]);
  assert.match(admin,/V4\.18A · recovery/); assert.match(grid,/V418AQuickActionsSheet/);
});

test("V4.18A does not expose Quick Actions to Client or Advisor", async () => {
  const files=["app/page.tsx","app/mi-amarango/page.tsx","app/components/advisor-workspace.tsx"];
  for(const file of files) assert.doesNotMatch(await source(file),/V418A|Quick Actions/);
});

test("V4.18A defines exactly the six authorized actions", async () => {
  const result=await runTs(`import {v418aActions} from './lib/internal/admin/v418a-quick-actions.ts';process.stdout.write(JSON.stringify(v418aActions));`);
  assert.deepEqual(result.map((item)=>item.label),["Editar precio","Disponibilidad","Cambiar foto","Categoría / subcategoría","Ocultar / mostrar","Abrir ficha completa"]);
});

test("V4.18A blocks invalid prices", async () => {
  const result=await runTs(`import {validateV418ADraft} from './lib/internal/admin/v418a-quick-actions.ts';const base={id:'x',name:'X',price:1,availability:'available',imageLabel:'',categorySlug:'otros',subcategorySlug:'',visible:true,imageFile:null};process.stdout.write(JSON.stringify([null,0,-2,NaN].map(price=>validateV418ADraft({...base,price}))));`);
  assert.ok(result.every((errors)=>errors.some((item)=>/precio/i.test(item))));
});

test("V4.18A availability is closed to four states", async () => {
  const result=await runTs(`import {V418A_AVAILABILITY,validateV418ADraft} from './lib/internal/admin/v418a-quick-actions.ts';const bad={id:'x',name:'X',price:1,availability:'invented',imageLabel:'',categorySlug:'otros',subcategorySlug:'',visible:true,imageFile:null};process.stdout.write(JSON.stringify({values:V418A_AVAILABILITY,errors:validateV418ADraft(bad)}));`);
  assert.deepEqual(result.values,["available","check_availability","unavailable","paused"]); assert.match(result.errors.join(" "),/disponibilidad/i);
});

test("V4.18A category and subcategory fail closed against authorized taxonomy", async () => {
  const result=await runTs(`import {validateV418ADraft} from './lib/internal/admin/v418a-quick-actions.ts';const base={id:'x',name:'X',price:1,availability:'available',imageLabel:'',visible:true,imageFile:null};process.stdout.write(JSON.stringify({badCategory:validateV418ADraft({...base,categorySlug:'invented',subcategorySlug:''}),badSub:validateV418ADraft({...base,categorySlug:'electrodomesticos',subcategorySlug:'invented'}),good:validateV418ADraft({...base,categorySlug:'electrodomesticos',subcategorySlug:'lavado'})}));`);
  assert.ok(result.badCategory.length); assert.ok(result.badSub.length); assert.deepEqual(result.good,[]);
});

test("V4.18A visibility changes only the draft", async () => {
  const result=await runTs(`import {createV418ADraft} from './lib/internal/admin/v418a-quick-actions.ts';const original={id:'x',name:'X',price:1,availability:'available',imageLabel:'',categorySlug:'otros',subcategorySlug:'',visible:true};const draft={...createV418ADraft(original),visible:false};process.stdout.write(JSON.stringify({original,draft}));`);
  assert.equal(result.original.visible,true); assert.equal(result.draft.visible,false);
});

test("V4.18A photo uses an ephemeral file input and no upload", async () => {
  const sheet=await source("components/internal/admin/v418a-quick-actions-sheet.tsx"); assert.match(sheet,/type="file"/); assert.doesNotMatch(sheet,/\.storage\.|upload\s*\(|fetch\s*\(/i);
});

test("V4.18A produces a deterministic before/after diff", async () => {
  const result=await runTs(`import {createV418ADraft,buildV418ADiff} from './lib/internal/admin/v418a-quick-actions.ts';const original={id:'x',name:'X',price:100,availability:'available',imageLabel:'old.webp',categorySlug:'otros',subcategorySlug:'',visible:true};const draft={...createV418ADraft(original),price:200,visible:false};process.stdout.write(JSON.stringify([buildV418ADiff(original,draft),buildV418ADiff(original,draft)]));`);
  assert.deepEqual(result[0],result[1]); assert.deepEqual(result[0].map((row)=>row.field),["price","visibility"]);
});

test("V4.18A render and full-sheet placeholder have no navigation side effects", async () => {
  const sheet=await source("components/internal/admin/v418a-quick-actions-sheet.tsx"); assert.match(sheet,/V4\.19 y no fue iniciada/); assert.doesNotMatch(sheet,/router\.|location\.|href=|push\s*\(/);
});

test("V4.18A preserves V4.16 and V4.17 protected artifacts", async () => {
  const {stdout}=await execFileAsync(process.execPath,["scripts/v418a-safety-scan.mjs"],{cwd:root}); const result=JSON.parse(stdout); assert.ok(Object.values(result.protectedHashes).every((entry)=>entry.passed));
});

test("V4.18A safety counters are zero and the Write Gate stays blocked", async () => {
  const {stdout}=await execFileAsync(process.execPath,["scripts/v418a-safety-scan.mjs"],{cwd:root}); const result=JSON.parse(stdout); assert.equal(result.passed,true); assert.ok(Object.values(result.counts).every((count)=>count===0));
  const contract=await runTs(`import {v418aWriteGate} from './lib/internal/admin/v418a-quick-actions.ts';process.stdout.write(JSON.stringify(v418aWriteGate));`); assert.equal(contract.mode,"SIMULADO_BLOQUEADO"); assert.equal(contract.productionWritesEnabled,false); assert.equal(contract.persistenceEnabled,false); assert.equal(contract.fullProductSheetImplemented,false);
});
