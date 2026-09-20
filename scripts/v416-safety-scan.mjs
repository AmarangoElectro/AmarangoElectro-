import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const protectedFiles = {
  "lib/catalog/index.ts": "3ed0c1d0824e52039e29c5028ab4c83199f0fac0b0896e8748c4400d4b4e3c89",
  "lib/catalog/types.ts": "1ea4c181fa08bb4731fc0d1c5aea340046e6c96e85f051c465efa3dc8d58e7e8",
  "lib/catalog/audited-pilot-adapter.ts": "83244e52ba30524e8893f99172b7621d0784f7eee8ca4ed80819acb95425f015",
  "fixtures/v411-catalog-evidence-public.json": "23b154ecce32eef0403f3daee571359df63c7d1706311db104a0fd6c0014fff0",
  "lib/catalog/categories.ts": "de1f513b990704fe58a644da35a79a912b8a45badb60900226eca4478a24a669",
  ".openai/hosting.json": "5ef316162a0b7c1edde82c2a329c979c07a9c5bc137aa1223e3bee319f705a55",
  "app/components/product-card.tsx": "7ae00745331916583634b2e35dfe1142e1075c0646d2d9276032713811062eed",
};

const runtimeFiles = [
  "lib/commerce/recently-viewed-store.ts",
  "app/components/recently-viewed-recorder.tsx",
  "app/components/recently-viewed-rail.tsx",
  "app/page.tsx",
  "app/categoria/[slug]/page.tsx",
  "app/producto/[slug]/page.tsx",
];

const source = (await Promise.all(runtimeFiles.map((file) => readFile(file, "utf8")))).join("\n");
const checks = {
  insert: /\.(?:insert)\s*\(/gi,
  update: /\.(?:update)\s*\(/gi,
  upsert: /\.(?:upsert)\s*\(/gi,
  delete: /\.(?:delete)\s*\(/gi,
  writeRpc: /\.rpc\s*\([^)]*(?:write|save|publish|sync|mutate)/gi,
  mutatingHttp: /\bmethod\s*:\s*["'](?:POST|PUT|PATCH|DELETE)["']/gi,
  storageWrite: /\.storage\.(?:upload|remove|move|copy|update)/gi,
  serviceRole: /service[_-]?role/gi,
  databaseClient: /createClient\s*\(/gi,
  networkApi: /\bfetch\s*\(|sendBeacon|XMLHttpRequest|\bgtag\s*\(/gi,
};
const counts = Object.fromEntries(Object.entries(checks).map(([name, pattern]) => [name, (source.match(pattern) ?? []).length]));

const hashes = {};
for (const [file, expected] of Object.entries(protectedFiles)) {
  const actual = createHash("sha256").update(await readFile(file)).digest("hex");
  hashes[file] = { expected, actual, passed: actual === expected };
}

const storageSource = await readFile("lib/commerce/recently-viewed-store.ts", "utf8");
const localStorageOnly = storageSource.includes("localStorage")
  && storageSource.includes("JSON.stringify(payload)")
  && storageSource.includes("version: recentlyViewedVersion")
  && storageSource.includes("ids: normalizeIds(ids)");
const passed = Object.values(counts).every((count) => count === 0)
  && Object.values(hashes).every((entry) => entry.passed)
  && localStorageOnly;

const result = {
  gate: "V4.16 RECOVERY",
  mode: "recently_viewed_device_local_only",
  scannedFiles: runtimeFiles,
  counts,
  localStorageOnly,
  protectedHashes: hashes,
  passed,
};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (!passed) process.exitCode = 1;
