import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { InternalSpaceHeader } from "@/app/components/internal-space-header";
import { CatalogMatchReview } from "@/components/internal/admin/catalog-match-review";
import { getCatalogMatchCandidates } from "@/lib/internal/catalog/provider-offer-matcher";

export default async function CatalogMatchReviewPage() {
  const user = await requireChatGPTUser("/administracion/catalogo/coincidencias");
  const candidates = getCatalogMatchCandidates();
  const friendlyName = user.fullName?.split(/\s+/)[0] ?? user.email.split("@")[0];

  return (
    <>
      <InternalSpaceHeader eyebrow="CATÁLOGO INTERNO" title="Coincidencias de productos" badge="Revisión humana" userName={friendlyName} />
      <CatalogMatchReview candidates={candidates} />
    </>
  );
}
