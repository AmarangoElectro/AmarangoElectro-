import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = [
  "lib/photo-intelligence/v415-photo-analyzer-provider.ts",
  "lib/commerce/v415-client-card.ts",
  "lib/analytics/v415-revenue-intelligence.ts",
  "lib/migration/v415-canary-plan.ts",
  "V4.15-CANARY-PAYLOAD.json",
  "AmarangoElectro-V16-V4.15-Commercial-Excellence-Canary-Readiness-Standalone-Android.html",
];
const source = (await Promise.all(files.map(async (file) =>
  `\n/* ${file} */\n${await readFile(path.join(root, file), "utf8")}`
))).join("");
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
  trackingSdk: /\b(?:gtag|analytics\.track|mixpanel|segment\.track)\s*\(/gi,
};
const counts = Object.fromEntries(Object.entries(rules).map(([name, pattern]) => [
  name,
  [...source.matchAll(pattern)].length,
]));
const result = {
  gate: "V4.15",
  mode: "controlled_migration_readiness_read_only",
  scannedFiles: files,
  counts,
  passed: Object.values(counts).every((count) => count === 0),
};
console.log(JSON.stringify(result, null, 2));
if (!result.passed) process.exitCode = 1;

