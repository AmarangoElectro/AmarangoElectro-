export interface V415ClientCardProduct {
  readonly legacyMappingKey: string;
  readonly name: string;
  readonly brand: string | null;
  readonly model: string | null;
  readonly memory: string | null;
  readonly ram: string | null;
  readonly image: string;
  readonly cashPriceARS: number;
  readonly financing: readonly unknown[];
  readonly availability: "unknown";
  readonly featureDetails: readonly {
    readonly label: string;
    readonly value: string;
    readonly provenance: string;
    readonly confidence: number;
  }[];
}

export interface V415ClientCardViewModel {
  readonly productKey: string;
  readonly fullName: string;
  readonly brandModel: string;
  readonly image: string;
  readonly specs: readonly string[];
  readonly features: readonly { readonly label: string; readonly value: string }[];
  readonly cashPriceARS: number;
  readonly financing: null;
  readonly availabilityLabel: "Disponibilidad a confirmar";
  readonly primaryAction: "Ver producto";
  readonly favoriteEnabled: true;
  readonly shareEnabled: true;
}

export function createV415ClientCard(product: V415ClientCardProduct): V415ClientCardViewModel {
  if (!Number.isFinite(product.cashPriceARS) || product.cashPriceARS <= 0) {
    throw new Error("positive_cash_price_required");
  }
  if (!product.image.startsWith("https://")) throw new Error("https_image_required");
  if (product.financing.length > 0) throw new Error("unaudited_financing_forbidden");
  return Object.freeze({
    productKey: product.legacyMappingKey,
    fullName: product.name,
    brandModel: [product.brand, product.model].filter(Boolean).join(" · "),
    image: product.image,
    specs: Object.freeze([product.memory, product.ram].filter((value): value is string => Boolean(value))),
    features: Object.freeze(product.featureDetails.slice(0, 4).map(({ label, value }) => ({ label, value }))),
    cashPriceARS: product.cashPriceARS,
    financing: null,
    availabilityLabel: "Disponibilidad a confirmar",
    primaryAction: "Ver producto",
    favoriteEnabled: true,
    shareEnabled: true,
  });
}

