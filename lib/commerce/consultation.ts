import type { Product } from "@/lib/catalog";

export interface ConsultationPayload {
  productId: string;
  product: string;
  model: string | null;
  category: string;
  url: string;
  source: "amarango-v16";
}

export function buildConsultationPayload(product: Product, url: string): ConsultationPayload {
  return {
    productId: product.id,
    product: product.name,
    model: product.model,
    category: product.category,
    url,
    source: "amarango-v16",
  };
}

export function announceConsultation(payload: ConsultationPayload) {
  window.dispatchEvent(
    new CustomEvent<ConsultationPayload>("amarango:consult-product", {
      detail: payload,
    }),
  );
}
