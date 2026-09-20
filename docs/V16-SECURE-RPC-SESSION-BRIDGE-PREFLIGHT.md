# V16 — Secure RPC Session Bridge Preflight

Status: `PASS_LOCAL_V16_SECURE_RPC_SESSION_BRIDGE_PREFLIGHT + STOP`

## Physical facts

- `requireChatGPTUser()` authenticates the application session from trusted server request headers.
- The recovered RPC adapters expect a Supabase authenticated access token.
- `getCrmAccessConfig()` currently returns `null`, so CRM/Cobranzas/Payment History/Reports/Provider Inbox/Caja/Entregas/Asesores fail closed before network.
- The recovered application session is **not** itself a Supabase Auth session and must not be treated as one.

## Approved architecture boundary

Future live integration must use a same-origin server boundary:

`browser → authenticated application server → current user identity mapping → v16_user_access → capability/AAL enforcement → allowlisted V16 RPC → sanitized response`

The browser must not receive a privileged database credential as a workaround.

A service-level credential must not be used to bypass user-scoped RLS, `v16_user_access`, portfolio scoping, or AAL2 requirements.

For sensitive operations, the bridge must preserve the real authenticated-user/AAL semantics; if that cannot be proven, return `step_up_required` / `unauthorized` / `not_connected`.

This preflight intentionally does **not** implement a Supabase Auth exchange, RPC route, SQL, RLS, secrets, or deploy.
