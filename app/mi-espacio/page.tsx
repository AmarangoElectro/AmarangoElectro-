import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { ProtectedSpaceLink } from "@/app/components/protected-space-link";
import { resolveSpaceAccess } from "@/lib/internal/auth/server-access";
import { spaceEntryDestination } from "@/lib/internal/auth/space-entry";
import { storeAction } from "@/lib/subscriptions/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MySpaceEntryPage() {
  await requireChatGPTUser("/mi-espacio");
  const access = await resolveSpaceAccess();
  // Internal staff retain their main workspace even when they also own a test store.
  if (access.admin || access.owner || access.advisor) redirect(spaceEntryDestination(access, false));
  const own = await storeAction("identity");
  if (own.status !== 200) {
    return <main className="error-state"><p className="eyebrow orange">MI ESPACIO</p><h1>No pudimos verificar tu espacio.</h1><p>Volvé a intentar para abrir la vista correspondiente a tu cuenta.</p><div className="error-state-actions"><ProtectedSpaceLink href="/mi-espacio">Reintentar</ProtectedSpaceLink><ProtectedSpaceLink href="/">Volver a la tienda</ProtectedSpaceLink></div></main>;
  }
  redirect(spaceEntryDestination(access, !!own.data.store));
}
