"use client";

import { ChevronDown, Layers3 } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/lib/catalog";
import { deriveFacetGroups, productFacetValues } from "@/lib/catalog/smart-facets";

type Props = {
  products: readonly Product[];
  scope: string;
  renderProduct: (product: Product) => ReactNode;
  filters?: ReactNode;
  autoOpen?: boolean;
};

export function ProductCategoryAccordion({ products, scope, renderProduct, filters, autoOpen = false }: Props) {
  const [open, setOpen] = useState(autoOpen);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  useEffect(() => { if (autoOpen) setOpen(true); }, [autoOpen]);
  const sections = useMemo(() => {
    const primary = deriveFacetGroups(products, scope).find((group) => group.key !== "brand")
      ?? deriveFacetGroups(products, scope).find((group) => group.key === "brand");
    if (!primary || products.length < 4) return [{ label: "Todos los productos", products: [...products] }];
    const buckets = new Map(primary.options.map((option) => [option, [] as Product[]]));
    const rest: Product[] = [];
    for (const product of products) {
      const matching = productFacetValues(product, scope, primary.key).find((value) => buckets.has(value));
      if (matching) buckets.get(matching)!.push(product);
      else rest.push(product);
    }
    const groups = primary.options.map((label) => ({ label, products: buckets.get(label)! })).filter((group) => group.products.length);
    if (rest.length) groups.push({ label: "Otros modelos", products: rest });
    return groups;
  }, [products, scope]);

  return <section className="product-category-drawer" aria-label="Productos por categoría">
    <button type="button" className="product-category-trigger" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      <Layers3 size={19} aria-hidden="true" /><span>Categoría</span><small>{products.length} {products.length === 1 ? "producto" : "productos"}</small><ChevronDown className={open ? "is-open" : ""} size={19} aria-hidden="true" />
    </button>
    {open && <div className="product-category-content">
      {filters}
      {sections.map((section) => {
        const expanded = openGroup === section.label || (autoOpen && sections.length === 1 && openGroup === null);
        return <section className="product-category-group" key={section.label}>
          <button type="button" aria-expanded={expanded} onClick={() => setOpenGroup(expanded ? "" : section.label)}>
            <span>{section.label}</span><small>{section.products.length}</small><ChevronDown className={expanded ? "is-open" : ""} size={18} aria-hidden="true" />
          </button>
          {expanded && <div className="catalog-grid product-category-grid">{section.products.map(renderProduct)}</div>}
        </section>;
      })}
    </div>}
  </section>;
}
