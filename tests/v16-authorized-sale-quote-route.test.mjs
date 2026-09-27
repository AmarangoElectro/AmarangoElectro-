import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

test("authorized sale quote route keeps private pricing facts server-only", async () => {
  const route = await source("app/api/v16/sale-quote/route.ts");
  assert.match(route, /getChatGPTUser/);
  assert.match(route, /v16_resolve_operational_product_quote_source/);
  assert.match(route, /v16_chatgpt_issue_authorized_sale_quote/);
  assert.match(route, /SUPABASE_SECRET_KEY/);
  assert.match(route, /approved commercial DTO/);
  const responseBlock = route.slice(route.indexOf("approved commercial DTO"));
  assert.doesNotMatch(responseBlock, /costArs|cost_ars|supplier|mayorista|margin|markup/i);
  assert.doesNotMatch(route, /localStorage|advisor_id/);
});

test("product quote source resolver is service-role only and maps known V16 namespaces", async () => {
  const sql = await source("supabase/migrations/20260927_v16_core_operational_prepared.sql");
  assert.match(sql, /v16_resolve_operational_product_quote_source/);
  assert.match(sql, /auth\.jwt\(\)->>'role'/);
  assert.match(sql, /v16-cell:%/);
  assert.match(sql, /electro\|exp63\|exp5\|exp31\|exp50\|exp99\|cohort0\|v411-evidence/);
  assert.match(sql, /else\s+raise exception 'unsupported_product_id_namespace'/);
  assert.match(sql, /grant execute on function public\.v16_resolve_operational_product_quote_source\(text\) to service_role/);
  assert.match(sql, /revoke execute on function public\.v16_resolve_operational_product_quote_source\(text\) from public,anon,authenticated/);
});

test("prepared SQL contains no malformed single-dollar PLpgSQL delimiters", async () => {
  const sql = await source("supabase/migrations/20260927_v16_core_operational_prepared.sql");
  assert.doesNotMatch(sql, / as \$\n/);
  assert.doesNotMatch(sql, /\nend \$;\n/);
  assert.doesNotMatch(sql, /\\"/);
});
