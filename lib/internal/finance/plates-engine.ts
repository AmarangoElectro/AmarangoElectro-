import { quoteAmarangoCalculator, type AmarangoCalculatorInput } from "./amarango-calculator";
import { AMARANGO_CURRENT_POLICY, AMARANGO_POLICY_VERSION } from "./amarango-policy";

export type PlateInputMode = "cost" | "sale" | "usd";

export interface PlateBuildInput {
  text: string;
  mode: PlateInputMode;
  fxRate?: number;
  installmentPlans?: readonly number[];
  discountPercent?: 0 | 10 | 15;
}

export interface PlateBuildResult {
  name: string;
  detectedAmount: number;
  mode: PlateInputMode;
  publicSalePrice: number;
  installmentLines: readonly { installments: number; amount: number }[];
  shareText: string;
  privateAdmin: {
    costArs: number;
    costUsd: number | null;
    fxRate: number | null;
    markupPercent: number;
    grossMarginArs: number;
    policyVersion: string;
  };
}

function cleanFormatting(text: string): string {
  return text.replace(/\*?~[^~]*~\*?/g, " ").replace(/[*_]/g, " ");
}

export function detectPlateAmount(text: string, mode: PlateInputMode): number {
  const cleaned = cleanFormatting(text);
  if (mode === "usd") {
    const usdPatterns = [
      /([\d][\d.,]*)\s*(?:u\$s|u\$d|usd|u\$|d[oó]lares?)/i,
      /(?:u\$s|u\$d|usd|u\$|d[oó]lares?)\s*\$?\s*([\d][\d.,]*)/i,
    ];
    for (const pattern of usdPatterns) {
      const match = cleaned.match(pattern);
      if (match) {
        const value = Number(match[1].replace(/\./g, "").replace(",", "."));
        if (Number.isFinite(value) && value > 0 && value < 10_000) return value;
      }
    }
    const plain = cleaned.match(/(?:^|\s)(\d{1,4}(?:[.,]\d{1,2})?)(?:\s|$)/);
    if (plain) return Number(plain[1].replace(",", "."));
    return 0;
  }

  const moneyAfter = cleaned.match(/\$[ \t]*([\d][\d.]*)/);
  if (moneyAfter?.[1]) return Number(moneyAfter[1].replace(/\./g, ""));
  const moneyBefore = cleaned.match(/([\d][\d.]*)[ \t]*\$/m);
  if (moneyBefore?.[1]) return Number(moneyBefore[1].replace(/\./g, ""));
  const fallback = cleaned.match(/(?:^|\s)(\d{5,})(?:\s|$)/);
  return fallback ? Number(fallback[1].replace(/\./g, "")) : 0;
}

export function detectPlateName(text: string): string {
  const lines = text.split(/\r?\n/).map((line) => cleanFormatting(line).trim()).filter(Boolean);
  const candidate = lines.find((line) => /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(line) && !/^\s*[\$\d]/.test(line));
  return (candidate ?? "Producto AmarangoElectro").replace(/\s{2,}/g, " ").slice(0, 140);
}

export function buildPlate(input: PlateBuildInput): PlateBuildResult {
  const detectedAmount = detectPlateAmount(input.text, input.mode);
  if (!detectedAmount) throw new Error("No se encontró un precio válido en el texto pegado");
  const calculatorInput: AmarangoCalculatorInput = {
    mode: input.mode === "cost" ? "cost_ars" : input.mode === "sale" ? "sale_ars" : "cost_usd",
    amount: detectedAmount,
    fxRate: input.fxRate,
    installmentPlans: input.installmentPlans,
    discountPercent: input.discountPercent,
  };
  const quote = quoteAmarangoCalculator(calculatorInput, AMARANGO_CURRENT_POLICY, AMARANGO_POLICY_VERSION);
  const name = detectPlateName(input.text);
  const installmentLines = quote.installments.map((item) => ({ installments: item.installments, amount: item.installmentAmount }));
  const money = (value: number) => `$${Math.round(value).toLocaleString("es-AR")}`;
  const lines = installmentLines.map((item) => `💳 ${item.installments} cuotas fijas de ${money(item.amount)}`);
  const discount = quote.discountPercent > 0 ? `\n🏷️ ${quote.discountPercent}% OFF aplicado` : "";
  const shareText = `*${name.toUpperCase()}*\n\n${lines.join("\n")}\n\n➡️ Contado: ${money(quote.salePrice)}${discount}\nAmarangoElectro 🐝`;

  return Object.freeze({
    name,
    detectedAmount,
    mode: input.mode,
    publicSalePrice: quote.salePrice,
    installmentLines: Object.freeze(installmentLines),
    shareText,
    privateAdmin: Object.freeze({
      costArs: quote.costArs,
      costUsd: quote.costUsd,
      fxRate: quote.fxRate,
      markupPercent: quote.markupPercent,
      grossMarginArs: quote.grossMarginArs,
      policyVersion: quote.policyVersion,
    }),
  });
}
