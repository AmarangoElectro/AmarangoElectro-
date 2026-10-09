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

/** Large brand scenes are reserved for established brands in a matching sector. */
export function isPremiumCatalogBrand(category: string, brand: string): boolean {
  const primary: Record<string, string[]> = {
    celulares: ["apple", "iphone", "samsung", "motorola", "xiaomi"],
    "smart-tv": ["samsung", "lg", "tcl", "philips", "sony"],
    audio: ["jbl", "sony", "aiwa", "lg"],
    gaming: ["playstation", "sony"],
    electrodomesticos: ["samsung", "lg"],
  };
  return primary[category]?.includes(normalizeBrandFamily(brand)) ?? false;
}
