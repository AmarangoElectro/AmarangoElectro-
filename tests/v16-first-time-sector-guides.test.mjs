import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

async function render(path) {
  const workerUrl = new URL(`../dist/server/index.js?guides=${process.pid}-${Date.now()}-${encodeURIComponent(path)}`, import.meta.url);
  const { default: worker } = await import(workerUrl.href);
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const ctx = { waitUntil() {}, passThroughOnException() {} };
  return worker.fetch(new Request(`http://preview.local${path}`, { headers: { accept: "text/html" } }), env, ctx);
}

test("Sector guide engine: single reusable definition per role, no invented sectors", async () => {
  const guides = await source("lib/onboarding/sector-guides.ts");
  assert.match(guides, /role: "asesor"[\s\S]*?sectorId: "mi-amarango"/);
  assert.match(guides, /role: "admin"[\s\S]*?sectorId: "administracion"/);
  // No guide claims a role/sectorId that isn't a real, contract-backed sector in this repo.
  // "cobranzas" was removed from this exclusion list once V16_COBRANZAS_UI_CONTRACT_INTEGRATION
  // made it a real tab backed by a frozen RPC contract; "caja" was removed the same way once
  // V16_CASH_UI_CONTRACT_INTEGRATION made it a real tab backed by the frozen Cash RPC contract
  // (v16_cash_movements_list/v16_cash_summary/v16_post_cash_movement/v16_reverse_cash_movement).
  assert.doesNotMatch(guides, /sectorId: "(nueva-venta|mis-ventas|cliente-360|provider-inbox|mis-compras)"/);

  const types = await source("lib/onboarding/sector-guide-types.ts");
  assert.match(types, /SectorGuideDefinition/);
  assert.match(types, /SectorGuideStep/);
});

test("Sector guide progress store: localStorage-only, never an authorization signal", async () => {
  const storeSource = await source("lib/onboarding/guide-progress-store.ts");
  assert.doesNotMatch(storeSource, /fetch\s*\(|createClient|service_role|secret[_-]?key/i);
  assert.doesNotMatch(storeSource, /\.(?:insert|upsert|update|delete|rpc)\s*\(/i);
  assert.match(storeSource, /window\.localStorage/);
  assert.match(storeSource, /never be read as an authorization signal/);
});

test("Sector guide UI: uses the app's own themed Dialog, no external tour library, no raw alert/confirm", async () => {
  const componentSource = await source("app/components/sector-guide.tsx");
  assert.match(componentSource, /from "@\/components\/ui\/dialog"/);
  assert.doesNotMatch(componentSource, /window\.alert|window\.confirm|window\.prompt/);
  assert.doesNotMatch(componentSource, /intro\.js|shepherd|driver\.js|react-joyride/i);
  assert.match(componentSource, /Omitir/);
  assert.match(componentSource, /Atrás/);
  assert.match(componentSource, /Siguiente/);
  assert.match(componentSource, /Entendido/);
  assert.match(componentSource, /Ayuda de este sector/);
});

test("Sector guides are wired only into real, existing sector components — Home and public catalog untouched", async () => {
  const advisor = await source("app/components/advisor-workspace.tsx");
  assert.match(advisor, /SectorGuide/);
  assert.match(advisor, /data-guide-target="advisor-quick-grid"/);
  assert.match(advisor, /data-guide-target="advisor-catalog-search"/);

  const admin = await source("app/components/admin-consolidated-workspace.tsx");
  assert.match(admin, /SectorGuide/);
  assert.match(admin, /data-guide-target="admin-workspace-tabs"/);
  assert.match(admin, /data-guide-target="admin-catalog-grid"/);

  const home = await source("app/page.tsx");
  assert.doesNotMatch(home, /SectorGuide|sector-guide|onboarding/i);

  const search = await source("app/buscar/page.tsx");
  assert.doesNotMatch(search, /SectorGuide|sector-guide|onboarding/i);

  const category = await source("app/categoria/[slug]/page.tsx");
  assert.doesNotMatch(category, /SectorGuide|sector-guide|onboarding/i);

  const pdp = await source("app/producto/[slug]/page.tsx");
  assert.doesNotMatch(pdp, /SectorGuide|sector-guide|onboarding/i);
});

test("Production routes render unchanged: Home, /buscar, /categoria/celulares markup has no onboarding traces", async () => {
  const cases = ["/", "/buscar?q=A16", "/categoria/celulares?marca=Samsung&q=A16"];
  for (const path of cases) {
    const response = await render(path);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.doesNotMatch(html, /sector-guide|Ayuda de este sector|Te mostramos este sector/i, path);
  }
});

test("/mi-amarango and /administracion render successfully with the guide's permanent recovery trigger present", async () => {
  const advisor = await render("/mi-amarango");
  assert.equal(advisor.status, 200);
  const advisorHtml = await advisor.text();
  assert.match(advisorHtml, /Ayuda de este sector/);

  const admin = await render("/administracion");
  assert.equal(admin.status, 200);
  const adminHtml = await admin.text();
  assert.match(adminHtml, /Ayuda de este sector/);
});
