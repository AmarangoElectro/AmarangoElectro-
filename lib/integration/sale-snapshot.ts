import type { ProductBridgeItem } from "./product-bridge";
import type { SourceAttribution } from "@/lib/growth/referral-growth-contract";
import type { ActiveFinancingMode } from "@/lib/internal/finance/active-financing-mode-contract";

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

export interface ImmutableCommercialSaleSnapshot {
  readonly snapshotVersion: "amarango-commercial-sale/v16";
  readonly financingMode: ActiveFinancingMode;
  readonly cashPrice: number;
  readonly initialPayment: number;
  readonly installments: number;
  readonly installmentAmount: number;
  readonly financedTotal: number;
  readonly commission: number;
  readonly commissionPolicyVersion: string;
  readonly pricingPolicyVersion: string;
  readonly soldAt: string;
}

export function createImmutableCommercialSaleSnapshot(input: Omit<ImmutableCommercialSaleSnapshot, "snapshotVersion">): ImmutableCommercialSaleSnapshot {
  for (const [field, value] of Object.entries(input)) {
    if (typeof value === "number" && (!Number.isFinite(value) || value < 0)) throw new Error(`${field} inválido`);
  }
  if (!Number.isInteger(input.installments) || input.installments < 1) throw new Error("installments inválido");
  if (!input.commissionPolicyVersion.trim() || !input.pricingPolicyVersion.trim() || !input.soldAt.trim()) throw new Error("versiones y soldAt requeridos");
  return Object.freeze({ snapshotVersion: "amarango-commercial-sale/v16", ...input });
}
