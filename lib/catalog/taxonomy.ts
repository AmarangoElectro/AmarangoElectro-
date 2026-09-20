import { categories, type CategoryDefinition, type SubcategoryDefinition } from "./categories";

export interface TaxonomyMatch {
  category: CategoryDefinition;
  subcategory: SubcategoryDefinition | null;
  matchedAlias: string;
  confidence: "explicit-alias" | "fallback";
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const aliasIndex = categories.flatMap((category) => {
  const categoryAliases = [category.title, category.slug, ...(category.legacyAliases ?? [])].map((alias) => ({
    normalized: normalize(alias),
    alias,
    category,
    subcategory: null as SubcategoryDefinition | null,
  }));
  const subcategoryAliases = category.subcategories.flatMap((subcategory) =>
    [subcategory.title, subcategory.slug, ...(subcategory.legacyAliases ?? [])].map((alias) => ({
      normalized: normalize(alias),
      alias,
      category,
      subcategory,
    })),
  );
  return [...subcategoryAliases, ...categoryAliases];
}).sort((a, b) => b.normalized.length - a.normalized.length);

export function resolveTaxonomyLabel(value: string): TaxonomyMatch | null {
  const candidate = normalize(value);
  if (!candidate) return null;
  const exact = aliasIndex.find((entry) => candidate === entry.normalized || candidate.includes(entry.normalized));
  if (exact) return { category: exact.category, subcategory: exact.subcategory, matchedAlias: exact.alias, confidence: "explicit-alias" };
  return null;
}

export function getFallbackTaxonomyMatch(): TaxonomyMatch {
  const fallback = categories.find((category) => category.isFallback);
  if (!fallback) throw new Error("V16 taxonomy requires an explicit fallback category");
  return { category: fallback, subcategory: null, matchedAlias: "fallback", confidence: "fallback" };
}

export const taxonomyGovernance = Object.freeze({
  minimumCatalogScale: 1_200,
  navigationMustBeHierarchical: true,
  fallbackMustNotAbsorbKnownAliases: true,
  bannerPerImportantCategory: true,
  bannerPerImportantSubcategory: true,
  noAutomaticProductionReclassification: true,
  reclassificationRequiresAdminPreview: true,
});
