export type OfferKind = "Oferta del día" | "Contado especial" | "2 cuotas sin interés" | "3 cuotas sin interés" | "Outlet";

export interface LabOfferState {
  enabled: boolean;
  kind: OfferKind;
  productId: string;
  productName: string;
  imageSrc: string;
  previousPriceArs: number;
  promotionalPriceArs: number;
  stock: number;
  validity: string;
}

export const offerStorageKey = "amarango_v49_offer_lab";

export const defaultLabOffer: LabOfferState = Object.freeze({
  enabled: true,
  kind: "Oferta del día",
  productId: "lab-ps5-slim",
  productName: "PlayStation 5 Slim",
  imageSrc: "/assets/v16-generated/playstation-5-slim-feature-v1.webp",
  previousPriceArs: 1_150_000,
  promotionalPriceArs: 999_999,
  stock: 3,
  validity: "Vista previa local",
});

const serverSnapshot = JSON.stringify(defaultLabOffer);

export function parseLabOffer(raw: string | null): LabOfferState {
  if (!raw) return { ...defaultLabOffer };
  try {
    const value = JSON.parse(raw) as Partial<LabOfferState>;
    if (typeof value.enabled !== "boolean" || typeof value.productName !== "string") return { ...defaultLabOffer };
    return {
      ...defaultLabOffer,
      ...value,
      imageSrc: typeof value.imageSrc === "string" && value.imageSrc.trim() ? value.imageSrc.trim() : defaultLabOffer.imageSrc,
      previousPriceArs: Number.isFinite(value.previousPriceArs) ? Number(value.previousPriceArs) : defaultLabOffer.previousPriceArs,
      promotionalPriceArs: Number.isFinite(value.promotionalPriceArs) ? Number(value.promotionalPriceArs) : defaultLabOffer.promotionalPriceArs,
      stock: Number.isFinite(value.stock) ? Math.max(0, Number(value.stock)) : defaultLabOffer.stock,
    };
  } catch {
    return { ...defaultLabOffer };
  }
}

export function getOfferServerSnapshot() {
  return serverSnapshot;
}

export function getOfferSnapshot() {
  return typeof window === "undefined" ? serverSnapshot : window.localStorage.getItem(offerStorageKey) ?? serverSnapshot;
}

export function subscribeOffer(listener: () => void) {
  if (typeof window === "undefined") return () => {};
  const receive = (event: Event) => {
    if (event instanceof StorageEvent && event.key !== offerStorageKey) return;
    listener();
  };
  window.addEventListener("storage", receive);
  window.addEventListener("amarango:lab-offer-change", receive);
  return () => {
    window.removeEventListener("storage", receive);
    window.removeEventListener("amarango:lab-offer-change", receive);
  };
}

export function saveLabOffer(value: LabOfferState) {
  window.localStorage.setItem(offerStorageKey, JSON.stringify(value));
  window.dispatchEvent(new Event("amarango:lab-offer-change"));
}
