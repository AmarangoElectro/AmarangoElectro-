import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { InternalSpaceHeader } from "@/app/components/internal-space-header";
import { AdminConsolidatedWorkspace } from "@/app/components/admin-consolidated-workspace";

export default async function AdministracionPage() {
  const user = await requireChatGPTUser("/administracion");
  const friendlyName = user.fullName?.split(/\s+/)[0] ?? user.email.split("@")[0];
  return <><InternalSpaceHeader eyebrow="CENTRO INTERNO" title="Administración" badge="Acceso interno" userName={friendlyName} /><AdminConsolidatedWorkspace /></>;
}
