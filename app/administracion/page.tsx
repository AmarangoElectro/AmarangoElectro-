import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { InternalSpaceHeader } from "@/app/components/internal-space-header";
import { AdminConsolidatedWorkspace } from "@/app/components/admin-consolidated-workspace";

export default async function AdministracionPage() {
  await requireChatGPTUser("/administracion");
  return <><InternalSpaceHeader eyebrow="CENTRO INTERNO" title="Administración" badge="Acceso interno" /><AdminConsolidatedWorkspace /></>;
}
