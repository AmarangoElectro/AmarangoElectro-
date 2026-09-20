import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Celulares keeps brand exploration inline with accessible drawers", async () => {
  const [page, accordion] = await Promise.all([
    read("app/categoria/[slug]/page.tsx"),
    read("app/components/brand-product-accordion.tsx"),
  ]);

  assert.match(page, /phoneAccordionMode/);
  assert.match(page, /<BrandProductAccordion/);
  assert.match(accordion, /aria-expanded=\{isOpen\}/);
  assert.match(accordion, /Ver tienda completa/);
  assert.match(accordion, /brandProducts\.map\(\(product\) => <ProductCard/);
});

test("new Administration and Gaming artwork stays logo-free and editable", async () => {
  const [admin, offers, offerStore, showroom] = await Promise.all([
    read("app/components/admin-consolidated-workspace.tsx"),
    read("app/components/offers-showcase.tsx"),
    read("lib/os-lab/offers-store.ts"),
    read("app/components/sector-showroom.tsx"),
  ]);

  assert.match(admin, /admin-operations-office-v1\.webp/);
  assert.match(offers, /src=\{offer\.imageSrc\}/);
  assert.doesNotMatch(offers, /retail-official-logo/);
  assert.match(offerStore, /playstation-5-slim-feature-v1\.webp/);
  assert.match(showroom, /gaming-sector-brandless-v1\.webp/);
});

test("the 22-sector sheet renders category artwork as compact visual links", async () => {
  const sheet = await read("app/components/all-sectors-sheet.tsx");
  assert.match(sheet, /category\.mobileImage/);
  assert.match(sheet, /sectors-sheet-row-art/);
  assert.match(sheet, /retailCategories\.length/);
});
