import labEvidence from "@/fixtures/amarango-os-product-bridge-v21-lab.json";
import { v411PilotProducts } from "@/lib/catalog/audited-pilot-adapter";
import type { AdminCardProductInput } from "@/lib/internal/admin/product-card-model";

export type V411AdminGridProduct = AdminCardProductInput & {
  stockState: "in_stock" | "low_stock" | "out_of_stock";
};

const administrativeById = new Map(labEvidence.map((row) => [String(row.id), row]));

/** Datos administrativos del fixture de laboratorio. No consulta red ni guarda. */
export const v411PilotAdminProducts: readonly V411AdminGridProduct[] = Object.freeze(
  v411PilotProducts.map((product) => {
    const sourceId = product.id.replace(/^v411-evidence:/, "");
    const internal = administrativeById.get(sourceId);
    return Object.freeze({
      id: product.id,
      name: product.name,
      imageUrl: product.image?.src ?? null,
      supplier: internal?.supplier ?? null,
      category: product.subcategory ?? product.category,
      costArs: internal?.cost ?? null,
      salePrice: product.price?.amount ?? null,
      visible: product.visible,
      stockState: product.stock.status === "out_of_stock" ? "out_of_stock" : "in_stock",
      priceUpdatedAt: internal?.updated ? Date.parse(`${internal.updated}T00:00:00Z`) : null,
      features: product.features,
    });
  }),
);
