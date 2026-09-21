import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
const advisor=fs.readFileSync("app/components/advisor-workspace.tsx","utf8");
const saleDraft=fs.readFileSync("app/components/advisor-sale-draft-panel.tsx","utf8");
const mi=fs.readFileSync("app/mi-amarango/page.tsx","utf8");
const platform=fs.readFileSync("app/plataforma/page.tsx","utf8");
const os=fs.readFileSync("app/amarango-os/page.tsx","utf8");

test("all internal routes require authenticated user",()=> {
  assert.match(mi,/requireChatGPTUser\("\/mi-amarango"\)/);
  assert.match(platform,/requireChatGPTUser\("\/plataforma"\)/);
  assert.match(os,/requireChatGPTUser\("\/amarango-os"\)/);
});
test("advisor surface does not expose lab Product Bridge as operational sale flow",()=> {
  assert.ok(!advisor.includes('href="/amarango-os"'));
  assert.ok(!advisor.includes("Abrir Product Bridge"));
  assert.match(advisor,/AdvisorSaleDraftPanel/);
  assert.match(saleDraft,/La venta todavía no se guarda/);
  assert.match(saleDraft,/<button type="button" disabled>Registrar venta<\/button>/);
});
test("advisor commerce fallbacks are professional and truthful",()=> {
  assert.ok(!advisor.includes("Cuotas no validadas"));
  assert.ok(!advisor.includes("Precio pendiente de fuente validada"));
  assert.match(advisor,/Consultá opciones de pago/);
  assert.match(advisor,/Consultá precio y opciones de pago/);
});
test("Amarango OS metadata no longer advertises a lab/version surface",()=> {
  assert.ok(!os.includes("Amarango OS V3"));
  assert.ok(!os.includes("Laboratorio de integración"));
  assert.match(os,/Herramienta interna de integración de catálogo/);
});
test("advisor surface renders no private admin product fields",()=> {
  for (const x of [".costArs",".supplier","service_role","auth.admin"]) assert.ok(!advisor.includes(x),x);
  assert.ok(!advisor.includes('href="/administracion"'));
});
