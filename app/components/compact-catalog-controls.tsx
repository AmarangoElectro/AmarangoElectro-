"use client";

import { useMemo, useState } from "react";
import { AppSelect } from "@/components/ui/app-select";
import { brandsShareFamily } from "@/lib/catalog/brand-family";
import { deriveQuickFacetGroups, dominantFacetNumber, getFacetScope, matchesFacets, type FacetSelection } from "@/lib/catalog/smart-facets";
import { getCategory } from "@/lib/catalog/categories";
import type { Product } from "@/lib/catalog";

type Item = Pick<Product, "id" | "name" | "brand" | "category" | "subcategory" | "model" | "specifications"> & { amount: number | null };

/** Read-only projections of the catalog supplied to this workspace. No network or shared store. */
export function useCompactCatalog(items: readonly Item[]) {
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [selected, setSelected] = useState<FacetSelection>({});
  const [sort, setSort] = useState("recommended");
  const categories = useMemo(() => [...new Set(items.map(item => item.category).filter(Boolean))], [items]);
  const base = useMemo(() => items.filter(item => (!category || item.category === category || item.subcategory === category)), [items, category]);
  const brands = useMemo(() => [...new Set(base.map(item => item.brand).filter(Boolean))].filter((item, index, all) => !all.slice(0, index).some(previous => brandsShareFamily(previous, item))), [base]);
  const branded = useMemo(() => base.filter(item => !brand || brandsShareFamily(item.brand, brand)), [base, brand]);
  const scope = category === "lavado" ? "lavado" : getFacetScope(category || (categories.length === 1 ? categories[0] : ""));
  const groups = useMemo(() => deriveQuickFacetGroups(branded, scope), [branded, scope]);
  const ordered = useMemo(() => {
    const result = branded.filter(item => matchesFacets(item, scope, selected));
    if (sort === "price-asc") result.sort((a,b) => (a.amount ?? Infinity) - (b.amount ?? Infinity));
    if (sort === "price-desc") result.sort((a,b) => (b.amount ?? -Infinity) - (a.amount ?? -Infinity));
    if (sort === "brand") result.sort((a,b) => a.brand.localeCompare(b.brand, "es"));
    if (sort === "capacity") result.sort((a,b) => dominantFacetNumber(a, scope) - dominantFacetNumber(b, scope));
    return result;
  }, [branded, selected, scope, sort]);
  const ids = useMemo(() => ordered.map(item => item.id), [ordered]);
  const idSet = useMemo(() => new Set(ids), [ids]);
  const rank = useMemo(() => new Map(ids.map((id, index) => [id, index])), [ids]);
  const controls = <details className="internal-catalog-filters" open>
    <summary>Sectores y filtros</summary>
    {categories.length > 1 && <nav className="catalog-quick-filters" aria-label="Filtrar por sector">
      {["", ...categories, ...(items.some(item => item.subcategory === "lavado") ? ["lavado"] : [])].map(value => <button key={value} type="button" className={category === value ? "active" : ""} aria-pressed={category === value} onClick={() => { setCategory(value); setBrand(""); setSelected({}); }}>{value ? value === "lavado" ? "Lavarropas" : (getCategory(value)?.title ?? value.replace(/-/g, " ")) : "Todos"}</button>)}
    </nav>}
    {brands.length > 0 && <nav className="catalog-quick-filters" aria-label="Filtrar por marca">{["", ...brands].map(value => <button key={value} type="button" className={brand === value ? "active" : ""} aria-pressed={brand === value} onClick={() => { setBrand(value); setSelected({}); }}>{value || "Todos"}</button>)}</nav>}
    {groups.map(group => <nav key={group.key} className="catalog-quick-filters" aria-label={group.label}><span className="catalog-filter-label">{group.label}</span>{["", ...group.options].map(value => <button key={value} type="button" className={(selected[group.key] ?? "") === value ? "active" : ""} aria-pressed={(selected[group.key] ?? "") === value} onClick={() => setSelected(current => ({...current, [group.key]:value}))}>{value || "Todos"}</button>)}</nav>)}
    <label className="catalog-inline-sort">Ordenar<AppSelect value={sort} onChange={e => setSort(e.target.value)}><option value="recommended">Recomendados</option><option value="price-asc">Menor precio</option><option value="price-desc">Mayor precio</option>{brands.length > 0 && <option value="brand">Marca</option>}{groups.some(group => ["storage", "measure", "capacity", "liters"].includes(group.key)) && <option value="capacity">{scope === "celulares" ? "Memoria" : scope === "smart-tv" ? "Pulgadas" : "Capacidad"}</option>}</AppSelect></label>
  </details>;
  return { ids, idSet, rank, controls, sort, resetSort: () => setSort("recommended") };
}
