import { getChatGPTUser } from "@/app/chatgpt-auth";
import {
  V16_SECURE_RPC_ALLOWLIST,
  type V16SecureRpcName,
} from "@/lib/internal/auth/secure-rpc-session-bridge-contract";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "https://zctaukyrhsmpjkcddcqq.supabase.co";
const ALLOWLIST = new Set<string>(V16_SECURE_RPC_ALLOWLIST);
const AAL2_RPCS = new Set<V16SecureRpcName>([
  "v16_reverse_customer_payment",
  "v16_reverse_cash_movement",
  "v16_set_active_financing_mode",
]);

function json(status: number, body: Record<string, unknown>) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return false;
  return request.headers.get("sec-fetch-site") !== "cross-site";
}

function knownFailure(message: string) {
  if (message.includes("step_up_required")) return { http: 403, status: "step_up_required" } as const;
  if (message.includes("authentication_required") || message.includes("identity_not_mapped")) {
    return { http: 401, status: "unauthenticated" } as const;
  }
  if (message.includes("not_authorized") || message.includes("_not_authorized")) {
    return { http: 403, status: "unauthorized" } as const;
  }
  if (message.includes("scope_denied") || message.includes("outside_advisor_scope")) {
    return { http: 403, status: "unauthorized" } as const;
  }
  if (message.includes("idempotency_key_conflict")) {
    return { http: 409, status: "error", message: "Idempotency key conflicts with another request" } as const;
  }
  return null;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json(403, { status: "unauthorized" });
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return json(415, { status: "error", message: "application/json required" });
  }

  const user = await getChatGPTUser();
  if (!user) return json(401, { status: "unauthenticated" });

  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) return json(503, { status: "not_connected" });

  let payload: { rpc?: string; args?: Record<string, unknown> };
  try {
    payload = await request.json() as { rpc?: string; args?: Record<string, unknown> };
  } catch {
    return json(400, { status: "error", message: "Invalid JSON" });
  }

  const rpc = String(payload.rpc ?? "") as V16SecureRpcName;
  if (!ALLOWLIST.has(rpc)) return json(403, { status: "unauthorized" });
  const args = payload.args && typeof payload.args === "object" && !Array.isArray(payload.args) ? payload.args : {};

  // The current application session proves identity but exposes no trusted
  // AAL2 assertion. Sensitive RPCs remain fail-closed until that exists.
  if (AAL2_RPCS.has(rpc)) return json(403, { status: "step_up_required" });

  let upstream: Response;
  try {
    upstream = await fetch(`${SUPABASE_URL}/rest/v1/rpc/v16_chatgpt_operational_bridge`, {
      method: "POST",
      headers: { apikey: secret, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ p_email: user.email, p_rpc: rpc, p_args: args, p_aal: "aal1" }),
      cache: "no-store",
    });
  } catch {
    return json(503, { status: "not_connected" });
  }

  if (!upstream.ok) {
    let upstreamMessage = "";
    try {
      const body = await upstream.json() as { message?: string; code?: string };
      upstreamMessage = body.message ?? body.code ?? "";
    } catch {}
    const failure = knownFailure(upstreamMessage);
    if (failure) return json(failure.http, { status: failure.status, ...("message" in failure ? { message: failure.message } : {}) });
    if (upstream.status === 404) return json(503, { status: "not_connected" });
    return json(upstream.status >= 500 ? 502 : 400, { status: "error", message: "Operational RPC failed" });
  }

  try {
    return json(200, { status: "ok", data: await upstream.json() });
  } catch {
    return json(502, { status: "error", message: "Operational RPC returned a non-JSON response" });
  }
}
