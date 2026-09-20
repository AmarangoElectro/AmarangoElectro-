import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
const card=fs.readFileSync("app/components/product-card.tsx","utf8");
const catalog=fs.readFileSync("app/components/catalog-client.tsx","utf8");
const homePreview=fs.readFileSync("app/components/home-products-preview.tsx","utf8");
const pdp=fs.readFileSync("app/producto/[slug]/page.tsx","utf8");
const category=fs.readFileSync("app/categoria/[slug]/page.tsx","utf8");

test("one canonical ProductCard component owns storefront cards",()=>{
  assert.match(card,/export function ProductCard/);
  for(const source of [catalog,homePreview,pdp]) assert.match(source,/import \{ ProductCard \}/);
});
test("catalog and related products render canonical ProductCard",()=>{
  assert.match(catalog,/<ProductCard/);
  assert.match(pdp,/<ProductCard key=\{item\.id\} product=\{item\}/);
});
test("canonical ProductCard always routes to the real PDP",()=>{
  assert.match(card,/const href = `\/producto\/\$\{product\.slug\}`/);
  assert.match(card,/href=\{href\}/);
});
test("sector page feeds its real products into CatalogClient",()=>{
  assert.match(category,/<CatalogClient/);
  assert.match(category,/products=\{products\}/);
});
test("card uses product source for image, brand, price, installments and stock",()=>{
  for(const token of ["product.image","product.brand","product.price","product.financing","product.stock"]) assert.ok(card.includes(token),token);
});
