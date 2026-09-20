"use client";

import Image from "next/image";
import type { AdminProductCardModel } from "../../../lib/internal/admin/product-card-model";

interface Props {
  product: AdminProductCardModel;
  selected?: boolean;
  onSelect?: (id: string) => void;
  onAction?: (featureId: string, productId: string) => void;
  onQuickActions?: (productId: string) => void;
}

const money = (value: number | null) => value === null ? "A confirmar" : `$${Math.round(value).toLocaleString("es-AR")}`;

export function AdminProductCard({ product, selected = false, onSelect, onAction, onQuickActions }: Props) {
  const editAction = product.primaryActions.find((action) => action.featureId === "catalog.product.edit");
  const shareAction = product.primaryActions.find((action) => action.featureId === "store.share");
  const overflowActions = [
    ...product.primaryActions.filter((action) => action !== editAction && action !== shareAction),
    ...product.secondaryActions,
    ...product.moreActions,
  ];
  const stockLabel = product.stockState === "in_stock" ? "Disponible" : product.stockState === "low_stock" ? "Últimas unidades" : "Sin stock";

  return (
    <article className={`admin-product-card${selected ? " is-selected" : ""}`} data-product-id={product.id}>
      <header className="admin-product-card__top">
        <label className="admin-product-card__select">
          <input type="checkbox" checked={selected} onChange={() => onSelect?.(product.id)} />
          <span>Seleccionar</span>
        </label>
        <span className={`admin-product-card__age age-${product.priceAge.status}`}>
          {product.priceAge.days === null ? "Sin fecha" : `${product.priceAge.days} días`}
        </span>
      </header>

      <div className="admin-product-card__media">
        {product.imageUrl ? <Image src={product.imageUrl} alt="" width={480} height={360} loading="lazy" unoptimized /> : <div className="admin-product-card__noimage">📷<small>Sin foto</small></div>}
        <span className={`admin-product-card__stock stock-${product.stockState}`}>{stockLabel}</span>
      </div>

      <div className="admin-product-card__body">
        <div className="admin-product-card__eyebrow">{product.category} · {product.supplier}</div>
        <h3>{product.name}</h3>
        <div className="admin-product-card__prices">
          <div><small>Costo</small><strong>{money(product.costArs)}</strong></div>
          <div><small>Contado</small><strong>{money(product.salePrice)}</strong></div>
        </div>
        {product.badges.length > 0 && <div className="admin-product-card__badges">{product.badges.map((badge) => <span key={badge}>{badge}</span>)}</div>}
      </div>

      <div className="admin-product-card__actions">
        <button type="button" className="v418a-card-trigger" onClick={() => onQuickActions?.(product.id)}>⚡ Acciones rápidas</button>
        {editAction ? <button type="button" onClick={() => onAction?.(editAction.featureId, product.id)}>{editAction.icon} {editAction.label}</button> : null}
        {shareAction ? <button type="button" onClick={() => onAction?.(shareAction.featureId, product.id)}>{shareAction.icon} {shareAction.label}</button> : null}
      </div>
      <details className="admin-product-card__more">
        <summary>Herramientas del producto</summary>
        <div>
          {overflowActions.map((action) => (
            <button key={action.featureId} type="button" onClick={() => onAction?.(action.featureId, product.id)}>{action.icon} {action.label}</button>
          ))}
        </div>
      </details>
    </article>
  );
}
