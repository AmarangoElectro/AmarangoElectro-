import { resolveSpaceAccess } from "@/lib/internal/auth/server-access";
import { privateJson } from "@/lib/server/backend";
export async function GET() { return privateJson(await resolveSpaceAccess()); }
