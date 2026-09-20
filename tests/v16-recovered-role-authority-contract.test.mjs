import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
const handoff=fs.readFileSync("/mnt/data/AMARANGOELECTRO-V16-MASTER-HANDOFF-CHAT-NUEVO-20260915.md","utf8");
test("platform role authority is v16_user_access",()=>{assert.match(handoff,/PLATFORM:\s*`v16_user_access`/);assert.match(handoff,/NO reemplazar `v16_user_access`/);});
test("advisor architecture binds Auth to v16_user_access role and advisor_id",()=>{assert.match(handoff,/Auth → v16_user_access\(role asesor, advisor_id\)/);});
test("security contract requires role capabilities before access",()=>{assert.match(handoff,/Auth → sesión → role\/capabilities → acceso/);assert.match(handoff,/Cliente no entra Admin aunque conozca URL/);});
test("workspace RBAC is separate and unfinished",()=>{assert.match(handoff,/WORKSPACE:\s*`v16_workspace_memberships`/);assert.match(handoff,/los otros 3 helpers NO quedaron creados/);});
