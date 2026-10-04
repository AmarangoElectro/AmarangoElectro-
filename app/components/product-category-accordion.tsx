"use client";

import { ChevronDown, Layers3 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Product } from "@/lib/catalog";
import { deriveFacetGroups, productFacetValues } from "@/lib/catalog/smart-facets";

type Props = {
  products: readonly Product[];
  taxonomyProducts?: readonly Product[];
  scope: string;
  renderProduct: (product: Product) => ReactNode;
  filters?: ReactNode;
  autoOpen?: boolean;
  focusRequest?: { value: string | null; token: number };
};

export function ProductCategoryAccordion({ products, taxonomyProducts = products, scope, renderProduct, filters, autoOpen = false, focusRequest }: Props) {
  const [open, setOpen] = useState(autoOpen);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const groupButtons = useRef(new Map<string, HTMLButtonElement>());
  const lastFocusToken = useRef(0);
  useEffect(() => { if (autoOpen) setOpen(true); }, [autoOpen]);
  const sections = useMemo(() => {
    const facets = deriveFacetGroups(taxonomyProducts, scope);
    const primary = facets.find((group) => group.key !== "brand") ?? facets.find((group) => group.key === "brand");
    if (!primary) return [{ label: "Todos los productos", products: [...products] }];
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
  }, [products, taxonomyProducts, scope]);

  useEffect(() => {
    if (!focusRequest || focusRequest.token === lastFocusToken.current || !sections.length) return;
    lastFocusToken.current = focusRequest.token;
    const target = sections.find((section) => section.label === focusRequest.value) ?? sections[0];
    setOpen(true);
    setOpenGroup(target.label);
    requestAnimationFrame(() => requestAnimationFrame(() => groupButtons.current.get(target.label)?.scrollIntoView({ behavior: "smooth", block: "start" })));
  }, [focusRequest, sections]);

  function toggleGroup(label: string, expanded: boolean) {
    setOpenGroup(expanded ? "" : label);
    if (!expanded) requestAnimationFrame(() => groupButtons.current.get(label)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return <section id="categorias-productos" className="product-category-drawer" aria-label="Productos por categoría">
    <button type="button" className="product-category-trigger" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      <Layers3 size={19} aria-hidden="true" /><span>Categoría</span><small>{products.length} {products.length === 1 ? "producto" : "productos"}</small><ChevronDown className={open ? "is-open" : ""} size={19} aria-hidden="true" />
    </button>
    {open && <div className="product-category-content">
      {filters}
      {sections.map((section) => {
        const expanded = openGroup === section.label || (autoOpen && sections[0]?.label === section.label && openGroup === null);
        return <section className="product-category-group" key={section.label}>
          <button type="button" ref={(node) => { if (node) groupButtons.current.set(section.label, node); else groupButtons.current.delete(section.label); }} aria-expanded={expanded} onClick={() => toggleGroup(section.label, expanded)}>
            <span>{section.label}</span><small>{section.products.length}</small><ChevronDown className={expanded ? "is-open" : ""} size={18} aria-hidden="true" />
          </button>
          {expanded && <div className="catalog-grid product-category-grid">{section.products.map(renderProduct)}</div>}
        </section>;
      })}
    </div>}
  </section>;
}
