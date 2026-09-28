"use client";

import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { Product } from "@/lib/catalog";
import { deriveFacetGroups, matchesFacets, productFacetValues, type FacetKey, type FacetSelection } from "@/lib/catalog/smart-facets";

type Props = {
  products: readonly Product[];
  scope: string;
  selected: FacetSelection;
  onSelect: (key: FacetKey, value: string | undefined) => void;
  onClear: () => void;
  resultCount: number;
  availableOnly: boolean;
  onAvailabilityChange: (value: boolean) => void;
};

export function SmartFacetDrawer({ products, scope, selected, onSelect, onClear, resultCount, availableOnly, onAvailabilityChange }: Props) {
  const [open, setOpen] = useState(false);
  const groups = useMemo(() => deriveFacetGroups(products, scope), [products, scope]);
  const activeCount = groups.filter((group) => selected[group.key]).length + Number(availableOnly);
  if (!groups.length && !products.some((product) => product.stock.status === "in_stock")) return null;
  return <section className="smart-facets" aria-label="Filtros del sector">
    <button type="button" className="smart-facets-trigger" aria-expanded={open} aria-controls="smart-facets-content" onClick={() => setOpen(!open)}>
      <SlidersHorizontal size={18} /><span>Filtrar productos</span>{activeCount ? <b>{activeCount}</b> : null}<small>{resultCount} resultados</small><ChevronDown className={open ? "is-open" : ""} size={18} />
    </button>
    {open && <div id="smart-facets-content" className="smart-facets-content">
      {groups.map((group) => <details key={group.key} className="smart-facet-group">
        <summary>{group.label}{selected[group.key] ? <strong>{selected[group.key]}</strong> : null}<ChevronDown size={16} /></summary>
        <div className="smart-facet-options">
          {group.options.map((value) => {
            const count = products.filter((product) => (!availableOnly || product.stock.status === "in_stock") && matchesFacets(product, scope, selected, group.key) && productFacetMatch(product, scope, group.key, value)).length;
            const active = selected[group.key] === value;
            return <button key={value} type="button" disabled={!count && !active} aria-pressed={active} onClick={() => onSelect(group.key, active ? undefined : value)}>{value}<small>{count}</small></button>;
          })}
        </div>
      </details>)}
      {products.some((product) => product.stock.status === "in_stock") && <button type="button" className="smart-facet-availability" aria-pressed={availableOnly} onClick={() => onAvailabilityChange(!availableOnly)}>Disponible ahora</button>}
      <div className="smart-facets-footer"><span>{resultCount} {resultCount === 1 ? "producto" : "productos"}</span><button type="button" onClick={onClear} disabled={!activeCount}><X size={15} /> Limpiar filtros</button><button type="button" onClick={() => setOpen(false)}>Ver resultados</button></div>
    </div>}
  </section>;
}

function productFacetMatch(product: Product, scope: string, key: FacetKey, value: string) {
  return productFacetValues(product, scope, key).includes(value);
}
