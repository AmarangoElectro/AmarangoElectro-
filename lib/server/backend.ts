/** Privileged backend transport; import only from server modules. */
export async function backendFetch(path: string, init: RequestInit = {}) {
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("backend_not_configured");
  if (!path.startsWith("/") || path.startsWith("//")) throw new Error("invalid_backend_path");
  return fetch(`${url}${path}`, {
    ...init,
    headers: { apikey: secret, "Content-Type": "application/json", ...init.headers },
    cache: "no-store",
    signal: init.signal ?? AbortSignal.timeout(15000),
  });
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return (!origin || origin === new URL(request.url).origin) && request.headers.get("sec-fetch-site") !== "cross-site";
}
export function privateJson(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
