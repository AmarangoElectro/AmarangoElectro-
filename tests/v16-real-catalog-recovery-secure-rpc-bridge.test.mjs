import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
const snapshot=JSON.parse(fs.readFileSync("evidence/catalog-source-snapshot.sanitized.json","utf8"));
const summary=JSON.parse(fs.readFileSync("evidence/v16-real-catalog-recovery-summary.json","utf8"));
const index=fs.readFileSync("lib/catalog/index.ts","utf8");
const bridge=fs.readFileSync("lib/internal/auth/secure-rpc-session-bridge-contract.ts","utf8");
const crm=fs.readFileSync("lib/crm/client-crm-adapter.ts","utf8");
const adapterFiles=[
  "lib/crm/client-crm-adapter.ts","lib/collections/collections-adapter.ts",
  "lib/payments/payment-history-adapter.ts","lib/reports/reports-adapter.ts",
  "lib/providers/provider-inbox-adapter.ts","lib/cash/cash-adapter.ts",
  "lib/deliveries/deliveries-adapter.ts","lib/advisors/advisors-adapter.ts"
];

test("recovered real snapshot is read-only and matches audited master counts",()=> {
  assert.equal(snapshot.mode,"read_only");
  assert.equal(snapshot.writeEnabled,false);
  assert.equal(snapshot.counts.masterTotal,1488);
  assert.equal(snapshot.counts.masterVisible,590);
  assert.equal(snapshot.counts.tombstones,48);
});
test("strict audit summary remains non-activated and zero-ready for live HTTP",()=> {
  assert.equal(summary.activation,false);
  assert.equal(summary.strictAuditFromRecoveredWorkbook.readyV16LiveHttpCertified,0);
  assert.equal(summary.strictAuditFromRecoveredWorkbook.headAlignment,"NOT_VERIFIED_CURRENT_HEAD_FFE77535");
});
test("stronger recovered evidence is not silently activated in the app catalog",()=> {
  assert.ok(!index.includes("catalog-source-snapshot.sanitized.json"));
  assert.ok(!index.includes("v16-real-catalog-recovery-summary.json"));
  assert.match(index,/V411AuditedPilotCatalogAdapter/);
  assert.match(index,/Cohort0FrozenCatalogAdapter/);
});
test("secure bridge is fail-closed and forbids direct or privileged browser authority",()=> {
  assert.match(bridge,/NOT_CONNECTED_SECURE_RPC_BRIDGE/);
  assert.match(bridge,/status: "not_connected"/);
  assert.match(bridge,/directTableAccessAllowed: false/);
  assert.match(bridge,/browserCredentialBridgeAllowed: false/);
  assert.match(bridge,/browserPrivilegedCredentialAllowed: false/);
  assert.match(bridge,/platformAuthority: "v16_user_access"/);
});
test("bridge allowlist covers exactly the RPC names used by recovered adapters",()=> {
  const expected=[...new Set(adapterFiles.flatMap(file => [...fs.readFileSync(file,"utf8").matchAll(/"(v16_[a-z0-9_]+)"/g)].map(m=>m[1])))].sort();
  const arrayMatch=bridge.match(/V16_SECURE_RPC_ALLOWLIST = Object\.freeze\(\[([\s\S]*?)\]\s+as const\)/);
  assert.ok(arrayMatch,"allowlist array not found");
  const actual=[...new Set([...arrayMatch[1].matchAll(/"(v16_[a-z0-9_]+)"/g)].map(m=>m[1]))].sort();
  assert.deepEqual(actual,expected);
  assert.equal(actual.length,31);
});
test("existing adapters remain disconnected until a real secure session bridge exists",()=> {
  assert.match(crm,/export function getCrmAccessConfig\(\): CrmAccessConfig \| null \{\s*return null;/s);
});
