"use client";

import Image from "next/image";
import Link from "./store-link";
import { Share2, ShieldCheck } from "lucide-react";
import { useMemo, useSyncExternalStore } from "react";
import { getOfferServerSnapshot, getOfferSnapshot, parseLabOffer, subscribeOffer } from "@/lib/os-lab/offers-store";
import { toast } from "sonner";

const ars = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

export function OffersShowcase({ advisor = false }: { advisor?: boolean }) {
  const raw = useSyncExternalStore(subscribeOffer, getOfferSnapshot, getOfferServerSnapshot);
  const offer = useMemo(() => parseLabOffer(raw), [raw]);

  if (!offer.enabled) return null;

  async function shareOffer() {
    const text = `${offer.productName}\n${offer.kind}: ${ars.format(offer.promotionalPriceArs)}\nAmarangoElectro`;
    try {
      if (navigator.share) await navigator.share({ title: offer.productName, text, url: window.location.origin });
      else await navigator.clipboard.writeText(`${text}\n${window.location.origin}`);
      toast.success(navigator.share ? "Oferta lista para compartir" : "Oferta copiada");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) toast.error("No pudimos preparar el contenido para compartir.");
    }
  }

  return (
    <section className={`offers-showcase ${advisor ? "offers-advisor" : ""}`} aria-labelledby={advisor ? "advisor-offer-title" : "store-offer-title"}>
      <div className="offers-showcase-media">
        <Image src={offer.imageSrc} alt={offer.productName} fill sizes="(max-width: 760px) 100vw, 50vw" unoptimized />
      </div>
      <div className="offers-showcase-copy">
        <p className="eyebrow orange">OFERTAS & OUTLET</p>
        <span className="offer-kind">{offer.kind}</span>
        <h2 id={advisor ? "advisor-offer-title" : "store-offer-title"}>{offer.productName}</h2>
        <p>Una selección con condición especial, sujeta a disponibilidad.</p>
        <div className="offer-prices"><del>{ars.format(offer.previousPriceArs)}</del><strong>{ars.format(offer.promotionalPriceArs)}</strong></div>
        <div className="offer-meta"><span>Stock: {offer.stock}</span><span>{offer.validity}</span></div>
        <div className="offer-actions">
          <Link href="/categoria/gaming">Ver categoría</Link>
          <button type="button" onClick={shareOffer}><Share2 size={17} /> Compartir</button>
        </div>
        <small className="offer-lab-note"><ShieldCheck size={14} /> Precio de referencia — confirmá el valor final al consultar.</small>
      </div>
    </section>
  );
}
