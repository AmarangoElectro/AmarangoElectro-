import type { ProductBridgeItem } from "./product-bridge";
import type { SourceAttribution } from "@/lib/growth/referral-growth-contract";

export interface SaleItemSnapshot {
  readonly snapshotVersion: "amarango-sale-item/v1";
  readonly productId: string;
  readonly productName: string;
  readonly model: string | null;
  readonly category: string;
  readonly priceUsedArs: number;
  readonly costUsedArs: number | null;
  readonly supplier: string | null;
  readonly priceUpdatedAt: string | null;
  readonly soldAt: string;
  readonly sourceAttribution: SourceAttribution | null;
}

export interface SaleItemSnapshotInput {
  product: Readonly<ProductBridgeItem>;
  priceUsedArs: number;
  costUsedArs?: number | null;
  supplier?: string | null;
  soldAt: string;
  sourceAttribution?: SourceAttribution | null;
}

/** Crea evidencia histórica inmutable. V3 no persiste ni confirma ventas. */
export function createSaleItemSnapshot(input: Readonly<SaleItemSnapshotInput>): SaleItemSnapshot {
  if (!input.product.id.trim()) throw new Error("productId estable requerido");
  if (!Number.isFinite(input.priceUsedArs) || input.priceUsedArs < 0) throw new Error("priceUsedArs inválido");
  if (!input.soldAt.trim()) throw new Error("soldAt requerido");

  return Object.freeze({
    snapshotVersion: "amarango-sale-item/v1",
    productId: input.product.id,
    productName: input.product.name,
    model: input.product.model,
    category: input.product.category,
    priceUsedArs: input.priceUsedArs,
    costUsedArs: input.costUsedArs ?? input.product.administrative?.costArs ?? null,
    supplier: input.supplier ?? input.product.administrative?.supplier ?? null,
    priceUpdatedAt: input.product.priceUpdatedAt,
    soldAt: input.soldAt,
    sourceAttribution: input.sourceAttribution ?? null,
  });
}
