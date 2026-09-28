import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
const auth=fs.readFileSync("app/chatgpt-auth.ts","utf8");
const admin=fs.readFileSync("app/administracion/page.tsx","utf8");
const advisor=fs.readFileSync("app/mi-amarango/page.tsx","utf8");
const retry=fs.readFileSync("app/auth-retry/page.tsx","utf8");
const internalHeader=fs.readFileSync("app/components/internal-space-header.tsx","utf8");
const siteHeader=fs.readFileSync("app/components/site-header.tsx","utf8");
const protectedLink=fs.readFileSync("app/components/protected-space-link.tsx","utf8");

test("repo has server-side authenticated-user primitive",()=>{
  assert.match(auth,/export async function requireChatGPTUser/);
  assert.match(auth,/await headers\(\)/);
  assert.match(auth,/redirect\(chatGPTSignInPath\(returnTo\)\)/);
});

test("administration requires authenticated user before workspace render",()=>{
  assert.match(admin,/await requireChatGPTUser\("\/administracion"\)/);
  assert.match(admin,/AdminConsolidatedWorkspace/);
});

test("Mi Amarango requires authenticated user before advisor workspace render",()=>{
  assert.match(advisor,/await requireChatGPTUser\("\/mi-amarango"\)/);
  assert.match(advisor,/AdvisorWorkspace/);
});

test("route layer does not invent role mapping from email or localStorage",()=>{
  for(const s of [admin,advisor]){
    assert.ok(!/email\s*===|email\.includes|localStorage/.test(s));
  }
});

test("administration route header no longer exposes recovery/lab badge",()=>{
  assert.ok(!/V4\.18A|recovery|V4\.18B|LAB/.test(admin));
  assert.match(admin,/badge="Acceso interno"/);
});

test("Sites runtime owns the reserved OAuth callback route",()=>{
  assert.equal(fs.existsSync("app/callback/page.tsx"),false);
  assert.match(auth,/const CALLBACK_PATH = "\/callback"/);
});

test("expired login retry is explicit, keeps exact return paths, and cannot auto-loop",()=>{
  assert.match(retry,/await getChatGPTUser\(\)/);
  assert.match(retry,/if \(user\) redirect\("\/mi-amarango"\)/);
  assert.match(retry,/chatGPTSignInPath\("\/mi-amarango"\)/);
  assert.match(retry,/chatGPTSignInPath\("\/administracion"\)/);
  assert.doesNotMatch(retry,/requireChatGPTUser|setTimeout|location\.|router\.|localStorage/);
});

test("internal spaces do not invoke the platform signout route",()=>{
  assert.doesNotMatch(internalHeader,/signout-with-chatgpt|chatGPTSignOutPath|Cerrar sesión/);
  assert.match(internalHeader,/href="\/"|href=\{"\/"\}/);
  assert.match(internalHeader,/sin cerrar tu acceso/);
});

test("hosted sign-out uses the exact platform route without return_to query",()=>{
  assert.match(auth,/export function chatGPTSignOutPath/);
  assert.match(auth,/return SIGN_OUT_PATH/);
  assert.doesNotMatch(auth,/SIGN_OUT_PATH\}\?return_to|SIGN_OUT_PATH\?return_to/);
});

test("identity-aware pages are forced dynamic per request",()=>{
  assert.match(admin,/export const dynamic = "force-dynamic"/);
  assert.match(advisor,/export const dynamic = "force-dynamic"/);
  assert.match(retry,/export const dynamic = "force-dynamic"/);
});

test("protected space navigation stays inside the active Sites session",()=>{
  assert.match(protectedLink,/from "next\/link"/);
  assert.match(protectedLink,/prefetch=\{false\}/);
  assert.match(siteHeader,/ProtectedSpaceLink href="\/mi-amarango"/);
  assert.match(siteHeader,/ProtectedSpaceLink href="\/administracion"/);
  assert.match(internalHeader,/ProtectedSpaceLink href="\/"/);
  assert.doesNotMatch(internalHeader,/signout-with-chatgpt|chatGPTSignOutPath|Cerrar sesión/);
});
