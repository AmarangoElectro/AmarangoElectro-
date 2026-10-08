import { resolveSpaceAccess } from "@/lib/internal/auth/server-access";
import { privateJson } from "@/lib/server/backend";
import { storeAction } from "@/lib/subscriptions/server";
export async function GET() {
  const access=await resolveSpaceAccess();
  const own=await storeAction("identity");
  return privateJson({...access,subscriber:own.status===200&&!!own.data.store});
}
