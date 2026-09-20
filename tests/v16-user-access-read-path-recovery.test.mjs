import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
const handoff=fs.readFileSync("/mnt/data/AMARANGOELECTRO-V16-MASTER-HANDOFF-CHAT-NUEVO-20260915.md","utf8");
const advisors=fs.readFileSync("components/internal/admin/advisors-panel.tsx","utf8");
test("v16_user_access is platform authority but no current-role RPC is documented",()=>{assert.ok(handoff.includes("PLATFORM:\n`v16_user_access`"));assert.ok(!/v16_(?:get|current|resolve)_user_access/i.test(handoff));});
test("advisor UI forbids direct v16_user_access reads",()=>{assert.ok(advisors.includes("`v16_advisor_client_portfolio`, `v16_user_access` ni"));});
test("recovered UI documents missing secure identity selector",()=>{assert.ok(advisors.includes("fuente"));assert.ok(advisors.includes("segura de `user_id`/`enrollment_id` en el repo"));assert.ok(advisors.includes("que no existe"));});
