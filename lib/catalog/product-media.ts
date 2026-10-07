import type { Product } from "./types";
import { backendFetch } from "@/lib/server/backend";

export type ProductMedia = { product_id: string; asset_id: string; source_asset_id: string | null; features: string[]; specifications: Record<string,string>; updated_at: string };
export async function applyProductMedia(products: Product[]): Promise<Product[]> {
  try {
    const response = await backendFetch("/rest/v1/v16_product_media?select=product_id,asset_id,source_asset_id,features,specifications,updated_at&limit=2000");
    if (!response.ok) return products;
    const media = new Map((await response.json() as ProductMedia[]).map(row => [row.product_id,row]));
    return products.map(product => {
      const row = media.get(product.id);
      return row ? { ...product, image: { src: `/api/v16/product-photo/${row.asset_id}`, alt: product.name }, supplierImage: row.source_asset_id ? {src:`/api/v16/product-photo/${row.source_asset_id}`,alt:product.name} : product.image, features: row.features, specifications: row.specifications } : product;
    });
  } catch { return products; }
}
