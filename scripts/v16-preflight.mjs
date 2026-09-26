import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import process from "node:process";

import { catalog } from "../lib/catalog/index.ts";
import { categories } from "../lib/catalog/categories.ts";

const EXPECTED_BRANCH = "work/v16-modelo-correcto-live-20260919";
const EXPECTED_SITE_ID = "appgprj_6aac91ff2e7c819180c8981c34a310b0";
const REQUIRED_ENV = ["SUPABASE_SECRET_KEY"];
const failures = [];
const notes = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function commercialKey(product) {
  return [product.category, product.subcategory ?? "", product.brand, product.model ?? "", product.name]
    .join("|")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

try {
  check(git("branch", "--show-current") === EXPECTED_BRANCH, `branch must be ${EXPECTED_BRANCH}`);
  check(git("status", "--porcelain") === "", "working tree must be clean");
} catch (error) {
  failures.push(`git unavailable: ${error.message}`);
}

const [nodeMajor, nodeMinor] = process.versions.node.split(".").map(Number);
check(nodeMajor > 22 || (nodeMajor === 22 && nodeMinor >= 13), "Node.js >=22.13.0 is required");
check(existsSync("node_modules"), "dependencies are missing; run npm ci");

const require = createRequire(import.meta.url);
for (const dependency of ["next", "react", "vite", "tsx"]) {
  try { require.resolve(dependency); } catch { failures.push(`dependency unavailable: ${dependency}`); }
}
check(existsSync("node_modules/vinext/package.json"), "dependency unavailable: vinext");

for (const file of [
  "package.json", "package-lock.json", ".openai/hosting.json", ".env.example",
  "worker/index.ts", "public/manifest.webmanifest", "public/sw.js",
  "docs/V16-CURRENT-MASTER-HANDOFF.md",
]) check(existsSync(file), `missing essential file: ${file}`);

if (existsSync(".openai/hosting.json")) {
  const hosting = JSON.parse(readFileSync(".openai/hosting.json", "utf8"));
  check(hosting.project_id === EXPECTED_SITE_ID, "unexpected Sites project id");
}

const manifest = existsSync("public/manifest.webmanifest")
  ? JSON.parse(readFileSync("public/manifest.webmanifest", "utf8"))
  : null;
check(Boolean(manifest?.name && manifest?.start_url && manifest?.icons?.length), "PWA manifest is incomplete");
for (const icon of manifest?.icons ?? []) check(existsSync(`public${icon.src}`), `missing PWA icon: ${icon.src}`);

const products = await catalog.listProducts({ visibleOnly: true });
const phones = products.filter((product) => product.category === "celulares");
const electro = products.filter((product) => product.category === "electrodomesticos");
const ids = products.map((product) => product.id);
const slugs = products.map((product) => product.slug);
const keys = products.map(commercialKey);

check(products.length === 569, `expected 569 visible products, got ${products.length}`);
check(new Set(ids).size === products.length, "duplicate product ids detected");
check(new Set(slugs).size === products.length, "duplicate product slugs detected");
check(new Set(keys).size === products.length, "duplicate commercial products detected");
check(phones.length === 90, `expected 90 phones, got ${phones.length}`);
check(phones.every((product) => Boolean(product.image?.src)), "all 90 phones must have images");
check(electro.length === 285, `expected 285 electro products, got ${electro.length}`);
check(categories.length === 14, `expected 14 category definitions, got ${categories.length}`);

const tracked = git("ls-files").split("\n").filter(Boolean);
const secretPatterns = [
  /sb_secret_[A-Za-z0-9_-]{12,}/,
  /\bservice[_-]?role\b[^=:\n]{0,40}[=:]\s*["'][^"'\n]{12,}["']/i,
  /gh[pousr]_[A-Za-z0-9]{20,}/,
];
for (const file of tracked) {
  if (!existsSync(file)) continue;
  let content;
  try { content = readFileSync(file, "utf8"); } catch { continue; }
  check(!secretPatterns.some((pattern) => pattern.test(content)), `possible committed secret in ${file}`);
}

const missingEnv = REQUIRED_ENV.filter((name) => !process.env[name]);
if (missingEnv.length) {
  if (process.env.V16_PREFLIGHT_REQUIRE_RUNTIME_ENV === "1") {
    failures.push(`required runtime variables missing: ${missingEnv.join(", ")}`);
  } else {
    notes.push(`connected Growth disabled (missing ${missingEnv.join(", ")}); fail-closed local mode is valid`);
  }
}

console.log(`V16 catalog: ${products.length} products, ${phones.length} phones, ${electro.length} electro, ${categories.length} categories`);
for (const note of notes) console.log(`NOTE: ${note}`);
if (failures.length) {
  for (const failure of failures) console.error(`BLOCKER: ${failure}`);
  console.error("BLOCKED_V16_PREFLIGHT");
  process.exit(1);
}
console.log("PASS_V16_PREFLIGHT");
