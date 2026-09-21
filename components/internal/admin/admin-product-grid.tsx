"use client";

import { useMemo, useState } from "react";
import { filterAdminCatalog, getAdminCatalogWindow, nextAdminCatalogWindow, type AdminCatalogFilterState } from "../../../lib/internal/admin/catalog-scale";
import { buildAdminProductCardModel, type AdminCardProductInput } from "../../../lib/internal/admin/product-card-model";
import { AdminProductCard } from "./admin-product-card";
import { V418AQuickActionsSheet } from "./v418a-quick-actions-sheet";

interface Props {
  products: readonly (AdminCardProductInput & { stockState: "in_stock" | "low_stock" | "out_of_stock" })[];
}

export function AdminProductGrid({ products }: Props) {
  const [filters, setFilters] = useState<AdminCatalogFilterState>({});
  const [loaded, setLoaded] = useState(36);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [quickProductId, setQuickProductId] = useState<string | null>(null);

  const scalable = useMemo(() => products.map((p) => ({
    ...p,
    priceAge: buildAdminProductCardModel(p).priceAge.status === "fresh" ? "green" as const : buildAdminProductCardModel(p).priceAge.status === "warning" ? "yellow" as const : buildAdminProductCardModel(p).priceAge.status === "review" ? "red" as const : "unknown" as const,
  })), [products]);
  const filtered = useMemo(() => filterAdminCatalog(scalable, filters), [scalable, filters]);
  const visible = useMemo(() => getAdminCatalogWindow(filtered, loaded), [filtered, loaded]);

  return (
    <section className="admin-product-grid-shell">
      <div className="admin-product-grid-toolbar">
        <input aria-label="Buscar productos" placeholder="Buscar producto, mayorista o categoría…" value={filters.query ?? ""} onChange={(e) => { setFilters((f) => ({ ...f, query:e.target.value })); setLoaded(36); }} />
        <span>{filtered.length.toLocaleString("es-AR")} productos</span>
      </div>
      {selected.size > 0 && <div className="admin-bulk-tray"><strong>{selected.size} seleccionados</strong><small>Edición real bloqueada en esta vista.</small><button type="button" disabled>Confirmar precio</button><button type="button" disabled>Mayorista</button><button type="button" disabled>Visibilidad</button><button type="button" disabled>Stock</button></div>}
      <div className="admin-product-grid">
        {visible.map((product) => <AdminProductCard key={product.id} product={buildAdminProductCardModel(product)} selected={selected.has(product.id)} onSelect={(id) => setSelected((current) => current.has(id) ? new Set([...current].filter((item) => item !== id)) : new Set(current).add(id))} onQuickActions={setQuickProductId} />)}
      </div>
      {visible.length < filtered.length && <button type="button" className="admin-load-more" onClick={() => setLoaded((n) => nextAdminCatalogWindow(n, filtered.length))}>Mostrar {Math.min(36, filtered.length-visible.length)} más</button>}
      <V418AQuickActionsSheet product={quickProductId ? buildAdminProductCardModel(products.find((item) => item.id === quickProductId)!) : null} open={quickProductId !== null} onOpenChange={(next) => { if (!next) setQuickProductId(null); }} />
    </section>
  );
}
