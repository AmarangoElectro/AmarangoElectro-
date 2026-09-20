import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("Step 7D enriches spec-driven product cards instead of adding Quick View friction", async () => {
  const card = await readFile(new URL("app/components/product-card.tsx", root), "utf8");
  assert.match(card, /product-card-specs/);
  assert.match(card, />Modelo</);
  assert.match(card, />Disponibilidad</);
  assert.doesNotMatch(card, /QuickView|quick-view|Vista rápida/i);
});

test("product page adds full image inspection, long-form decision content and deterministic related products", async () => {
  const page = await readFile(new URL("app/producto/[slug]/page.tsx", root), "utf8");
  const media = await readFile(new URL("app/components/product-media-viewer.tsx", root), "utf8");
  const details = await readFile(new URL("app/components/product-decision-details.tsx", root), "utf8");

  assert.match(page, /ProductMediaViewer/);
  assert.match(page, /ProductDecisionDetails/);
  assert.match(page, /relatedProducts/);
  assert.match(page, /candidate\.id !== product\.id/);
  assert.match(media, /showModal\(\)/);
  assert.match(media, /onDoubleClick/);
  assert.match(details, /<details open>/);
  assert.match(details, /Especificaciones/);
});

test("mobile PDP keeps commercial actions accessible and premium motion respects reduced motion", async () => {
  const css = await readFile(new URL("app/globals.css", root), "utf8");
  assert.match(css, /@view-transition/);
  assert.match(css, /product-actions-block[\s\S]*position:\s*sticky/);
  assert.match(css, /product-lightbox/);
  assert.match(css, /touch-action:\s*pinch-zoom/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test("Step 7D adds no network, production write, WhatsApp or Margarita integration", async () => {
  const files = [
    "app/components/product-media-viewer.tsx",
    "app/components/product-decision-details.tsx",
    "app/producto/[slug]/page.tsx",
    "app/components/product-card.tsx",
  ];
  const sources = await Promise.all(files.map((file) => readFile(new URL(file, root), "utf8")));
  const combined = sources.join("\n");
  const index = await readFile(new URL("lib/catalog/index.ts", root), "utf8");

  assert.doesNotMatch(combined, /fetch\s*\(|XMLHttpRequest|createClient|service_role|SUPABASE_URL|NEXT_PUBLIC_SUPABASE/i);
  assert.doesNotMatch(combined, /\.(?:insert|upsert|update|delete|rpc)\s*\(/i);
  assert.doesNotMatch(combined, /WhatsApp|webhook|worker|prompt|margarita-ui|amara\.js/i);
  assert.match(index, /new V411AuditedPilotCatalogAdapter\(\)/);
});
