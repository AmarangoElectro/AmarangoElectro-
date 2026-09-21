import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");
const brands = ["telefunken", "kanji", "kanjihome", "philco", "bgh", "ken-brown", "rca", "jvc", "tcl", "noblex", "hp", "epson", "delhi", "oster", "ultracomb"];

test("Work V16 includes every approved light and dark brand campaign asset", async () => {
  const component = await source("app/components/brand-campaign-banner.tsx");
  for (const brand of brands) for (const theme of ["light", "dark"]) {
    const relative = `public/assets/v16-final/brands/${brand}-${theme}.jpg`;
    await access(new URL(relative, root));
    assert.match(component, new RegExp(`${brand}-${theme}\\.jpg`), relative);
  }
});

test("Work V16 campaigns stay additive and outside the protected catalog master", async () => {
  const [campaigns, categoryPage] = await Promise.all([source("app/data/v16-brand-campaigns.ts"), source("app/categoria/[slug]/page.tsx")]);
  for (const label of ["Kanjihome", "Telefunken", "Philco", "BGH", "Ken Brown", "RCA", "JVC", "TCL", "Noblex", "HP", "Epson", "Delhi", "Oster", "Ultracomb"]) assert.match(campaigns, new RegExp(label));
  assert.match(categoryPage, /getV16BrandCampaigns/);
  assert.match(categoryPage, /BrandProductAccordion/);
});

test("Work V16 owner surface contains team presence and white-label gates", async () => {
  const [workspace, presence, owner, roleContract] = await Promise.all([source("app/components/admin-consolidated-workspace.tsx"), source("components/internal/admin/admin-team-presence.tsx"), source("components/internal/admin/owner-control-center.tsx"), source("lib/internal/admin/v418b-storefront-admin-mode.ts")]);
  assert.match(workspace, /OwnerControlCenter/); assert.match(workspace, /AdminTeamPresence/);
  assert.match(presence, /maxi\.jpg/); assert.match(presence, /angie\.jpg/);
  for (const label of ["Suscriptores", "Familia y cuentas", "Tienda white-label", "Logo y colores"]) assert.match(owner, new RegExp(label));
  assert.match(roleContract, /"client", "advisor", "admin", "owner"/);
  assert.match(roleContract, /context\.adminMode !== true\) return "client"/);
});

test("Work V16 product cards frame real photos edge to edge", async () => {
  const styles = await source("app/globals.css");
  assert.match(styles, /\.product-card-premium \.product-image\s*\{[\s\S]*?object-fit:\s*cover;[\s\S]*?object-position:\s*center;[\s\S]*?padding:\s*0;/);
});

test("Work V16 preserves the supplier-photo review, bulk flyer and five-feature workflow", async () => {
  const panel = await source("components/internal/admin/photo-review-panel.tsx");
  assert.match(panel, /FOTO DEL MAYORISTA/);
  assert.match(panel, /Seleccionar todas/);
  assert.match(panel, /Flyer económico \(\{selected\.size\}\)/);
  assert.match(panel, /Edición y 5 características/);
  assert.match(panel, /Nada se envía a producción/);
});
