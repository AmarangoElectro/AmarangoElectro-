import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
const s=fs.readFileSync("lib/internal/auth/user-access-contract.ts","utf8");
test("four-role model",()=>{for(const r of ['"owner"','"admin"','"advisor"','"customer"']) assert.ok(s.includes(r));});
test("fail closed provider",()=>{assert.match(s,/NOT_CONNECTED_USER_ACCESS_PROVIDER/);assert.match(s,/status: "not_connected"/);});
test("admin requires capability and role",()=>{assert.match(s,/admin\.access/);assert.match(s,/role === "owner" \|\| access\.role === "admin"/);});
test("advisor requires role id capability",()=>{assert.match(s,/role === "advisor"/);assert.match(s,/Boolean\(access\.advisorId\)/);assert.match(s,/advisors\.access/);});
test("no direct privileged/browser authority",()=>{for(const x of ["localStorage",".from(","auth.admin"]) assert.ok(!s.includes(x));});
