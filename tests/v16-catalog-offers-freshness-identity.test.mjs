import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("provider offer snapshot preserves all 553 source rows without costs", () => {
  const fixture = JSON.parse(fs.readFileSync("fixtures/v16-internal-provider-offers-20260920.json", "utf8"));
  assert.equal(fixture.offers.length, 553);
  assert.equal(fixture.safety.costs_included, false);
  assert.equal(new Set(fixture.offers.map((offer) => offer.sourceProductId)).size, 553);
  for (const offer of fixture.offers) {
    assert.ok(!("cost" in offer));
    assert.ok(!("costo" in offer));
  }
});

test("matcher is conservative and always requires human review", () => {
  const matcher = fs.readFileSync("lib/internal/catalog/provider-offer-matcher.ts", "utf8");
  assert.match(matcher, /humanReviewRequired: true/);
  assert.match(matcher, /score < 0\.72/);
  assert.match(matcher, /visualEvidence: left\.image && right\.image \? "pending"/);
  assert.match(matcher, /numericConflict/);
  assert.doesNotMatch(matcher, /auto.?merge|automatic.?merge/i);
});

test("review surface supports same, different and later decisions locally", () => {
  const ui = fs.readFileSync("components/internal/admin/catalog-match-review.tsx", "utf8");
  assert.match(ui, /Sí, es el mismo producto/);
  assert.match(ui, /No, son distintos/);
  assert.match(ui, /Revisar después/);
  assert.match(ui, /localStorage/);
  assert.match(ui, /Precio sugerido/);
});

test("advisor freshness is provider-safe and distinguishes automatic source freshness", () => {
  const fixture = JSON.parse(fs.readFileSync("fixtures/v16-advisor-freshness-sanitized-20260920.json", "utf8"));
  assert.equal(fixture.products.length, 553);
  assert.equal(fixture.safety.provider_identity_included, false);
  const modes = new Set(fixture.products.map((row) => row.stockVerificationMode));
  assert.deepEqual([...modes].sort(), ["automatic","manual","unknown"]);
  const helper = fs.readFileSync("lib/catalog/advisor-freshness.ts", "utf8");
  assert.match(helper, /Precio actualizado/);
  assert.match(helper, /Fuente automática de stock actualizada/);
  assert.match(helper, /Stock sin confirmación automática/);
});

test("public drawer hides internal links unless an authenticated internal user is present", () => {
  const header = fs.readFileSync("app/components/site-header.tsx", "utf8");
  const home = fs.readFileSync("app/page.tsx", "utf8");
  assert.match(header, /internalUserName \?/);
  assert.match(header, /SESIÓN RECONOCIDA/);
  assert.match(home, /getChatGPTUser/);
  assert.match(home, /<SiteHeader internalUserName=\{internalUserName\}/);
});
