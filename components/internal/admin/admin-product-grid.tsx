"use client";

import { useMemo, useState } from "react";
import { filterAdminCatalog, getAdminCatalogWindow, nextAdminCatalogWindow, type AdminCatalogFilterState } from "../../../lib/internal/admin/catalog-scale";
import { buildAdminProductCardModel, type AdminCardProductInput } from "../../../lib/internal/admin/product-card-model";
import { AdminProductCard } from "./admin-product-card";
import { V418AQuickActionsSheet } from "./v418a-quick-actions-sheet";
import { ProductPhotoEditor } from "./product-photo-editor";

interface Props {
  products: readonly (AdminCardProductInput & { stockState: "in_stock" | "low_stock" | "out_of_stock" })[];
}

export function AdminProductGrid({ products }: Props) {
  const [mediaOverrides,setMediaOverrides] = useState<Record<string,Partial<AdminCardProductInput>>>({});
  const [photoIds,setPhotoIds] = useState<string[]>([]);
  const [branded,setBranded] = useState(false);
  const currentProducts = useMemo(()=>products.map(product=>({...product,...mediaOverrides[product.id]})),[products,mediaOverrides]);
  const [filters, setFilters] = useState<AdminCatalogFilterState>({});
  const [loaded, setLoaded] = useState(36);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [quickProductId, setQuickProductId] = useState<string | null>(null);

  const scalable = useMemo(() => currentProducts.map((p) => ({
    ...p,
    priceAge: buildAdminProductCardModel(p).priceAge.status === "fresh" ? "green" as const : buildAdminProductCardModel(p).priceAge.status === "warning" ? "yellow" as const : buildAdminProductCardModel(p).priceAge.status === "review" ? "red" as const : "unknown" as const,
  })), [currentProducts]);
  const filtered = useMemo(() => filterAdminCatalog(scalable, filters), [scalable, filters]);
  const visible = useMemo(() => getAdminCatalogWindow(filtered, loaded), [filtered, loaded]);

  return (
    <section className="admin-product-grid-shell">
      <div className="admin-product-grid-toolbar">
        <input aria-label="Buscar productos" placeholder="Buscar producto, mayorista o categoría…" value={filters.query ?? ""} onChange={(e) => { setFilters((f) => ({ ...f, query:e.target.value })); setLoaded(36); }} />
        <span>{filtered.length.toLocaleString("es-AR")} productos</span>
      </div>
      {selected.size > 0 && <div className="admin-bulk-tray"><strong>{selected.size} seleccionados</strong><button type="button" onClick={()=>{setBranded(true);setPhotoIds([...selected])}}>Estilo Amarango para seleccionados</button><button type="button" onClick={()=>setSelected(new Set())}>Quitar selección</button></div>}
      <div className="admin-product-grid">
        {visible.map((product) => <AdminProductCard key={product.id} product={buildAdminProductCardModel(product)} selected={selected.has(product.id)} onSelect={(id) => setSelected((current) => current.has(id) ? new Set([...current].filter((item) => item !== id)) : new Set(current).add(id))} onQuickActions={setQuickProductId} onChangePhoto={id=>{setBranded(false);setPhotoIds([id])}} />)}
      </div>
      {visible.length < filtered.length && <button type="button" className="admin-load-more" onClick={() => setLoaded((n) => nextAdminCatalogWindow(n, filtered.length))}>Mostrar {Math.min(36, filtered.length-visible.length)} más</button>}
      <V418AQuickActionsSheet onChangePhoto={id=>{setBranded(false);setPhotoIds([id])}} product={quickProductId ? buildAdminProductCardModel(products.find((item) => item.id === quickProductId)!) : null} open={quickProductId !== null} onOpenChange={(next) => { if (!next) setQuickProductId(null); }} />
      {photoIds.length>0&&<ProductPhotoEditor products={photoIds.map(id=>currentProducts.find(product=>product.id===id)!).filter(Boolean)} branded={branded} onClose={()=>setPhotoIds([])} onSaved={(id,imageUrl,features,specifications,supplierImageUrl)=>setMediaOverrides(current=>({...current,[id]:{imageUrl,features,specifications,supplierImageUrl}}))}/>}
    </section>
  );
}
