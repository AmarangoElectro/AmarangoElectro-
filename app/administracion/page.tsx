import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { InternalSpaceHeader } from "@/app/components/internal-space-header";
import { AdminConsolidatedWorkspace } from "@/app/components/admin-consolidated-workspace";
import { requireSpaceAccess } from "@/lib/internal/auth/server-access";
import { catalog } from "@/lib/catalog";
import { v411PilotAdminProducts } from "@/components/internal/admin/v411-pilot-products";

export const dynamic = "force-dynamic";

export default async function AdministracionPage() {
  await requireChatGPTUser("/administracion");
  await requireSpaceAccess("admin");
  const products = await catalog.listProducts({ visibleOnly: true });
  const ids = new Set(products.map(product=>product.id));
  const administrativeFacts = Object.fromEntries(v411PilotAdminProducts.filter(product=>ids.has(product.id)).map(product=>[product.id,{supplier:product.supplier,costArs:product.costArs,priceUpdatedAt:product.priceUpdatedAt}]));
  return <><InternalSpaceHeader eyebrow="CENTRO INTERNO" title="Administración" badge="Acceso interno" /><AdminConsolidatedWorkspace catalogProducts={products} administrativeFacts={administrativeFacts} /></>;
}
