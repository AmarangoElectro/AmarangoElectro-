import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const protectedFiles = {
  "lib/catalog/index.ts": "3ed0c1d0824e52039e29c5028ab4c83199f0fac0b0896e8748c4400d4b4e3c89",
  "lib/catalog/types.ts": "1ea4c181fa08bb4731fc0d1c5aea340046e6c96e85f051c465efa3dc8d58e7e8",
  "lib/catalog/audited-pilot-adapter.ts": "83244e52ba30524e8893f99172b7621d0784f7eee8ca4ed80819acb95425f015",
  "fixtures/v411-catalog-evidence-public.json": "23b154ecce32eef0403f3daee571359df63c7d1706311db104a0fd6c0014fff0",
  "lib/catalog/categories.ts": "de1f513b990704fe58a644da35a79a912b8a45badb60900226eca4478a24a669",
  ".openai/hosting.json": "5ef316162a0b7c1edde82c2a329c979c07a9c5bc137aa1223e3bee319f705a55",
  "app/components/product-card.tsx": "7ae00745331916583634b2e35dfe1142e1075c0646d2d9276032713811062eed",
  "lib/commerce/recently-viewed-store.ts": "51dc33a2d6c37931ae30e656faecfd3163d60fa337dda021146289dd2aecd8ea",
  "app/components/recently-viewed-recorder.tsx": "c05c2a701c3cd31d1ea687c6138214dbc3df12621b35f8f278af33bf55035c1a",
  "app/components/recently-viewed-rail.tsx": "21426fd90c20284fdb8f321ee71967d73a4c9f5694d878765408ab978eb59f98",
};

const runtimeFiles = [
  "lib/navigation/subcategory-context.ts",
  "app/components/subcategory-context-navigation.tsx",
  "app/categoria/[slug]/page.tsx",
  "app/components/celulares-navigation.tsx",
];
const source = (await Promise.all(runtimeFiles.map((file) => readFile(file, "utf8")))).join("\n");
const checks = {
  insert: /\.(?:insert)\s*\(/gi,
  update: /\.(?:update)\s*\(/gi,
  upsert: /\.(?:upsert)\s*\(/gi,
  delete: /\.(?:delete)\s*\(/gi,
  writeRpc: /\.rpc\s*\([^)]*(?:write|save|publish|sync|mutate)/gi,
  mutatingHttp: /\bmethod\s*:\s*["'](?:POST|PUT|PATCH|DELETE)["']/gi,
  remoteStorageWrite: /\.storage\.(?:upload|remove|move|copy|update)/gi,
  tracking: /sendBeacon|XMLHttpRequest|\bgtag\s*\(|\btrack(?:ing)?\s*\(/gi,
  network: /\bfetch\s*\(/gi,
};
const counts = Object.fromEntries(Object.entries(checks).map(([name, pattern]) => [name, (source.match(pattern) ?? []).length]));

const protectedHashes = {};
for (const [file, expected] of Object.entries(protectedFiles)) {
  const actual = createHash("sha256").update(await readFile(file)).digest("hex");
  protectedHashes[file] = { expected, actual, passed: actual === expected };
}

const branch = execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim();
const hasMainBranch = execFileSync("git", ["branch", "--list", "main"], { encoding: "utf8" }).trim().length > 0;
const helperPure = !/localStorage|sessionStorage|document\.|window\.|fetch\s*\(/.test(await readFile("lib/navigation/subcategory-context.ts", "utf8"));
const passed = branch.startsWith("recovery/")
  && !hasMainBranch
  && helperPure
  && Object.values(counts).every((count) => count === 0)
  && Object.values(protectedHashes).every((entry) => entry.passed);

process.stdout.write(`${JSON.stringify({
  gate: "V4.17 RECOVERY",
  mode: "read_only_contextual_navigation",
  branch,
  hasMainBranch,
  scannedFiles: runtimeFiles,
  counts,
  helperPure,
  protectedHashes,
  productionOrDeployExecuted: false,
  passed,
}, null, 2)}\n`);
if (!passed) process.exitCode = 1;
