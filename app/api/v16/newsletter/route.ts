import { getChatGPTUser } from "@/app/chatgpt-auth";
import { resolveSpaceAccess } from "@/lib/internal/auth/server-access";
import { backendFetch, privateJson, sameOrigin } from "@/lib/server/backend";

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user?.id) return privateJson({ status: "unauthenticated" }, 401);
  const admin = new URL(request.url).searchParams.get("admin") === "1";
  if (admin && !(await resolveSpaceAccess()).admin) return privateJson({ status: "unauthorized" }, 403);
  const filter = admin ? "&order=updated_at.desc&limit=200" : `&site_user_id=eq.${encodeURIComponent(user.id)}`;
  try {
    const response = await backendFetch(`/rest/v1/v16_newsletter_subscriptions?select=email,active,consented_at,updated_at${filter}`);
    if (!response.ok) throw new Error();
    return privateJson({ status: "ok", email: admin ? undefined : user.email, data: await response.json() });
  } catch { return privateJson({ status: "not_connected" }, 503); }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return privateJson({ status: "unauthorized" }, 403);
  const user = await getChatGPTUser();
  if (!user?.id) return privateJson({ status: "unauthenticated" }, 401);
  let consent: unknown;
  try { consent = (await request.json()).consent; } catch { return privateJson({ status: "invalid" }, 400); }
  if (typeof consent !== "boolean") return privateJson({ status: "invalid" }, 400);
  const timestamp = new Date().toISOString();
  try {
    const response = await backendFetch("/rest/v1/v16_newsletter_subscriptions?on_conflict=site_user_id", {
      method: "POST", headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({ site_user_id: user.id, email: user.email.toLowerCase(), active: consent, consented_at: consent ? timestamp : null, updated_at: timestamp }),
    });
    if (!response.ok) throw new Error();
    return privateJson({ status: "ok", active: consent });
  } catch { return privateJson({ status: "not_connected" }, 503); }
}
