import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const header = fs.readFileSync("app/components/site-header.tsx", "utf8");
const layout = fs.readFileSync("app/layout.tsx", "utf8");
const ux = fs.readFileSync("app/professional-app-ux.css", "utf8");

test("header replaces favorites heart shortcut with scroll-to-top action", () => {
  assert.match(header, /ArrowUp/);
  assert.match(header, /window\.scrollTo\(\{ top: 0, behavior: "smooth" \}\)/);
  assert.match(header, /aria-label="Volver arriba"/);
  assert.doesNotMatch(header, /header-favorites-link/);
  assert.doesNotMatch(header, /<Heart/);
});

test("professional interaction layer disables broad text selection but keeps strategic exceptions", () => {
  assert.match(layout, /import "\.\/professional-app-ux\.css"/);
  assert.match(ux, /body,\s*body \*/);
  assert.match(ux, /user-select: none/);
  assert.match(ux, /\[data-copyable="true"\]/);
  assert.match(ux, /input,\s*textarea/);
  assert.match(ux, /user-select: text !important/);
});

test("toasts and app dialogs have Amarango light-dark surfaces", () => {
  assert.match(ux, /\.toaster \[data-sonner-toast\]/);
  assert.match(ux, /\[data-slot="dialog-content"\]/);
  assert.match(ux, /\[data-slot="alert-dialog-content"\]/);
  assert.match(ux, /html\[data-theme="dark"\]/);
  assert.match(ux, /var\(--orange\)/);
});
