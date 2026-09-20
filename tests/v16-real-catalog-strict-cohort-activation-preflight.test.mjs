import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
const strict=JSON.parse(fs.readFileSync("evidence/v16-strict-product-projection-127.json","utf8"));
const cohort=JSON.parse(fs.readFileSync("evidence/v16-cohort0-conditional-9.json","utf8"));
const index=fs.readFileSync("lib/catalog/index.ts","utf8");

test("strict projection contains exactly 127 existing-authority Product V16 rows",()=> {
  assert.equal(strict.count,127);
  assert.equal(strict.products.length,127);
  assert.equal(strict.metrics.available,127);
});
test("strict projection has only the two recovered blockers",()=> {
  assert.equal(strict.metrics.liveHttpNotCertified,112);
  assert.equal(strict.metrics.imageReview,15);
  assert.equal(strict.metrics.liveHttpNotCertified + strict.metrics.imageReview,127);
});
test("strict projection has no private cost or supplier fields",()=> {
  const allowed=new Set(strict.publicFields);
  for (const forbidden of ["cost","cost_ars","supplier","supplier_id","usd","markup","commission"]) assert.ok(!allowed.has(forbidden),forbidden);
  for (const p of strict.products) for (const key of Object.keys(p)) assert.ok(allowed.has(key),key);
});
test("curated cohort 0 has exactly 9 candidates and is a subset of strict projection",()=> {
  assert.equal(cohort.count,9);
  assert.equal(cohort.items.length,9);
  const strictIds=new Set(strict.products.map(p=>String(p.stable_id)));
  for (const item of cohort.items) assert.ok(strictIds.has(String(item.stable_id)),item.stable_id);
});
test("cohort 0 remains conditional and not authorized for publication",()=> {
  assert.equal(cohort.status,"CONDITIONAL_COHORT_0_NOT_AUTHORIZED_FOR_PUBLICATION");
  for (const item of cohort.items) {
    assert.equal(item.publication_state,"REVIEW");
    assert.equal(item.primary_blocker,"LIVE_HTTP_NOT_CERTIFIED");
    assert.equal(item.recommendation_state,"CONDITIONAL_COHORT_0");
  }
});
test("neither recovered projection is activated in the public catalog",()=> {
  assert.ok(!index.includes("v16-strict-product-projection-127.json"));
  assert.ok(!index.includes("v16-cohort0-conditional-9.json"));
  assert.match(index,/V411AuditedPilotCatalogAdapter/);
  assert.match(index,/Cohort0FrozenCatalogAdapter/);
});
