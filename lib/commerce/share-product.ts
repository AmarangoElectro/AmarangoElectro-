export interface ShareProductInput {
  name: string;
  url: string;
  cashPriceArs?: number | null;
  installments?: readonly { installments: number; amountArs: number | null }[];
  imageUrl?: string | null;
}

export type ShareProductResult = "shared" | "copied" | "cancelled";

interface ShareCapabilities {
  share?: (data: ShareData) => Promise<void>;
  clipboard?: { writeText: (text: string) => Promise<void> };
}

function isAbortError(error: unknown) {
  return Boolean(error && typeof error === "object" && "name" in error && error.name === "AbortError");
}

const money = (value: number) => `$${Math.round(value).toLocaleString("es-AR")}`;

export function buildShareProductText(product: ShareProductInput) {
  const lines = [product.name];
  for (const plan of product.installments ?? []) {
    if ([2, 4, 6].includes(plan.installments) && plan.amountArs !== null) lines.push(`${plan.installments} cuotas de ${money(plan.amountArs)}`);
  }
  if (product.cashPriceArs !== null && product.cashPriceArs !== undefined) lines.push(`Contado ${money(product.cashPriceArs)}`);
  lines.push("AmarangoElectro");
  return lines.join("\n");
}

/** Compartir individual: la imagen queda declarada para el futuro, sin fetch, WhatsApp, Margarita ni endpoints. */
export async function shareProductLink(
  product: ShareProductInput,
  capabilities: ShareCapabilities = navigator,
): Promise<ShareProductResult> {
  const text = buildShareProductText(product);
  const data: ShareData = {
    title: product.name,
    text,
    url: product.url,
  };

  if (capabilities.share) {
    try {
      await capabilities.share(data);
      return "shared";
    } catch (error) {
      if (isAbortError(error)) return "cancelled";
    }
  }

  if (!capabilities.clipboard?.writeText) throw new Error("Share is not available");
  await capabilities.clipboard.writeText(`${text}\n${product.url}`);
  return "copied";
}
