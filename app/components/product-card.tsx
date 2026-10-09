"use client";

import Link from "./store-link";
import Image from "next/image";
import { GitCompareArrows, Heart, Share2 } from "lucide-react";
import { useMemo, useSyncExternalStore, type CSSProperties } from "react";
import { toast } from "sonner";
import type { Product } from "@/lib/catalog";
import {useProductShare} from "@/components/ui/use-product-share";
import {useStorefrontFinancing} from "@/lib/commerce/use-storefront-financing";
import {numericPlans} from "@/lib/commerce/storefront-financing";
import { playSonicCue } from "@/lib/ux/sonic-feedback";
import { getAuthorizedReferralShareCode } from "@/lib/growth/referral-attribution-client";
import { getProductCardVisualTheme, type ProductCardVisualContext } from "@/lib/theme/product-card-theme";
import { ProductMediaViewer } from "./product-media-viewer";
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
  eagerImage?: boolean;
}

type ProductCardStyle = CSSProperties & {
  "--card-sector-accent": string;
  "--card-sector-soft": string;
  "--card-brand-accent": string;
  "--card-brand-soft": string;
  "--card-brand-deep": string;
};

export function ProductCard({ product, isCompared = false, compareDisabled = false, onCompareToggle, visualContext = "brand", eagerImage = false }: ProductCardProps) {
  const features = product.features.flatMap((feature) => feature
    .replace(/^Características principales:\s*/i, "")
    .split(/\s*[•●]\s*|\n+/)
    .map((part) => part.trim().replace(/[.·\s]+$/, ""))
    .filter(Boolean)).slice(0, 5);
  const favoritesSnapshot = useSyncExternalStore(subscribeFavorites, getFavoritesSnapshot, getFavoritesServerSnapshot);
  const favorite = parseFavoritesSnapshot(favoritesSnapshot).has(product.id);
  const href = `/producto/${product.slug}`;
  const initials = useMemo(() => product.brand.slice(0, 2).toUpperCase(), [product.brand]);
  const visualTheme = useMemo(() => getProductCardVisualTheme(product.category, product.brand, visualContext), [product.brand, product.category, visualContext]);
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
  const financing=useStorefrontFinancing([product]);
  const plans=numericPlans(financing.data[product.id]?.length?financing.data[product.id]:product.financing);
  const featuredPlan=plans.find(plan=>plan.installments===6)??plans.at(-1);
  const installmentPrice=featuredPlan?.installmentAmount?new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(featuredPlan.installmentAmount.amount):null;

  function toggleFavorite() {
    try {
      const isFavorite = toggleFavoriteId(product.id);
      playSonicCue("favorite");
      toast.success(isFavorite ? "Guardado en favoritos" : "Quitado de favoritos");
    } catch {
      toast.error("No pudimos guardar el favorito en este dispositivo.");
    }
  }

  const sharing=useProductShare();
  const shareInput=()=>({name:product.name,url:new URL(href,window.location.origin).toString(),cashPriceArs:product.price?.amount??null,installments:plans.map(plan=>({installments:plan.installments,amountArs:plan.installmentAmount?.amount??null,totalArs:plan.totalAmount?.amount??null})),imageUrl:product.image?.src??null,referralCode:getAuthorizedReferralShareCode(),productId:product.id});
  async function share(){playSonicCue("share");await sharing.share(shareInput())}

  return (
    <article
      className={`catalog-card product-card-premium brand-${visualTheme.brandId}`}
      style={cardStyle}
      data-product-id={product.id}
      data-product-brand={product.brand}
      data-product-category={product.category}
      data-product-subcategory={product.subcategory ?? ""}
      data-product-price={product.price?.amount ?? ""}
      data-product-stock={product.stock.status}
      data-sector-theme={visualTheme.sectorId}
      data-brand-theme={visualTheme.brandId}
      data-visual-context={visualContext}
    >
      <div className="product-visual">
        <span className="product-card-watermark" aria-hidden="true">{visualTheme.watermarkLabel}</span>
        {product.image ? (
          <Image className="product-image" src={product.image.src} alt={product.image.alt} width={900} height={1200} sizes="(max-width: 680px) 50vw, (max-width: 1100px) 50vw, 33vw" loading={eagerImage ? "eager" : "lazy"} decoding="async" unoptimized />
        ) : (
          <>
            <div className="product-monogram" aria-hidden="true"><span>{initials}</span></div>
            <span className="image-status">FOTO EN ACTUALIZACIÓN</span>
          </>
        )}
        <div className="product-media-actions">
          <div className="card-tools">
            <button type="button" aria-label={favorite ? "Quitar de favoritos" : "Guardar en favoritos"} onClick={toggleFavorite} className={favorite ? "active" : ""}>
              <Heart size={18} fill={favorite ? "currentColor" : "none"} />
            </button>
            <button type="button" aria-label="Compartir producto" disabled={sharing.busy} onPointerDown={()=>sharing.prepare(shareInput())} onPointerEnter={()=>sharing.prepare(shareInput())} onFocus={()=>sharing.prepare(shareInput())} onClick={share}><Share2 size={18} /></button>
          </div>
          {product.image ? <ProductMediaViewer image={product.image} productName={product.name} card /> : null}
        </div>
      </div>
      <div className="catalog-card-body">
        <p className="product-brand">{product.brand}</p>
        <h3>{product.name}</h3>
        {product.description ? <p className="product-description">{product.description}</p> : null}
        {product.model ? <dl className="product-card-specs"><div><dt>Modelo</dt><dd>{product.model}</dd></div></dl> : null}
        {features.length > 0 ? <details className="product-card-features"><summary>{features.length} características <span aria-hidden="true">⌄</span></summary><ul>{features.map((feature, index) => <li key={`${index}-${feature}`}>{feature}</li>)}</ul></details> : null}
        <div className={`product-card-commerce ${priceLabel ? "has-price" : "price-pending"}`}>
          {installmentPrice && featuredPlan ? <div className="product-card-installment-hero"><span>{featuredPlan.installments} cuotas de</span><strong>{installmentPrice}</strong><small>Cuotas orientativas</small></div> : priceLabel ? <span className="product-card-installments">{financing.loading?"Consultando cuotas…":"Consultá las opciones de cuotas"}</span> : <strong className="product-card-price-pending">Consultá precio y opciones de pago</strong>}
          {priceLabel ? <small className="product-card-cash">Contado: {priceLabel}</small> : null}
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
      {sharing.dialog}
    </article>
  );
}
