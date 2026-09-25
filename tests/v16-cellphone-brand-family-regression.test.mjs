import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

test("canonical cellphone fixture contains the evidenced Redmi cohort", async () => {
  const fixture = JSON.parse(await source("fixtures/v16-90-cellphones-materialized.json"));
  const redmi = fixture.products.filter((product) => product.brand === "Redmi");
  assert.equal(fixture.products.length, 90);
  assert.equal(redmi.length, 5);
});

test("Redmi is grouped into Xiaomi only at the navigation family layer", async () => {
  const family = await source("lib/catalog/brand-family.ts");
  assert.match(family, /normalized === "redmi"/);
  assert.match(family, /return "xiaomi"/);
});

test("Xiaomi local and accordion use brand-family matching without rewriting product brands", async () => {
  const [page, accordion, client] = await Promise.all([
    source("app/categoria/[slug]/page.tsx"),
    source("app/components/brand-product-accordion.tsx"),
    source("app/components/catalog-client.tsx"),
  ]);

  assert.match(page, /brandsShareFamily\(product\.brand, requestedCampaignBrand\)/);
  assert.match(accordion, /normalizeBrandFamily\(product\.brand\)/);
  assert.match(accordion, /normalizeBrandFamily\(brand\.brand\)/);
  assert.match(client, /compactBrandMode \? brandsShareFamily\(product\.brand, deferredBrand\)/);
});
