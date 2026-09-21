import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { catalog } from "@/lib/catalog";
import { InternalSpaceHeader } from "@/app/components/internal-space-header";
import { AdvisorWorkspace } from "@/app/components/advisor-workspace";

export default async function MiAmarangoPage() {
  const user = await requireChatGPTUser("/mi-amarango");
  const products = await catalog.listProducts({ visibleOnly: true });
  const friendlyName = user.fullName?.split(/\s+/)[0] ?? user.email.split("@")[0];
  return <><InternalSpaceHeader eyebrow="ESPACIO AUTORIZADO" title="Mi Amarango" badge="Vista Asesor" userName={friendlyName} /><AdvisorWorkspace products={products} /></>;
}
