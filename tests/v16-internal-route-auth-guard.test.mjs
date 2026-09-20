import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
const auth=fs.readFileSync("app/chatgpt-auth.ts","utf8");
const admin=fs.readFileSync("app/administracion/page.tsx","utf8");
const advisor=fs.readFileSync("app/mi-amarango/page.tsx","utf8");
test("repo has server-side authenticated-user primitive",()=>{assert.match(auth,/export async function requireChatGPTUser/);assert.match(auth,/await headers\(\)/);assert.match(auth,/redirect\(chatGPTSignInPath\(returnTo\)\)/);});
test("administration requires authenticated user before workspace render",()=>{assert.match(admin,/await requireChatGPTUser\("\/administracion"\)/);assert.match(admin,/AdminConsolidatedWorkspace/);});
test("Mi Amarango requires authenticated user before advisor workspace render",()=>{assert.match(advisor,/await requireChatGPTUser\("\/mi-amarango"\)/);assert.match(advisor,/AdvisorWorkspace/);});
test("route layer does not invent role mapping from email or localStorage",()=>{for(const s of [admin,advisor]){assert.ok(!/email\s*===|email\.includes|localStorage/.test(s));}});
test("administration route header no longer exposes recovery/lab badge",()=>{assert.ok(!/V4\.18A|recovery|V4\.18B|LAB/.test(admin));assert.match(admin,/badge="Acceso interno"/);});
