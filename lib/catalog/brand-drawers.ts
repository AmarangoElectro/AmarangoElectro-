import type { Product } from "./types";
import type { SubcategoryDefinition } from "./categories";
import { normalizeBrandFamily } from "./brand-family";

export type BrandDrawerDefinition = Pick<SubcategoryDefinition, "slug" | "title" | "icon"> & { brand: string };

/** Keep approved brand order and include every family present in this sector. */
export function buildBrandDrawers(products: readonly Product[], configured: readonly SubcategoryDefinition[] = []): BrandDrawerDefinition[] {
  const brands = new Map<string, BrandDrawerDefinition>();
  for (const item of configured) {
    if (item.brand) brands.set(normalizeBrandFamily(item.brand), { slug: item.slug, title: item.title, icon: item.icon, brand: item.brand });
  }
  for (const product of products) {
    const brand = product.brand.trim();
    const family = normalizeBrandFamily(brand);
    if (family && !brands.has(family)) brands.set(family, { slug: `marca-${encodeURIComponent(family)}`, title: brand, icon: "", brand });
  }
  return [...brands.values()];
}
