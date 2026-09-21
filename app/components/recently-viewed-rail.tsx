"use client";

import Image from "next/image";
import { Clock3, X } from "lucide-react";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import type { Product } from "@/lib/catalog";
import {
  clearRecentlyViewed,
  getRecentlyViewedServerSnapshot,
  getRecentlyViewedSnapshot,
  parseRecentlyViewedSnapshot,
  projectRecentlyViewedProducts,
  replaceRecentlyViewed,
  subscribeRecentlyViewed,
} from "@/lib/commerce/recently-viewed-store";
import { playSonicCue } from "@/lib/ux/sonic-feedback";
import Link from "./store-link";

function sameIds(left: string[], right: string[]) {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

function priceLabel(product: Product) {
  if (!product.price) return "Precio a consultar";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: product.price.currency,
    maximumFractionDigits: 0,
  }).format(product.price.amount);
}

export function RecentlyViewedRail({ products, excludeId }: { products: Product[]; excludeId?: string }) {
  const snapshot = useSyncExternalStore(subscribeRecentlyViewed, getRecentlyViewedSnapshot, getRecentlyViewedServerSnapshot);
  const ids = useMemo(() => parseRecentlyViewedSnapshot(snapshot), [snapshot]);
  const projection = useMemo(() => projectRecentlyViewedProducts(ids, products), [ids, products]);
  const recent = useMemo(
    () => projection.products.filter((product) => product.id !== excludeId),
    [excludeId, projection.products],
  );

  useEffect(() => {
    if (!sameIds(ids, projection.ids)) replaceRecentlyViewed(projection.ids);
  }, [ids, projection.ids]);

  if (!recent.length) return null;

  return (
    <section className="recently-viewed" aria-labelledby="recently-viewed-title">
      <div className="recently-viewed-heading">
        <div>
          <p className="eyebrow orange"><Clock3 size={14} aria-hidden="true" /> VISTOS RECIENTEMENTE</p>
          <h2 id="recently-viewed-title">Seguí mirando</h2>
          <p>Guardado en este dispositivo para que puedas retomar productos que ya viste.</p>
        </div>
        <button type="button" aria-label="Limpiar vistos recientemente" onClick={() => { clearRecentlyViewed(); playSonicCue("tap"); }}>
          <X size={15} aria-hidden="true" /> Limpiar
        </button>
      </div>
      <div className="recently-viewed-track">
        {recent.map((product) => (
          <Link key={product.id} className="recently-viewed-card" href={`/producto/${product.slug}`} onClick={() => playSonicCue("navigate")}>
            <span className="recently-viewed-media" aria-hidden="true">
              {product.image ? (
                <Image src={product.image.src} alt="" fill sizes="82px" loading="lazy" unoptimized />
              ) : (
                <span className="recently-viewed-monogram">{product.brand.slice(0, 2).toUpperCase()}</span>
              )}
            </span>
            <span className="recently-viewed-copy">
              <small>{product.brand}</small>
              <strong>{product.name}</strong>
              <span className="recently-viewed-price">{priceLabel(product)}</span>
              <span>{product.stock.label ?? (product.availability === "available" ? "Disponible" : "Disponibilidad a confirmar")}</span>
            </span>
            <b aria-hidden="true">→</b>
          </Link>
        ))}
      </div>
    </section>
  );
}
