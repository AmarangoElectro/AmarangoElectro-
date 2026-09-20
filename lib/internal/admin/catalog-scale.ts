export const adminCatalogScaleContract = Object.freeze({
  minimumSupportedProducts: 1_200,
  designTargetProducts: 2_500,
  initialCardBatch: 36,
  nextCardBatch: 36,
  virtualizationThreshold: 120,
  overscanCards: 8,
  searchTargetMs: 100,
  filtersAreClientSideProjectionOnlyUntilBackendAudit: true,
  neverRenderEntireLargeCatalogAtOnce: true,
  preserveScrollAndFilters: true,
  bulkActionsRequired: true,
});

export type AdminStockFilter = "all" | "in_stock" | "low_stock" | "out_of_stock";
export type AdminVisibilityFilter = "all" | "visible" | "hidden";
export type AdminPriceAgeFilter = "all" | "green" | "yellow" | "red" | "unknown";

export interface ScalableAdminProduct {
  id: string;
  name: string;
  category: string | null;
  subcategory?: string | null;
  supplier: string | null;
  salePrice: number | null;
  visible: boolean;
  stockState: Exclude<AdminStockFilter, "all">;
  priceAge: Exclude<AdminPriceAgeFilter, "all">;
}

export interface AdminCatalogFilterState {
  query?: string;
  category?: string | null;
  subcategory?: string | null;
  supplier?: string | null;
  stock?: AdminStockFilter;
  visibility?: AdminVisibilityFilter;
  priceAge?: AdminPriceAgeFilter;
  maxPrice?: number | null;
}

function normalize(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

export function filterAdminCatalog<T extends ScalableAdminProduct>(
  products: readonly T[],
  state: AdminCatalogFilterState,
): readonly T[] {
  const q = normalize(state.query ?? "");
  const category = normalize(state.category ?? "");
  const subcategory = normalize(state.subcategory ?? "");
  const supplier = normalize(state.supplier ?? "");
  const maxPrice = Number.isFinite(state.maxPrice ?? NaN) ? Number(state.maxPrice) : null;

  return products.filter((product) => {
    if (q && !normalize(`${product.name} ${product.category ?? ""} ${product.supplier ?? ""}`).includes(q)) return false;
    if (category && normalize(product.category ?? "") !== category) return false;
    if (subcategory && normalize(product.subcategory ?? "") !== subcategory) return false;
    if (supplier && normalize(product.supplier ?? "") !== supplier) return false;
    if (state.stock && state.stock !== "all" && product.stockState !== state.stock) return false;
    if (state.visibility === "visible" && !product.visible) return false;
    if (state.visibility === "hidden" && product.visible) return false;
    if (state.priceAge && state.priceAge !== "all" && product.priceAge !== state.priceAge) return false;
    if (maxPrice !== null && (product.salePrice === null || product.salePrice > maxPrice)) return false;
    return true;
  });
}

export function getAdminCatalogWindow<T>(
  products: readonly T[],
  loadedCount: number,
): readonly T[] {
  const safeLoaded = Math.max(adminCatalogScaleContract.initialCardBatch, Math.floor(loadedCount || 0));
  return products.slice(0, safeLoaded);
}

export function nextAdminCatalogWindow(currentLoaded: number, total: number): number {
  return Math.min(total, Math.max(adminCatalogScaleContract.initialCardBatch, currentLoaded) + adminCatalogScaleContract.nextCardBatch);
}
