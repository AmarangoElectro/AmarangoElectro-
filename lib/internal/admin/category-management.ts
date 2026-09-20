import { activeCategories, compatibilityCategories, getBannerSlots, getPlannedSubcategories } from "../../catalog/categories";

export const adminCategoryManagementContract = Object.freeze({
  minimumCatalogScale: 1_200,
  hierarchicalFiltersRequired: true,
  categoryAndSubcategoryFiltersRequired: true,
  bannerAssetReplacementWithoutCodeChange: true,
  previewBeforeBulkReclassification: true,
  neverAutoPublishReclassifiedProducts: true,
  fallbackCategoryRequiresProgressiveCleanup: true,
});

export function getAdminCategoryOverview() {
  const slots = getBannerSlots();
  return {
    categoryCount: activeCategories.length,
    compatibilityRouteCount: compatibilityCategories.length,
    subcategoryCount: activeCategories.reduce((count, category) => count + category.subcategories.filter((subcategory) => (subcategory.navigationStatus ?? "active") === "active").length, 0),
    plannedSubcategoryCount: activeCategories.reduce((count, category) => count + getPlannedSubcategories(category).length, 0),
    bannerSlots: slots.length,
    readyBannerSlots: slots.filter((slot) => slot.imageStatus === "ready").length,
    awaitingBannerSlots: slots.filter((slot) => slot.imageStatus === "awaiting-image").length,
    fallbackCategory: activeCategories.find((category) => category.isFallback)?.slug ?? null,
  };
}
