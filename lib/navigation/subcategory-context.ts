import type { CategoryDefinition, SubcategoryDefinition } from "@/lib/catalog/categories";

export type SubcategoryContextInput = Readonly<{
  sector?: string;
  brand?: string;
}>;

export type SubcategoryContextItem = Readonly<{
  slug: string;
  title: string;
  icon: string;
  href: string;
  selected: boolean;
  kind: "all" | "sector" | "brand";
}>;

function isActive(subcategory: SubcategoryDefinition) {
  return (subcategory.navigationStatus ?? "active") === "active";
}

function subcategoryHref(categorySlug: string, subcategory: SubcategoryDefinition) {
  if (subcategory.brand) {
    return `/categoria/${categorySlug}?marca=${encodeURIComponent(subcategory.brand)}#catalogo`;
  }
  return `/categoria/${categorySlug}?sector=${encodeURIComponent(subcategory.slug)}#sector-activo`;
}

/**
 * Pure, read-only projection of the authorized V16 taxonomy into contextual
 * navigation. No taxonomy is inferred and no state is persisted.
 */
export function deriveSubcategoryContext(
  category: CategoryDefinition,
  input: SubcategoryContextInput = {},
): readonly SubcategoryContextItem[] {
  const active = category.subcategories.filter(isActive);
  if (active.length === 0) return [];

  const selected = active.find((subcategory) => (
    subcategory.brand
      ? Boolean(input.brand && subcategory.brand === input.brand)
      : Boolean(input.sector && subcategory.slug === input.sector)
  ));

  return [
    {
      slug: "all",
      title: "Todo",
      icon: "✦",
      href: `/categoria/${category.slug}#catalogo`,
      selected: !selected,
      kind: "all",
    },
    ...active.map((subcategory) => ({
      slug: subcategory.slug,
      title: subcategory.title,
      icon: subcategory.icon,
      href: subcategoryHref(category.slug, subcategory),
      selected: subcategory === selected,
      kind: subcategory.brand ? "brand" as const : "sector" as const,
    })),
  ];
}
