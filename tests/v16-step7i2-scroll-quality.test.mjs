import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const component = fs.readFileSync(path.join(root, "app/components/scroll-quality-manager.tsx"), "utf8");
const css = fs.readFileSync(path.join(root, "app/globals.css"), "utf8");
const layout = fs.readFileSync(path.join(root, "app/layout.tsx"), "utf8");

test("scroll manager keeps native scroll and uses a passive listener", () => {
  assert.match(component, /addEventListener\("scroll", markActive, \{ passive: true \}\)/);
  assert.doesNotMatch(component, /preventDefault\s*\(/);
  assert.doesNotMatch(component, /addEventListener\(\"(?:touchmove|wheel)\"/);
  assert.doesNotMatch(component, /scrollTo\s*\(|scrollBy\s*\(/);
});

test("active touch scrolling removes expensive backdrop blur and pauses decoration", () => {
  assert.match(css, /data-scroll-activity="active"/);
  assert.match(css, /backdrop-filter: none !important/);
  assert.match(css, /animation-play-state: paused !important/);
  assert.match(css, /transition-duration: 0s !important/);
});

test("touch baseline does not force synthetic smooth scrolling", () => {
  assert.match(css, /@media \(hover: none\), \(pointer: coarse\)/);
  assert.match(css, /html \{ scroll-behavior: auto; \}/);
  assert.match(css, /backdrop-filter: blur\(6px\)/);
});

test("manager is mounted globally without coupling to protected data layers", () => {
  assert.match(layout, /<ScrollQualityManager \/>/);
  assert.doesNotMatch(component, /supabase|fetch\s*\(|insert\s*\(|upsert\s*\(|update\s*\(|rpc\s*\(/i);
});
