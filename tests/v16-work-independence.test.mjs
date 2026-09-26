import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const envExample = readFileSync(".env.example", "utf8");
const handoff = readFileSync("docs/V16-CURRENT-MASTER-HANDOFF.md", "utf8");

test("V16 exposes reproducible preflight, QA and local preview commands", () => {
  assert.match(pkg.scripts["v16:preflight"], /v16-preflight/);
  assert.match(pkg.scripts["v16:qa"], /v16-qa/);
  assert.match(pkg.scripts["preview:v16"], /vite/);
});

test("environment example contains names only and no secret values", () => {
  assert.match(envExample, /^SUPABASE_URL=\nSUPABASE_SECRET_KEY=\n$/);
  assert.doesNotMatch(envExample, /sb_secret_|service[_-]?role|eyJ[A-Za-z0-9_-]+\./i);
});

test("master handoff documents the operational continuity boundary", () => {
  for (const phrase of [
    "work/v16-modelo-correcto-live-20260919",
    "569 productos",
    "90 celulares",
    "Plan Protegido",
    "CRM",
    "Supabase",
    "npm run v16:preflight",
    "npm run v16:qa",
    "PREVIEW",
    "PRODUCCIÓN",
  ]) assert.match(handoff, new RegExp(phrase));
});
