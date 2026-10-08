import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { catalog } from "@/lib/catalog";
import { InternalSpaceHeader } from "@/app/components/internal-space-header";
import { AdvisorWorkspace } from "@/app/components/advisor-workspace";
import { CustomerReferralHub } from "@/app/components/customer-referral-hub";

import { resolveSpaceAccess } from "@/lib/internal/auth/server-access";
import {storeAction} from "@/lib/subscriptions/server";
import {redirect} from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MiAmarangoPage() {
  await requireChatGPTUser("/mi-amarango");
  const access = await resolveSpaceAccess();
  if (!access.advisor) {
    const own = await storeAction("identity");
    if (own.status === 200 && own.data.store) redirect("/mi-tienda");
    redirect("/mi-espacio");
  }
  const products = await catalog.listProducts({ visibleOnly: true });
  return (
    <>
      <InternalSpaceHeader eyebrow="ESPACIO AUTORIZADO" title="Mi Amarango" badge="Vista Asesor" />
      <CustomerReferralHub />
      {access.advisor && <AdvisorWorkspace products={products} />}
    </>
  );
}
