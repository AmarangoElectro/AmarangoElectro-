"use client";

import { Heart, Share2, ShoppingBag } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import type { Product } from "@/lib/catalog";
import { announcePurchaseIntent, buildPurchaseIntentProduct } from "@/lib/commerce/purchase-intent";
import {useProductShare} from "@/components/ui/use-product-share";
import { playSonicCue } from "@/lib/ux/sonic-feedback";
import { getAuthorizedReferralShareCode, getPendingAttribution } from "@/lib/growth/referral-attribution-client";
import {
  getFavoritesServerSnapshot,
  getFavoritesSnapshot,
  parseFavoritesSnapshot,
  subscribeFavorites,
  toggleFavoriteId,
} from "@/lib/commerce/favorites-store";

export function ProductActions({ product }: { product: Product }) {
  const favoritesSnapshot = useSyncExternalStore(subscribeFavorites, getFavoritesSnapshot, getFavoritesServerSnapshot);
  const favorite = parseFavoritesSnapshot(favoritesSnapshot).has(product.id);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => { setReferralCode(getAuthorizedReferralShareCode()); }, []);

  function toggleFavorite() {
    try {
      const isFavorite = toggleFavoriteId(product.id);
      playSonicCue("favorite");
      toast.success(isFavorite ? "Guardado en favoritos" : "Quitado de favoritos");
    } catch {
      toast.error("No pudimos guardar el favorito.");
    }
  }

  const sharing=useProductShare();
  const shareInput=()=>({name:product.name,url:window.location.href,cashPriceArs:product.price?.amount??null,installments:product.financing.map(plan=>({installments:plan.installments,amountArs:plan.installmentAmount?.amount??null,totalArs:plan.totalAmount?.amount??null})),imageUrl:product.image?.src??null,referralCode,productId:product.id});
  async function share(){playSonicCue("share");await sharing.share(shareInput())}

  function consult() {
    const payload = buildPurchaseIntentProduct(product, window.location.href, getPendingAttribution());
    announcePurchaseIntent(payload);
    playSonicCue("intent");
  }

  return (
    <div className="product-actions-block">
      <div className="product-actions">
        <button className="consult-button" type="button" onClick={consult}><ShoppingBag size={19} /> Quiero este</button>
        <button type="button" className="referral-share-button" aria-label={referralCode ? "Compartir y obtener beneficios" : "Compartir producto"} disabled={sharing.busy} onPointerDown={()=>sharing.prepare(shareInput())} onFocus={()=>sharing.prepare(shareInput())} onClick={share}><Share2 size={19} /><span>{referralCode ? "Compartir y obtener beneficios" : "Compartir"}</span></button>
        <button type="button" aria-label={favorite ? "Quitar de favoritos" : "Guardar en favoritos"} className={favorite ? "active" : ""} onClick={toggleFavorite}><Heart size={19} fill={favorite ? "currentColor" : "none"} /></button>
      </div>
      {sharing.dialog}
    </div>
  );
}
