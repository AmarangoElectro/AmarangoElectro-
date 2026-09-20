import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
const admin=fs.readFileSync("app/components/admin-consolidated-workspace.tsx","utf8");
const advisor=fs.readFileSync("app/components/advisor-workspace.tsx","utf8");
const os=fs.readFileSync("app/amarango-os/page.tsx","utf8");
const platform=fs.readFileSync("app/plataforma/page.tsx","utf8");

test("mock-backed review surfaces are explicitly labeled as review/draft",()=> {
  assert.match(admin,/Revisión de tienda/);
  assert.match(admin,/90 Celulares · revisión/);
  assert.match(admin,/Ofertas · borrador/);
});
test("advisor production surface has no route to the mock product bridge",()=> {
  assert.ok(!advisor.includes('href="/amarango-os"'));
  assert.ok(!advisor.includes("Product Bridge"));
});
test("mock integration route remains authenticated",()=> {
  assert.match(os,/requireChatGPTUser\("\/amarango-os"\)/);
});
test("platform architecture route remains authenticated",()=> {
  assert.match(platform,/requireChatGPTUser\("\/plataforma"\)/);
});
test("admin review surfaces do not claim publication",()=> {
  assert.match(admin,/Los cambios productivos requieren autorización/);
  assert.ok(!admin.includes("publicado automáticamente"));
});
