"use client";

import { useMemo, useState } from "react";
import { filterAdminCatalog, getAdminCatalogWindow, nextAdminCatalogWindow, type AdminCatalogFilterState } from "../../../lib/internal/admin/catalog-scale";
import { buildAdminProductCardModel, type AdminCardProductInput } from "../../../lib/internal/admin/product-card-model";
import { AdminProductCard } from "./admin-product-card";
import { V418AQuickActionsSheet } from "./v418a-quick-actions-sheet";
import { ProductPhotoEditor } from "./product-photo-editor";
import {useProductShare} from "@/components/ui/use-product-share";
import {Dialog} from "radix-ui";
import {AmarangoCalculatorPanel} from "./amarango-calculator-panel";
import {useLiveCommissions} from '@/lib/advisor-compensation/use-live-commissions';
import {CommissionProductGain} from '@/app/components/commission-product-gain';

interface Props {
  products: readonly (AdminCardProductInput & { stockState: "in_stock" | "low_stock" | "out_of_stock" })[];
}

export function AdminProductGrid({ products }: Props) {
  const sharing=useProductShare();
  const commissions=useLiveCommissions();
  const [calculatorId,setCalculatorId]=useState<string|null>(null);
  function onAction(action:string,id:string){
    const p=currentProducts.find(p=>p.id===id);
    if(action==="finance.calculator"&&p){setCalculatorId(id);return;}
    if(action!=="store.share"||!p?.slug)return;
    void sharing.share({name:p.name,url:new URL(`/producto/${p.slug}`,window.location.origin).toString(),cashPriceArs:p.salePrice,imageUrl:p.imageUrl,productId:p.id,installments:p.financing?.map(plan=>({installments:plan.installments,amountArs:plan.installmentAmount?.amount??null,totalArs:plan.totalAmount?.amount??null}))});
  }
  const [mediaOverrides,setMediaOverrides] = useState<Record<string,Partial<AdminCardProductInput>>>({});
  const [photoIds,setPhotoIds] = useState<string[]>([]);
  const [branded,setBranded] = useState(false);
  const currentProducts = useMemo(()=>products.map(product=>({...product,...mediaOverrides[product.id]})),[products,mediaOverrides]);
  const calculatorProduct=currentProducts.find(product=>product.id===calculatorId);
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
        {visible.map((product) => <AdminProductCard key={product.id} commission={<CommissionProductGain name={product.name} price={product.salePrice} cap={commissions.status==='ok'?commissions.data?.cap:undefined} active={commissions.status==='ok'&&commissions.data?.policyActive===true}/>} product={buildAdminProductCardModel(product)} selected={selected.has(product.id)} onAction={onAction} onSelect={(id) => setSelected((current) => current.has(id) ? new Set([...current].filter((item) => item !== id)) : new Set(current).add(id))} onQuickActions={setQuickProductId} onChangePhoto={id=>{setBranded(false);setPhotoIds([id])}} />)}
      </div>
      {visible.length < filtered.length && <button type="button" className="admin-load-more" onClick={() => setLoaded((n) => nextAdminCatalogWindow(n, filtered.length))}>Mostrar {Math.min(36, filtered.length-visible.length)} más</button>}
      <V418AQuickActionsSheet onChangePhoto={id=>{setBranded(false);setPhotoIds([id])}} product={quickProductId ? buildAdminProductCardModel(products.find((item) => item.id === quickProductId)!) : null} open={quickProductId !== null} onOpenChange={(next) => { if (!next) setQuickProductId(null); }} />
      {photoIds.length>0&&<ProductPhotoEditor products={photoIds.map(id=>currentProducts.find(product=>product.id===id)!).filter(Boolean)} branded={branded} onClose={()=>setPhotoIds([])} onSaved={(id,imageUrl,features,specifications,supplierImageUrl)=>setMediaOverrides(current=>({...current,[id]:{imageUrl,features,specifications,supplierImageUrl}}))}/>}
      {sharing.dialog}
      <Dialog.Root open={!!calculatorProduct} onOpenChange={open=>{if(!open)setCalculatorId(null)}}><Dialog.Portal><Dialog.Overlay className="amarango-dialog-overlay"/><Dialog.Content className="amarango-reason-dialog admin-product-calculator-dialog"><Dialog.Title>Calculadora del producto</Dialog.Title><Dialog.Description>Costo y resultados privados para Administración y Propietarios.</Dialog.Description>{calculatorProduct&&<AmarangoCalculatorPanel key={calculatorProduct.id} initialProduct={calculatorProduct}/>}<div className="amarango-reason-actions"><Dialog.Close>Cerrar calculadora</Dialog.Close></div></Dialog.Content></Dialog.Portal></Dialog.Root>
    </section>
  );
}
