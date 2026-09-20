import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = [
  "AmarangoElectro-V16-V4.15.2-Product-Card-Premium-Polish-Standalone-Android.html",
  "V4.15-CANARY-PAYLOAD.json",
];
const source = (await Promise.all(files.map(async (file) => `\n/* ${file} */\n${await readFile(path.join(root, file), "utf8")}`))).join("");
const rules = {
  insert: /\.insert\s*\(/gi,
  update: /\.from\s*\([^)]*\)\s*\.update\s*\(/gi,
  upsert: /\.upsert\s*\(/gi,
  delete: /\.from\s*\([^)]*\)\s*\.delete\s*\(/gi,
  writeRpc: /\.rpc\s*\(/gi,
  mutatingHttp: /method\s*:\s*["'](?:POST|PUT|PATCH|DELETE)["']/gi,
  storageWrite: /\.storage\s*\.from\s*\([^)]*\)\s*\.(?:upload|remove|move|copy|update)\s*\(/gi,
  serviceRole: /service_role|service-role/gi,
  databaseClient: /createClient\s*\(/gi,
  networkApi: /\b(?:fetch|XMLHttpRequest|sendBeacon|WebSocket)\s*\(?/gi,
};
const counts = Object.fromEntries(Object.entries(rules).map(([name, pattern]) => [name, [...source.matchAll(pattern)].length]));
const result = { gate: "V4.15.2", mode: "product_card_premium_polish_read_only", scannedFiles: files, counts, passed: Object.values(counts).every((count) => count === 0) };
console.log(JSON.stringify(result, null, 2));
if (!result.passed) process.exitCode = 1;
