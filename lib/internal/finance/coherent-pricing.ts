export type AmarangoMarkupPercent = 80 | 60 | 50 | 40 | 30;

export const AMARANGO_PRICING_PIPELINE_VERSION = "2026-09-25";
export const AMARANGO_STRATEGIC_TERMINATIONS = Object.freeze([299, 499, 799, 999] as const);

const COHERENCE_FLOORS_CENTS = Object.freeze({
  from50k: 8_999_820,   // $89.998,20 = $49.999 × 1,80
  from100k: 15_999_840, // $159.998,40 = $99.999 × 1,60
  from250k: 37_499_850, // $374.998,50 = $249.999 × 1,50
  from350k: 48_999_860, // $489.998,60 = $349.999 × 1,40
});

export interface CoherentCashPriceQuote {
  cost: number;
  markupPercent: AmarangoMarkupPercent;
  markupPrice: number;
  coherenceFloor: number | null;
  coherenceApplied: boolean;
  coherentPrice: number;
  commercialPrice: number;
  commercialTermination: number;
  commercialAdjustment: number;
}

function positiveFinite(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${label} must be a positive finite number`);
  return value;
}

export function toMoneyCents(valuePesos: number): number {
  if (!Number.isFinite(valuePesos)) throw new RangeError("money value must be finite");
  return Math.round(valuePesos * 100);
}

export function fromMoneyCents(valueCents: number): number {
  if (!Number.isInteger(valueCents)) throw new RangeError("money cents must be an integer");
  return valueCents / 100;
}

export function markupForRealCost(cost: number): AmarangoMarkupPercent {
  positiveFinite(cost, "cost");
  if (cost < 50_000) return 80;
  if (cost < 100_000) return 60;
  if (cost < 250_000) return 50;
  if (cost < 350_000) return 40;
  return 30;
}

function coherenceFloorCentsForCost(costCents: number): number | null {
  if (costCents >= 35_000_000) return COHERENCE_FLOORS_CENTS.from350k;
  if (costCents >= 25_000_000) return COHERENCE_FLOORS_CENTS.from250k;
  if (costCents >= 10_000_000) return COHERENCE_FLOORS_CENTS.from100k;
  if (costCents >= 5_000_000) return COHERENCE_FLOORS_CENTS.from50k;
  return null;
}

export function coherenceFloorForRealCost(cost: number): number | null {
  positiveFinite(cost, "cost");
  const floorCents = coherenceFloorCentsForCost(toMoneyCents(cost));
  return floorCents === null ? null : fromMoneyCents(floorCents);
}

/**
 * Chooses the first Amarango strategic price ending in 299/499/799/999
 * that is greater than or equal to the coherent mathematical price.
 * It is intentionally upward-only: commercial rounding can never break
 * the monotonic coherence floor.
 */
export function strategicRoundUp(valuePesos: number): number {
  positiveFinite(valuePesos, "valuePesos");
  const valueCents = toMoneyCents(valuePesos);
  const wholePesos = Math.floor(valueCents / 100);
  const baseThousand = Math.floor(wholePesos / 1_000) * 1_000;

  for (const ending of AMARANGO_STRATEGIC_TERMINATIONS) {
    const candidatePesos = baseThousand + ending;
    if (candidatePesos * 100 >= valueCents) return candidatePesos;
  }
  return baseThousand + 1_000 + AMARANGO_STRATEGIC_TERMINATIONS[0];
}

export function quoteCoherentCashPrice(cost: number): CoherentCashPriceQuote {
  positiveFinite(cost, "cost");
  const costCents = toMoneyCents(cost);
  const markupPercent = markupForRealCost(cost);
  const markupPriceCents = Math.round(costCents * (100 + markupPercent) / 100);
  const floorCents = coherenceFloorCentsForCost(costCents);
  const coherentPriceCents = floorCents === null ? markupPriceCents : Math.max(markupPriceCents, floorCents);
  const coherentPrice = fromMoneyCents(coherentPriceCents);
  const commercialPrice = strategicRoundUp(coherentPrice);

  return Object.freeze({
    cost: fromMoneyCents(costCents),
    markupPercent,
    markupPrice: fromMoneyCents(markupPriceCents),
    coherenceFloor: floorCents === null ? null : fromMoneyCents(floorCents),
    coherenceApplied: floorCents !== null && floorCents > markupPriceCents,
    coherentPrice,
    commercialPrice,
    commercialTermination: commercialPrice % 1_000,
    commercialAdjustment: commercialPrice - coherentPrice,
  });
}
