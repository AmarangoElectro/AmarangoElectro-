"use client";

import Link from "./store-link";
import Image from "next/image";
import { GitCompareArrows, Heart, Share2 } from "lucide-react";
import { useMemo, useSyncExternalStore, type CSSProperties } from "react";
import { toast } from "sonner";
import type { Product } from "@/lib/catalog";
import { shareProductLink } from "@/lib/commerce/share-product";
import { playSonicCue } from "@/lib/ux/sonic-feedback";
import { getProductCardVisualTheme, type ProductCardVisualContext } from "@/lib/theme/product-card-theme";
import {
  getFavoritesServerSnapshot,
  getFavoritesSnapshot,
  parseFavoritesSnapshot,
  subscribeFavorites,
  toggleFavoriteId,
} from "@/lib/commerce/favorites-store";

interface ProductCardProps {
  product: Product;
  isCompared?: boolean;
  compareDisabled?: boolean;
  onCompareToggle?: (product: Product) => void;
  visualContext?: ProductCardVisualContext;
}

type ProductCardStyle = CSSProperties & {
  "--card-sector-accent": string;
  "--card-sector-soft": string;
  "--card-brand-accent": string;
  "--card-brand-soft": string;
  "--card-brand-deep": string;
};

export function ProductCard({ product, isCompared = false, compareDisabled = false, onCompareToggle, visualContext = "brand" }: ProductCardProps) {
  const favoritesSnapshot = useSyncExternalStore(subscribeFavorites, getFavoritesSnapshot, getFavoritesServerSnapshot);
  const favorite = parseFavoritesSnapshot(favoritesSnapshot).has(product.id);
  const href = `/producto/${product.slug}`;
  const initials = useMemo(() => product.brand.slice(0, 2).toUpperCase(), [product.brand]);
  const visualTheme = useMemo(() => getProductCardVisualTheme(product.category, product.brand, visualContext), [product.brand, product.category, visualContext]);
  const imageFraming = product.category === "celulares" ? "product-photo" : "full-composition";
  const cardStyle: ProductCardStyle = {
    "--card-sector-accent": visualTheme.sectorAccent,
    "--card-sector-soft": visualTheme.sectorSoft,
    "--card-brand-accent": visualTheme.brandAccent,
    "--card-brand-soft": visualTheme.brandSoft,
    "--card-brand-deep": visualTheme.brandDeep,
  };
  const priceLabel = product.price
    ? new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: product.price.currency,
        maximumFractionDigits: 0,
      }).format(product.price.amount)
    : null;
  const financingLabel = product.financing[0]?.label;
  const sixInstallments = product.financing.find((plan) => plan.installments === 6 && plan.installmentAmount);
  const sixInstallmentsLabel = sixInstallments?.installmentAmount
    ? `6 cuotas fijas de ${new Intl.NumberFormat("es-AR", { style: "currency", currency: sixInstallments.installmentAmount.currency, maximumFractionDigits: 0 }).format(sixInstallments.installmentAmount.amount)}`
    : financingLabel;

  function toggleFavorite() {
    try {
      const isFavorite = toggleFavoriteId(product.id);
      playSonicCue("favorite");
      toast.success(isFavorite ? "Guardado en favoritos" : "Quitado de favoritos");
    } catch {
      toast.error("No pudimos guardar el favorito en este dispositivo.");
    }
  }

  async function share() {
    const url = new URL(href, window.location.origin).toString();
    try {
      playSonicCue("share");
      const result = await shareProductLink({ name: product.name, url, cashPriceArs: product.price?.amount ?? null, installments: product.financing.map((plan) => ({ installments: plan.installments, amountArs: plan.installmentAmount?.amount ?? null })), imageUrl: product.image?.src ?? null });
      if (result === "copied") toast.success("Enlace copiado para compartir");
    } catch {
      toast.error("No pudimos compartir este producto.");
    }
  }

  return (
    <article
      className={`catalog-card product-card-premium brand-${visualTheme.brandId}`}
      style={cardStyle}
      data-product-id={product.id}
      data-product-brand={product.brand}
      data-product-category={product.category}
      data-product-price={product.price?.amount ?? ""}
      data-product-stock={product.stock.status}
      data-sector-theme={visualTheme.sectorId}
      data-brand-theme={visualTheme.brandId}
      data-visual-context={visualContext}
    >
      <div className="product-visual" data-image-framing={imageFraming}>
        <span className="product-card-watermark" aria-hidden="true">{visualTheme.watermarkLabel}</span>
        {product.image ? (
          <Image className="product-image" src={product.image.src} alt={product.image.alt} fill sizes="(max-width: 680px) 50vw, (max-width: 1100px) 50vw, 33vw" loading="lazy" unoptimized />
        ) : (
          <>
            <div className="product-monogram" aria-hidden="true"><span>{initials}</span></div>
            <span className="image-status">IMAGEN NO DISPONIBLE</span>
          </>
        )}
        <div className="card-tools">
          <button type="button" aria-label={favorite ? "Quitar de favoritos" : "Guardar en favoritos"} onClick={toggleFavorite} className={favorite ? "active" : ""}>
            <Heart size={18} fill={favorite ? "currentColor" : "none"} />
          </button>
          <button type="button" aria-label="Compartir producto" onClick={share}><Share2 size={18} /></button>
        </div>
      </div>
      <div className="catalog-card-body">
        <p className="product-brand">{product.brand}</p>
        <h3>{product.name}</h3>
        {product.description ? <p className="product-description">{product.description}</p> : null}
        {product.model ? <dl className="product-card-specs"><div><dt>Modelo</dt><dd>{product.model}</dd></div></dl> : null}
        {product.features.length > 0 ? <div className="feature-chips">{product.features.slice(0, 3).map((feature) => <span key={feature}>{feature}</span>)}</div> : null}
        <div className={`product-card-commerce ${priceLabel ? "has-price" : "price-pending"}`}>
          {priceLabel ? <strong className="product-card-price">{priceLabel}</strong> : <strong className="product-card-price-pending">Consultá precio y opciones de pago</strong>}
          {sixInstallmentsLabel ? <span className="product-card-installments">{sixInstallmentsLabel}</span> : priceLabel ? <span className="product-card-installments">Consultá opciones de pago y disponibilidad</span> : null}
          {priceLabel && sixInstallmentsLabel ? <small className="product-card-cash">Contado: {priceLabel}</small> : null}
          <span className={`product-card-availability ${product.stock.status === "in_stock" ? "is-positive" : ""}`}><span className="sr-only">Disponibilidad</span>{product.stock.label ?? "Consultar disponibilidad"}</span>
        </div>
        <Link className="catalog-card-link" href={href} onClick={() => playSonicCue("navigate")}>Ver producto <span aria-hidden="true">→</span></Link>
        {onCompareToggle && (
          <button
            type="button"
            className={`product-compare-toggle ${isCompared ? "active" : ""}`}
            aria-pressed={isCompared}
            disabled={compareDisabled}
            title={compareDisabled ? "Ya seleccionaste 3 productos" : undefined}
            onClick={() => onCompareToggle(product)}
          >
            <GitCompareArrows size={16} aria-hidden="true" />
            <span>{isCompared ? "Seleccionado para comparar" : "Comparar producto"}</span>
            <small>{isCompared ? "✓" : "+"}</small>
          </button>
        )}
      </div>
    </article>
  );
}
