import { getChatGPTUser } from "@/app/chatgpt-auth";
import { redirect } from "next/navigation";
import { backendFetch } from "@/lib/server/backend";
import { NO_SPACE_ACCESS, parseSpaceAccess, type SpaceAccess } from "./space-entry";
export { NO_SPACE_ACCESS, type SpaceAccess } from "./space-entry";

export async function resolveSpaceAccess(): Promise<SpaceAccess> {
  const user = await getChatGPTUser();
  if (!user) return NO_SPACE_ACCESS;
  try {
    const response = await backendFetch("/rest/v1/rpc/v16_chatgpt_space_access", { method: "POST", body: JSON.stringify({ p_email: user.email }) });
    if (!response.ok) return NO_SPACE_ACCESS;
    return parseSpaceAccess(await response.json());
  } catch { return NO_SPACE_ACCESS; }
}

export async function requireSpaceAccess(space: "admin" | "owner" | "advisor") {
  const access = await resolveSpaceAccess();
  if (!access[space]) redirect("/acceso-denegado");
  return access;
}
