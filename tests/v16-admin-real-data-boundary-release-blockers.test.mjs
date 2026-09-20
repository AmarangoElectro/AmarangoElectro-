import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
const crm=fs.readFileSync("lib/crm/client-crm-adapter.ts","utf8");
const cat=fs.readFileSync("lib/catalog/audited-pilot-adapter.ts","utf8");
const cohort=fs.readFileSync("lib/catalog/cohort0-frozen-adapter.ts","utf8");
const index=fs.readFileSync("lib/catalog/index.ts","utf8");
const phones=fs.readFileSync("lib/catalog/v16-cellphones-90-materialized-adapter.ts","utf8");
const offers=fs.readFileSync("lib/os-lab/offers-store.ts","utf8");
const os=fs.readFileSync("lib/integration/product-bridge-lab.ts","utf8");
const auth=fs.readFileSync("lib/internal/auth/user-access-contract.ts","utf8");

test("active public catalog is evidence-backed, not production-certified",()=> {
  assert.match(index,/V411AuditedPilotCatalogAdapter/);
  assert.match(index,/Cohort0FrozenCatalogAdapter/);
  assert.match(cat,/production_catalog_verified: z\.literal\(false\)/);
  assert.match(cohort,/production_catalog_verified: z\.literal\(false\)/);
});
test("90 cellphone cohort remains fail-closed from public commerce",()=> {
  assert.match(phones,/visible: false/);
  assert.match(phones,/price: null/);
  assert.match(phones,/financing: \[\]/);
});
test("RPC-backed admin modules remain disconnected until secure config exists",()=> {
  assert.match(crm,/export function getCrmAccessConfig\(\): CrmAccessConfig \| null \{\s*return null;/s);
});
test("offers and Amarango OS remain local/mock surfaces",()=> {
  assert.match(offers,/localStorage/);
  assert.match(os,/source = "mock"/);
});
test("RBAC contract remains fail-closed until provider integration",()=> {
  assert.match(auth,/NOT_CONNECTED_USER_ACCESS_PROVIDER/);
  assert.match(auth,/status: "not_connected"/);
});
