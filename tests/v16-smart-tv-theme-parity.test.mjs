import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
const r=fs.readFileSync("lib/theme/brand-locale.ts","utf8"), css=fs.readFileSync("app/globals.css","utf8");
test("TCL keeps approved red identity",()=>{assert.match(r,/key: "tcl"[\s\S]*accent: "#ff3b30"[\s\S]*accent2: "#8d0b0b"/);});
test("Samsung and TCL are both Smart TV locals",()=>{assert.match(r,/key: "samsung"[\s\S]*sectors: \["celulares", "smart-tv"\]/);assert.match(r,/key: "tcl"[\s\S]*sectors: \["smart-tv"\]/);});
test("light brand banner uses brand accent typography",()=>{assert.match(css,/V16_APPROVED_BRAND_LOCALE_THEME_PARITY/);assert.match(css,/\.brand-locale-copy h1,[\s\S]*color: var\(--brand-locale-accent\)/);});
test("dark theme switches entire banner to dark brand background with readable text",()=>{assert.match(css,/:root\[data-theme="dark"\] \.brand-locale-hero \{[\s\S]*background: var\(--brand-locale-dark\)/);assert.match(css,/:root\[data-theme="dark"\] \.brand-locale-copy h1 \{[\s\S]*color: #ffffff/);assert.match(css,/:root\[data-theme="dark"\] \.brand-locale-description \{[\s\S]*color: #d7dfeb/);});
