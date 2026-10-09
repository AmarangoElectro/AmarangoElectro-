"use client";

import Image from "next/image";
import Link from "./store-link";
import { ArrowUpRight, GitCompareArrows, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Product } from "@/lib/catalog";
import type { FinancingOption } from "@/lib/catalog/types";
import { buildComparisonRows } from "@/lib/catalog/comparison";
import { playSonicCue } from "@/lib/ux/sonic-feedback";

interface ProductComparisonProps {
  products: Product[];
  onRemove: (productId: string) => void;
  onClear: () => void;
}

export function ProductComparison({ products, onRemove, onClear }: ProductComparisonProps) {
  const [open, setOpen] = useState(false);
  const [differencesOnly, setDifferencesOnly] = useState(false);
  const [financing,setFinancing] = useState<Record<string,FinancingOption[]>>({});
  const [loadingFinancing,setLoadingFinancing] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const rows = buildComparisonRows(products.map(product=>({...product,financing:product.financing.length?product.financing:financing[product.id]??[]})));
  const visibleRows = differencesOnly ? rows.filter((row) => row.differs) : rows;
  const knownPrices = products.map((product) => product.price?.amount).filter((amount): amount is number => typeof amount === "number" && Number.isFinite(amount) && amount>0);
  const priceRange = knownPrices.length > 1 ? Math.max(...knownPrices) - Math.min(...knownPrices) : null;
  const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
  useEffect(()=>{
    if(!open)return;
    const controller=new AbortController();setFinancing({});setLoadingFinancing(true);
    fetch("/api/v16/comparison-financing",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ids:products.map(product=>product.id)}),signal:controller.signal}).then(response=>response.json()).then(body=>{if(!controller.signal.aborted&&body.status==="ok")setFinancing(body.data)}).catch(()=>{}).finally(()=>{if(!controller.signal.aborted)setLoadingFinancing(false)});
    return()=>controller.abort();
  },[open,products]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      ).filter((element) => !element.hasAttribute("aria-hidden"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => closeButtonRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      if(previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({preventScroll:true});
    };
  }, [open]);

  if (!products.length) return null;

  function openComparison() {
    if (products.length < 2) return;
    playSonicCue("compare");
    setOpen(true);
  }

  function removeProduct(productId: string) {
    if (products.length <= 2) setOpen(false);
    onRemove(productId);
  }

  function clearProducts() {
    setOpen(false);
    onClear();
  }

  return (
    <>
      <aside className="compare-dock" aria-label="Productos seleccionados para comparar">
        <div className="compare-dock-intro">
          <span className="compare-dock-icon"><GitCompareArrows size={18} aria-hidden="true" /></span>
          <div><small>COMPARACIÓN</small><strong>{products.length} de 3 seleccionados</strong></div>
        </div>
        <div className="compare-dock-products">
          {products.map((product) => (
            <div className="compare-dock-product" key={product.id}>
              <span>{product.brand}</span>
              <strong>{product.name}</strong>
              <button type="button" aria-label={`Quitar ${product.name} de la comparación`} onClick={() => removeProduct(product.id)}><X size={14} /></button>
            </div>
          ))}
        </div>
        <div className="compare-dock-actions">
          <button type="button" className="compare-clear" aria-label="Limpiar productos seleccionados" onClick={clearProducts}><Trash2 size={15} /> Limpiar</button>
          <button type="button" className="compare-open" aria-label="Comparar precios y cuotas" disabled={products.length < 2} onClick={openComparison}>
            Comparar precios y cuotas <ArrowUpRight size={16} />
          </button>
        </div>
      </aside>

      {open && (
        <div className="compare-overlay" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setOpen(false); }}>
          <section ref={panelRef} className="compare-panel" role="dialog" aria-modal="true" aria-labelledby="compare-title" aria-describedby="compare-description">
            <header className="compare-panel-header">
              <div>
                <p className="eyebrow orange">COMPARACIÓN</p>
                <h2 id="compare-title">Compará precios y cuotas.</h2>
                <p id="compare-description">Contado y opciones de cuotas, en un solo lugar. Las cuotas son orientativas; la cotización oficial confirma el importe.</p>
              </div>
              <button type="button" ref={closeButtonRef} className="compare-close" aria-label="Cerrar comparación" onClick={() => setOpen(false)}><X size={20} /></button>
            </header>

            <p className="compare-price-summary">
              {priceRange !== null
                ? <>Menor precio: <strong>{money.format(Math.min(...knownPrices))}</strong><span aria-hidden="true"> · </span>Diferencia: <strong>{money.format(priceRange)}</strong>{knownPrices.length < products.length ? <span> · {products.length - knownPrices.length} precio a confirmar</span> : null}</>
                : <>Precio: <strong>{knownPrices.length ? money.format(knownPrices[0]) : "A confirmar"}</strong>{knownPrices.length < products.length ? <span> · {products.length - knownPrices.length} {products.length - knownPrices.length === 1 ? "precio a confirmar" : "precios a confirmar"}</span> : null}</>}
            </p>

            <div className="compare-mode-row">
              <label className="compare-differences-toggle">
                <input type="checkbox" checked={differencesOnly} onChange={(event) => { playSonicCue("filter"); setDifferencesOnly(event.target.checked); }} />
                <span aria-hidden="true" />
                Mostrar solo diferencias
              </label>
              <small>{visibleRows.length} {visibleRows.length === 1 ? "dato comparable" : "datos comparables"}</small>
            </div>

            <div className="compare-table-scroll" tabIndex={0} aria-label="Tabla de precios y cuotas; desplazamiento horizontal disponible en pantallas pequeñas">
              <div className="compare-table" data-count={products.length} style={{ "--compare-count": products.length } as CSSProperties}>
                <div className="compare-corner"><span>PRODUCTO</span></div>
                {products.map((product) => (
                  <article className="compare-product-head" key={product.id}>
                    <div className="compare-product-visual" aria-hidden="true">
                      {product.image ? <Image src={product.image.src} alt="" fill sizes="180px" unoptimized /> : <span>{product.brand.slice(0, 2).toUpperCase()}</span>}
                    </div>
                    <small>{product.brand}</small>
                    <h3>{product.name}</h3>
                    <span>{product.model ?? "Modelo a confirmar"}</span>
                    <div>
                      <Link href={`/producto/${product.slug}`} onClick={() => playSonicCue("navigate")}>Ver ficha <ArrowUpRight size={14} /></Link>
                      <button type="button" aria-label={`Quitar ${product.name}`} onClick={() => removeProduct(product.id)}><X size={14} /></button>
                    </div>
                  </article>
                ))}

                {visibleRows.length ? visibleRows.map((row) => (
                  <div className={`compare-row ${row.differs ? "is-different" : ""}`} key={row.id}>
                    <div className="compare-row-label"><span>{row.label}</span>{row.differs && <small>DIFERENCIA</small>}</div>
                    {row.values.map((value, index) => <div className={`compare-cell${row.id==="price"&&knownPrices.length>1&&products[index]?.price?.amount===Math.min(...knownPrices)?" is-best-price":""}`} key={`${row.id}:${products[index]?.id}`}>{value}</div>)}
                  </div>
                )) : (
                  <div className="compare-no-differences">{rows.length?"Los precios y cuotas disponibles coinciden.":"Consultá los precios y las opciones de cuotas de estos productos."}</div>
                )}
              </div>
            </div>

            <footer className="compare-panel-footer">
              <p aria-live="polite">{loadingFinancing?"Consultando cuotas…":rows.some(row=>row.id.startsWith("financing:"))?"Cuotas orientativas. Confirmá el importe final con tu asesor.":"Consultá con tu asesor las opciones de cuotas disponibles."}</p>
              <button type="button" onClick={() => setOpen(false)}>Seguir explorando</button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
