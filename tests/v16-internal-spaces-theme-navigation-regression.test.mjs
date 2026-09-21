import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

test("internal header exposes the global theme control without changing route authority", async () => {
  const header = await source("app/components/internal-space-header.tsx");
  assert.match(header, /ThemeToggle/);
  assert.match(header, /<ThemeToggle \/>/);
  assert.match(header, /href="\/"[^>]*>.*Tienda/s);
  assert.doesNotMatch(header, /href="\/administracion"|href="\/mi-amarango"/);
});

test("Mi Amarango keeps navigation local to advisor-safe sections", async () => {
  const advisor = await source("app/components/advisor-workspace.tsx");
  for (const anchor of ["#advisor-tools", "#advisor-offers", "#advisor-catalog"]) assert.ok(advisor.includes(anchor), anchor);
  assert.match(advisor, /advisor-section-nav/);
  assert.doesNotMatch(advisor, /href="\/administracion"|href="\/amarango-os"/);
});

test("Administration persists module context in the hash without role or data writes", async () => {
  const admin = await source("app/components/admin-consolidated-workspace.tsx");
  assert.match(admin, /const adminTabIds/);
  assert.match(admin, /type AdminTab/);
  assert.match(admin, /history\.replaceState/);
  assert.match(admin, /window\.location\.hash\.slice\(1\)/);
  assert.match(admin, /hashchange/);
  assert.doesNotMatch(admin, /email\s*===|email\.includes|auth\.admin/);
});

test("internal light-dark parity covers advisor and administration shells", async () => {
  const css = await source("app/globals.css");
  assert.match(css, /V16 internal spaces — theme control, local navigation and Admin dark parity/);
  assert.match(css, /html\[data-theme="dark"\] \.admin-workspace-tabs/);
  assert.match(css, /html\[data-theme="dark"\] \.flyer-lab/);
  assert.match(css, /html\[data-theme="dark"\] \.admin-local-controls/);
  assert.match(css, /\.advisor-section-nav/);
  assert.match(css, /scroll-snap-type: x proximity/);
});
