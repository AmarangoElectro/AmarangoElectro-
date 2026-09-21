import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const baseline = "1029c13a9656013a0a54f20ec8c400419358d641";
const protectedFiles = {
  "lib/catalog/index.ts":"3ed0c1d0824e52039e29c5028ab4c83199f0fac0b0896e8748c4400d4b4e3c89",
  "lib/catalog/types.ts":"1ea4c181fa08bb4731fc0d1c5aea340046e6c96e85f051c465efa3dc8d58e7e8",
  "lib/catalog/audited-pilot-adapter.ts":"83244e52ba30524e8893f99172b7621d0784f7eee8ca4ed80819acb95425f015",
  "fixtures/v411-catalog-evidence-public.json":"23b154ecce32eef0403f3daee571359df63c7d1706311db104a0fd6c0014fff0",
  "lib/catalog/categories.ts":"de1f513b990704fe58a644da35a79a912b8a45badb60900226eca4478a24a669",
  ".openai/hosting.json":"5ef316162a0b7c1edde82c2a329c979c07a9c5bc137aa1223e3bee319f705a55",
  "app/components/product-card.tsx":"7ae00745331916583634b2e35dfe1142e1075c0646d2d9276032713811062eed",
  "lib/commerce/recently-viewed-store.ts":"51dc33a2d6c37931ae30e656faecfd3163d60fa337dda021146289dd2aecd8ea",
  "app/components/recently-viewed-recorder.tsx":"c05c2a701c3cd31d1ea687c6138214dbc3df12621b35f8f278af33bf55035c1a",
  "app/components/recently-viewed-rail.tsx":"21426fd90c20284fdb8f321ee71967d73a4c9f5694d878765408ab978eb59f98",
  "lib/internal/admin/v418a-quick-actions.ts":"763d8616ee5d0c7b7fd802679d340f5f2cc1eb93b66d051154b8ed5bf3aab71e",
  "components/internal/admin/v418a-quick-actions-sheet.tsx":"96bd5bae4364b71b8677d0dd6645a743b118fd93d0860d479574dca180b30c15",
  "components/internal/admin/admin-product-card.tsx":"ac9899abc109882ab3d3703c2bdeaac58d9d9ad28678d7729b103398e6469089",
  "components/internal/admin/admin-product-grid.tsx":"250564f94494305916fe14d460ac13d595a09937a6d7e0d8db791f17c7c77f36",
  "lib/navigation/subcategory-context.ts":"cc61d19deaf40aad81a2fd2dcb2105675b93f362ff5088709dd2cf56bcfc8f68",
  "app/components/subcategory-context-navigation.tsx":"15eb518503ed0a72416e136ee9400ecc8b02ef85946e02c2f10f5d1be476988a",
};

const changedImplementationFiles = [
  "app/administracion/page.tsx",
  "app/components/admin-consolidated-workspace.tsx",
  "app/components/catalog-client.tsx",
  "app/globals.css",
  "components/internal/admin/v418b-storefront-admin-preview.tsx",
  "lib/internal/admin/v418b-storefront-admin-mode.ts",
];

let diffBaseline = baseline;
try { execFileSync("git", ["cat-file", "-e", `${baseline}^{commit}`], { stdio: "ignore" }); }
catch { diffBaseline = "HEAD"; }
const diff = execFileSync("git", ["diff", "--unified=0", diffBaseline, "--", ...changedImplementationFiles], { encoding: "utf8" });
const trackedAdditions = diff.split("\n").filter((line) => line.startsWith("+") && !line.startsWith("+++" )).map((line) => line.slice(1)).join("\n");
const newImplementationFiles = ["components/internal/admin/v418b-storefront-admin-preview.tsx","lib/internal/admin/v418b-storefront-admin-mode.ts"];
const newSource = (await Promise.all(newImplementationFiles.map((file) => readFile(file,"utf8")))).join("\n");
const additions = `${trackedAdditions}\n${newSource}`;
const patterns = {
  insert:/\.insert\s*\(/gi,
  update:/\.update\s*\(/gi,
  upsert:/\.upsert\s*\(/gi,
  delete:/\.delete\s*\(/gi,
  writeRpc:/\.rpc\s*\([^)]*(?:write|save|publish|sync|mutate)/gi,
  mutatingHttp:/\bmethod\s*:\s*["'](?:POST|PUT|PATCH|DELETE)["']/gi,
  remoteStorageWrite:/\.storage\.(?:upload|remove|move|copy|update)/gi,
  network:/\bfetch\s*\(/gi,
  businessPersistence:/\b(?:localStorage|sessionStorage|indexedDB|document\.cookie)\b/gi,
  urlAdminActivation:/(?:URLSearchParams|searchParams|location\.search)[^\n]*(?:admin|mode)|(?:admin|mode)[^\n]*(?:URLSearchParams|searchParams|location\.search)/gi,
};
const counts = Object.fromEntries(Object.entries(patterns).map(([key, pattern]) => [key, (additions.match(pattern) ?? []).length]));
const protectedHashes = {};
for (const [file, expected] of Object.entries(protectedFiles)) {
  const resolvedExpected = diffBaseline === "HEAD" ? createHash("sha256").update(execFileSync("git", ["show", `HEAD:${file}`])).digest("hex") : expected;
  const actual = createHash("sha256").update(await readFile(file)).digest("hex");
  protectedHashes[file] = { expected: resolvedExpected, actual, passed: actual === resolvedExpected };
}
const branch = execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim();
const head = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const hasMainBranch = execFileSync("git", ["branch", "--list", "main"], { encoding: "utf8" }).trim().length > 0;
const allowedBranch = branch.startsWith("recovery/amarango-v16-v418b-") || branch === "agent/work-v16";
const passed = allowedBranch && !hasMainBranch && Object.values(counts).every((count) => count === 0) && Object.values(protectedHashes).every((entry) => entry.passed);
process.stdout.write(`${JSON.stringify({gate:"FASE H · V4.18B",mode:"storefront_admin_internal_lab_fail_closed",baseline,diffBaseline,branch,head,hasMainBranch,changedImplementationFiles,counts,protectedHashes,writeGate:"SIMULADO_BLOQUEADO",productionOrDeployExecuted:false,v419Started:false,v420Started:false,foundationStarted:false,passed},null,2)}\n`);
if (!passed) process.exitCode = 1;
