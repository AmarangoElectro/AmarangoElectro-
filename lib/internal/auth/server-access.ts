import { getChatGPTUser } from "@/app/chatgpt-auth";
import { redirect } from "next/navigation";
import { backendFetch } from "@/lib/server/backend";

export type SpaceAccess = { role: "owner" | "admin" | "asesor" | "cliente" | null; admin: boolean; owner: boolean; advisor: boolean };
export const NO_SPACE_ACCESS: SpaceAccess = { role: null, admin: false, owner: false, advisor: false };

export async function resolveSpaceAccess(): Promise<SpaceAccess> {
  const user = await getChatGPTUser();
  if (!user) return NO_SPACE_ACCESS;
  try {
    const response = await backendFetch("/rest/v1/rpc/v16_chatgpt_space_access", { method: "POST", body: JSON.stringify({ p_email: user.email }) });
    if (!response.ok) return NO_SPACE_ACCESS;
    return await response.json() as SpaceAccess;
  } catch { return NO_SPACE_ACCESS; }
}

export async function requireSpaceAccess(space: "admin" | "owner" | "advisor") {
  const access = await resolveSpaceAccess();
  if (!access[space]) redirect("/acceso-denegado");
  return access;
}
