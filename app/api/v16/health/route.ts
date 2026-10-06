import { getChatGPTUser } from "@/app/chatgpt-auth";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "https://zctaukyrhsmpjkcddcqq.supabase.co";

function json(status: number, body: Record<string, unknown>) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return json(401, { status: "unauthenticated" });

  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) {
    return json(503, {
      status: "not_connected",
      environmentConfigured: false,
    });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${SUPABASE_URL}/rest/v1/rpc/v16_chatgpt_operational_bridge`, {
      method: "POST",
      headers: {
        apikey: secret,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        p_email: user.email,
        p_rpc: "v16_get_active_financing_mode",
        p_args: {},
        p_aal: "aal1",
      }),
      cache: "no-store",
    });
  } catch {
    return json(503, {
      status: "not_connected",
      environmentConfigured: true,
    });
  }

  if (!upstream.ok) {
    return json(502, {
      status: "error",
      environmentConfigured: true,
      backendReachable: true,
    });
  }

  try {
    const rows = await upstream.json() as Array<{
      active_financing_mode?: string;
      policy_version?: string;
    }>;
    const active = rows[0] ?? {};
    return json(200, {
      status: "ok",
      environmentConfigured: true,
      backendReachable: true,
      activeFinancingMode: active.active_financing_mode ?? null,
      policyVersion: active.policy_version ?? null,
    });
  } catch {
    return json(502, {
      status: "error",
      environmentConfigured: true,
      backendReachable: true,
    });
  }
}
