import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { catalog } from "@/lib/catalog";
import { InternalSpaceHeader } from "@/app/components/internal-space-header";
import { AdvisorWorkspace } from "@/app/components/advisor-workspace";
import { CustomerReferralHub } from "@/app/components/customer-referral-hub";

import { resolveSpaceAccess } from "@/lib/internal/auth/server-access";

export const dynamic = "force-dynamic";

export default async function MiAmarangoPage() {
  await requireChatGPTUser("/mi-amarango");
  const access = await resolveSpaceAccess();
  const products = await catalog.listProducts({ visibleOnly: true });
  return (
    <>
      <InternalSpaceHeader eyebrow="ESPACIO AUTORIZADO" title="Mi Amarango" badge="Vista Asesor" />
      <CustomerReferralHub />
      {access.advisor && <AdvisorWorkspace products={products} />}
    </>
  );
}
