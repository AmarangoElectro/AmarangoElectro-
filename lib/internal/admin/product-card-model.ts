import { priceAgeStatus, type PriceAgeResult } from "../finance/price-age";
import { adminProductContextActions } from "./admin-workspace";

export interface AdminCardProductInput {
  id: string;
  name: string;
  imageUrl: string | null;
  supplierImageUrl?: string | null;
  supplier: string | null;
  category: string | null;
  costArs: number | null;
  costUsd?: number | null;
  fxRate?: number | null;
  salePrice: number | null;
  visible: boolean;
  stockState: "in_stock" | "low_stock" | "out_of_stock";
  priceUpdatedAt: number | null;
  featured?: boolean;
  productOfDay?: boolean;
  interestFreeInstallments?: number | null;
  previousPrice?: number | null;
  features?: readonly string[];
}

export interface AdminProductCardModel {
  id: string;
  name: string;
  imageUrl: string | null;
  supplier: string;
  category: string;
  costArs: number | null;
  costUsd: number | null;
  fxRate: number | null;
  salePrice: number | null;
  visible: boolean;
  stockState: AdminCardProductInput["stockState"];
  priceAge: PriceAgeResult;
  badges: readonly string[];
  primaryActions: readonly typeof adminProductContextActions[number][];
  secondaryActions: readonly typeof adminProductContextActions[number][];
  moreActions: readonly typeof adminProductContextActions[number][];
}

export function buildAdminProductCardModel(input: AdminCardProductInput, now = Date.now()): AdminProductCardModel {
  const badges: string[] = [];
  if (!input.visible) badges.push("Oculto");
  if (input.stockState === "out_of_stock") badges.push("Sin stock");
  if (input.stockState === "low_stock") badges.push("Últimas unidades");
  if (input.featured) badges.push("Destacado");
  if (input.productOfDay) badges.push("Producto del día");
  if (input.interestFreeInstallments) badges.push(`${input.interestFreeInstallments} cuotas sin interés`);
  if (input.previousPrice && input.salePrice && input.previousPrice > input.salePrice) badges.push("Oferta");

  return Object.freeze({
    id: input.id,
    name: input.name,
    imageUrl: input.imageUrl,
    supplier: input.supplier ?? "Sin mayorista",
    category: input.category ?? "Sin categoría",
    costArs: input.costArs,
    costUsd: input.costUsd ?? null,
    fxRate: input.fxRate ?? null,
    salePrice: input.salePrice,
    visible: input.visible,
    stockState: input.stockState,
    priceAge: priceAgeStatus({ priceUpdatedAt: input.priceUpdatedAt }, now),
    badges: Object.freeze(badges),
    primaryActions: Object.freeze(adminProductContextActions.filter((action) => action.placement === "primary")),
    secondaryActions: Object.freeze(adminProductContextActions.filter((action) => action.placement === "secondary")),
    moreActions: Object.freeze(adminProductContextActions.filter((action) => action.placement === "more")),
  });
}

export const adminProductCardContract = Object.freeze({
  legacyCardInteractionParityRequired: true,
  premiumVisualLanguageRequired: true,
  productImageAlwaysVisible: true,
  supplierAndPriceAgeVisibleAtAGlance: true,
  costAndSaleVisibleToAdminOnly: true,
  imagePasteReplaceDownloadShareRequired: true,
  contextActionsStayOnCard: true,
  cardsVirtualizeAboveThreshold: true,
  publicStorefrontUsesDifferentCommercialCard: true,
});
