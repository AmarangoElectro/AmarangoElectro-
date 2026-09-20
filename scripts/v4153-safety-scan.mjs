import { readFile } from "node:fs/promises";

const files = [
  "AmarangoElectro-V16-V4.15.3-Admin-Function-Preservation-Audit-Standalone-Android-Desktop.html",
  "lib/internal/admin/v4153-preservation-audit.ts",
  "V4.15-CANARY-PAYLOAD.json",
];
const source = (await Promise.all(files.map((file) => readFile(new URL(`../${file}`, import.meta.url), "utf8")))).join("\n");
const checks = {
  insert:/\.(?:insert)\s*\(/gi,
  update:/\.(?:update)\s*\(/gi,
  upsert:/\.(?:upsert)\s*\(/gi,
  delete:/\.(?:delete)\s*\(/gi,
  writeRpc:/\.rpc\s*\([^)]*(?:write|save|publish|sync|mutate)/gi,
  mutatingHttp:/\bmethod\s*:\s*["'](?:POST|PUT|PATCH|DELETE)["']/gi,
  storageWrite:/\.storage\.(?:upload|remove|move|copy|update)/gi,
  serviceRole:/service[_-]?role/gi,
  databaseClient:/createClient\s*\(/gi,
  networkApi:/\bfetch\s*\(|XMLHttpRequest/gi,
};
const counts = Object.fromEntries(Object.entries(checks).map(([name, pattern]) => [name, (source.match(pattern) ?? []).length]));
const result = { gate:"V4.15.3", mode:"admin_function_preservation_audit_read_only", scannedFiles:files, counts, passed:Object.values(counts).every((count) => count === 0) };
console.log(JSON.stringify(result, null, 2));
if (!result.passed) process.exitCode = 1;
