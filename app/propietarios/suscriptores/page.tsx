import type { Metadata } from "next";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { InternalSpaceHeader } from "@/app/components/internal-space-header";
import { SubscribersWorkspace } from "./subscribers-workspace";

export const metadata: Metadata = {
  title: "Suscriptores · Propietarios · AmarangoElectro",
  description: "Gestión aislada de suscriptores, familia/equipo, planes e identidad de tienda.",
};

export default async function SubscribersPage() {
  await requireChatGPTUser("/propietarios/suscriptores");

  return (
    <>
      <InternalSpaceHeader
        eyebrow="PLATAFORMA · PROPIETARIOS"
        title="Suscriptores"
        badge="Sandbox seguro"
      />
      <SubscribersWorkspace />
    </>
  );
}
