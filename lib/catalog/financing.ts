import type { FinancingOption } from "./types";

/**
 * Regla comercial V16 vigente para planes fijos calculados sobre el precio
 * contado publicado por el catálogo.
 *
 * 2 cuotas: +15%
 * 4 cuotas: +35%
 * 6 cuotas: +55%
 *
 * Se redondea cada cuota al peso entero más cercano y el total financiado
 * se deriva de cuota * cantidad para mantener consistencia visual.
 */
const FIXED_INSTALLMENT_MARKUPS = Object.freeze([
  { installments: 2, markup: 0.15 },
  { installments: 4, markup: 0.35 },
  { installments: 6, markup: 0.55 },
] as const);

export function buildFixedInstallments(cashAmount: number): FinancingOption[] {
  if (!Number.isFinite(cashAmount) || cashAmount <= 0) return [];

  return FIXED_INSTALLMENT_MARKUPS.map(({ installments, markup }) => {
    const installmentValue = Math.round((cashAmount * (1 + markup)) / installments);
    const totalValue = installmentValue * installments;

    return {
      installments,
      installmentAmount: { amount: installmentValue, currency: "ARS" },
      totalAmount: { amount: totalValue, currency: "ARS" },
      label: `${installments} cuotas fijas`,
    };
  });
}

export const v16FixedInstallmentMarkups = FIXED_INSTALLMENT_MARKUPS;
