"use client";

import { useCompactCatalog } from "./compact-catalog-controls";
import { displayProductName } from "@/lib/catalog/display-name";
import { useMemo, useState } from "react";
import Link from "./store-link";
import { ClipboardList, Search, Share2, UsersRound, WalletCards } from "lucide-react";
import type { Product } from "@/lib/catalog/types";
import { normalizeCatalogText } from "@/lib/catalog/search";
import { OffersShowcase } from "./offers-showcase";
import { AdvisorSaleDraftPanel } from "./advisor-sale-draft-panel";
import { SectorGuide } from "./sector-guide";
import { findSectorGuide } from "@/lib/onboarding/sector-guides";
import {useProductShare} from "@/components/ui/use-product-share";
import Image from "next/image";
import { AdvisorGrowthSummary } from "./advisor-growth-summary";
import { AdvisorMonthDashboard } from "./advisor-month-dashboard";
import {useLiveCommissions} from '@/lib/advisor-compensation/use-live-commissions';
import {liveAdvisorMonth} from '@/lib/advisor-compensation/live-model';
import {sortCommissionProducts,type CommissionSort,type CommissionModality} from '@/lib/advisor-compensation/commercial-policy';
import {CommissionProductGain} from './commission-product-gain';
import {useStorefrontFinancing} from '@/lib/commerce/use-storefront-financing';
import {numericPlans} from '@/lib/commerce/storefront-financing';

const advisorGuide = findSectorGuide("asesor", "mi-amarango");
const liveStockSuppliers = new Set(["mega electro", "electro impacto"]);

function money(value: number | null | undefined) {
  return value ? `$${Math.round(value).toLocaleString("es-AR")}` : "A confirmar";
}

export function AdvisorWorkspace({ products }: { products: readonly Product[] }) {
  const compactItems = useMemo(() => products.map(product => ({...product, amount:product.price?.amount ?? null})), [products]);
  const compact = useCompactCatalog(compactItems);
  const live=useLiveCommissions();
  const [sort,setSort]=useState<CommissionSort>('commission'),[modality,setModality]=useState<CommissionModality>('cash');
  const financing=useStorefrontFinancing(products);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const term = normalizeCatalogText(query);
    const found=products.filter((product) => compact.idSet.has(product.id) && (!term||normalizeCatalogText([product.name, product.model, product.brand, product.category].filter(Boolean).join(" ")).includes(term)));
    if (compact.sort !== "recommended") return found.sort((a,b) => (compact.rank.get(a.id) ?? 0) - (compact.rank.get(b.id) ?? 0));
    const ordered=sortCommissionProducts(found,sort,modality,live.data?.cap??null,live.data?.salesCounts??{});
    const installment=(p:Product)=>Math.min(...numericPlans(financing.data[p.id]?.length?financing.data[p.id]:p.financing).map(plan=>plan.installmentAmount!.amount));
    return sort==='installments'?ordered.filter(p=>Number.isFinite(installment(p))).sort((a,b)=>installment(a)-installment(b)||a.id.localeCompare(b.id)):ordered;
  }, [products, query,sort,modality,live.data,financing.data,compact.ids,compact.sort]);

  const sharing=useProductShare();
  async function share(product:Product){const plans=numericPlans(financing.data[product.id]?.length?financing.data[product.id]:product.financing);await sharing.share({name:product.name,url:`${window.location.origin}/producto/${product.slug}`,cashPriceArs:product.price?.amount??null,installments:plans.map(plan=>({installments:plan.installments,amountArs:plan.installmentAmount?.amount??null,totalArs:plan.totalAmount?.amount??null})),imageUrl:product.image?.src??null,productId:product.id})}

  return (
    <main className="internal-workspace advisor-workspace">
      <section className="internal-hero">
        <div><p className="eyebrow orange">MI AMARANGO · ASESORES</p><h1>Todo lo comercial.<br /><span>Sin exponer datos privados.</span></h1></div>
        <p>Productos oficiales, seguimiento y herramientas de atención. Los precios los define Administración.</p>
        {advisorGuide && <SectorGuide guide={advisorGuide} />}
      </section>
      <nav className="advisor-section-nav" aria-label="Navegación de Mi Amarango">
        <a href="#advisor-tools">Resumen</a>
        <a href="#advisor-month">Tu mes</a>
        <a href="#advisor-sale-draft">Nueva venta</a>
        <a href="#advisor-offers">Ofertas</a>
        <a href="#advisor-catalog">Catálogo</a>
      </nav>
      <section id="advisor-tools" className="advisor-quick-grid" aria-label="Accesos rápidos" data-guide-target="advisor-quick-grid">
        <article><UsersRound /><span><small>CLIENTES</small><strong>Conexión segura pendiente</strong></span></article>
        <article><WalletCards /><span><small>CUOTAS</small><strong>Conexión segura pendiente</strong></span></article>
        <a className="advisor-quick-card advisor-quick-card--sale" href="#advisor-sale-draft"><ClipboardList /><span><small>NUEVA VENTA</small><strong>Preparar operación</strong></span></a>
      </section>
      <AdvisorMonthDashboard result={live.data&&live.status==='ok'?{status:'ok',data:liveAdvisorMonth(live.data)}:live.status==='unauthorized'?{status:'unauthorized'}:{status:'not_connected'}} />
      <button type="button" className="product-calculator-trigger" onClick={()=>void live.refresh()}>Actualizar Tu mes</button>
      <AdvisorGrowthSummary />
      <AdvisorSaleDraftPanel products={products} />
      <div id="advisor-offers" className="advisor-offers-anchor"><OffersShowcase advisor /></div>
      <section id="advisor-catalog" className="advisor-catalog" aria-labelledby="advisor-catalog-title">
        <div className="advisor-catalog-heading" data-guide-target="advisor-catalog-search"><div><p className="eyebrow orange">CATÁLOGO MAESTRO</p><h2 id="advisor-catalog-title">Productos oficiales</h2></div><label><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nombre, modelo, marca…" /></label></div>
        {compact.controls}
        <div className="commission-filters" role="group" aria-label="Ordenar productos">{([["commission","Más comisión"],["sales","Más vendidos"],["price","Mejor precio"],["installments","Cuotas"]] as const).map(([key,label])=><button key={key} type="button" aria-pressed={sort===key} onClick={()=>{compact.resetSort();setSort(key)}}>{label}</button>)}<button type="button" aria-pressed={modality==="cash"} onClick={()=>setModality("cash")}>Contado</button><button type="button" aria-pressed={modality==="financed"} onClick={()=>setModality("financed")}>Financiado</button></div>{sort==="sales"&&<p className="internal-privacy-note">Ventas registradas {live.data?.role==="asesor"?"por vos":"en Amarango"}.</p>}<div className="advisor-product-grid">
          {filtered.map((product) => {
            const sixPlan = numericPlans(financing.data[product.id]?.length?financing.data[product.id]:product.financing).find((plan) => plan.installments === 6 && plan.installmentAmount);
            const supplier = product.specifications.Proveedor?.trim().toLocaleLowerCase("es-AR") ?? "";
            const hasLiveStock = liveStockSuppliers.has(supplier);
            const stockText = hasLiveStock
              ? product.stock.status === "out_of_stock"
                ? "Sin stock"
                : product.stock.quantity !== null
                  ? `Stock disponible: ${product.stock.quantity}`
                  : "Stock disponible"
              : "Consultar a Administración por stock";
            return <article key={product.id} className="advisor-product-card">
              <div className="advisor-product-card__tools"><span>VENTA</span><button type="button" onClick={() => share(product)} aria-label={`Publicar ${product.name}`}><Share2 size={16} /></button></div>
              {product.image ? <div className="advisor-product-placeholder advisor-product-image"><Image src={product.image.src} alt={product.image.alt} fill sizes="(max-width: 760px) 100vw, 33vw" loading="lazy" unoptimized /></div> : <div className="advisor-product-placeholder">{product.brand.slice(0, 1)}</div>}
              <div className="advisor-product-card__copy">
                <small>{product.brand} · {product.category}</small><h3>{displayProductName(product.name)}</h3>
                <CommissionProductGain name={product.name} price={product.price?.amount??null} cap={live.status==="ok"?live.data?.cap:undefined} modality={modality} active={live.data?.policyActive===true&&live.status==="ok"}/><strong className="advisor-product-price">{money(product.price?.amount)}</strong>
                <p>{sixPlan?.installmentAmount ? `6 cuotas de ${money(sixPlan.installmentAmount.amount)}` : product.price ? "Consultá opciones de pago" : "Consultá precio y opciones de pago"}</p>
                <span className={`advisor-availability ${hasLiveStock ? "is-live" : "needs-check"}`}>{stockText}</span>
              </div>
              <div className="advisor-product-card__actions"><Link href={`/producto/${product.slug}`}>Ver producto</Link><button type="button" onClick={() => share(product)}><Share2 size={16} /> Publicar</button></div>
            </article>;
          })}
          {filtered.length === 0 && <div className="internal-empty">No encontramos coincidencias. Probá con otra marca o modelo.</div>}
        </div>
        <p className="internal-privacy-note">Esta vista no muestra costos, markup, caja, proveedores internos ni información financiera privada.</p>
      </section>
      {sharing.dialog}
    </main>
  );
}
