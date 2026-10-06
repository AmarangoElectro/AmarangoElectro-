import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

test("operational health route checks the secure bridge without exposing secrets", async () => {
  const route = await source("app/api/v16/health/route.ts");

  assert.match(route, /getChatGPTUser/);
  assert.match(route, /v16_chatgpt_operational_bridge/);
  assert.match(route, /v16_get_active_financing_mode/);
  assert.match(route, /environmentConfigured/);
  assert.match(route, /backendReachable/);
  assert.match(route, /activeFinancingMode/);
  assert.doesNotMatch(route, /secret\s*:/);
  assert.doesNotMatch(route, /SUPABASE_SECRET_KEY\s*[,}]/);
});

test("operational health route is read-only", async () => {
  const route = await source("app/api/v16/health/route.ts");

  assert.doesNotMatch(route, /v16_confirm_sale|v16_register_customer_payment|v16_create_client|v16_set_active_financing_mode/);
  assert.doesNotMatch(route, /insert\s+into|update\s+public\.|delete\s+from/i);
});
