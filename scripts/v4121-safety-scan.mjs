import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = [
  "lib/catalog/v412-source-contract.ts",
  "lib/catalog/v412-canonical-adapter.ts",
  "lib/catalog/index.ts",
  "V4.12-SANITIZED-SNAPSHOT-25.json",
  "AmarangoElectro-V16-V4.12-Standalone-Android.html",
];

const source = (await Promise.all(files.map(async (file) => `\n/* ${file} */\n${await readFile(path.join(root, file), "utf8")}`))).join("");
const rules = {
  insert: /\.insert\s*\(/gi,
  update: /\.update\s*\(/gi,
  upsert: /\.upsert\s*\(/gi,
  delete: /\.from\s*\([^)]*\)\s*\.delete\s*\(/gi,
  writeRpc: /\.rpc\s*\(/gi,
  mutatingHttp: /method\s*:\s*["'](?:POST|PUT|PATCH|DELETE)["']/gi,
  storageWrite: /\.storage\s*\.from\s*\([^)]*\)\s*\.(?:upload|remove|move|copy|update)\s*\(/gi,
  serviceRole: /service_role|service-role/gi,
};

const counts = Object.fromEntries(Object.entries(rules).map(([name, pattern]) => [name, [...source.matchAll(pattern)].length]));
const result = {
  gate: "V4.12.1",
  scannedFiles: files,
  counts,
  passed: Object.values(counts).every((count) => count === 0),
};

console.log(JSON.stringify(result, null, 2));
if (!result.passed) process.exitCode = 1;
