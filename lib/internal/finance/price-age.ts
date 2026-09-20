export interface PriceAgeInput {
  priceUpdatedAt?: number | null;
  priceConfirmedAt?: number | null;
  createdAt?: number | null;
}

export type PriceAgeStatus = "unknown" | "fresh" | "warning" | "review";

export interface PriceAgeResult {
  status: PriceAgeStatus;
  days: number | null;
  effectiveTimestamp: number | null;
}

export function effectivePriceTimestamp(input: PriceAgeInput): number | null {
  const candidates = [input.priceUpdatedAt, input.priceConfirmedAt, input.createdAt]
    .map((value) => Number(value) || 0)
    .filter((value) => value > 0);
  return candidates.length ? Math.max(...candidates) : null;
}

export function priceAgeStatus(input: PriceAgeInput, now = Date.now()): PriceAgeResult {
  const effectiveTimestamp = effectivePriceTimestamp(input);
  if (!effectiveTimestamp) return { status: "unknown", days: null, effectiveTimestamp: null };
  const days = Math.max(0, Math.floor((now - effectiveTimestamp) / 86_400_000));
  if (days >= 30) return { status: "review", days, effectiveTimestamp };
  if (days >= 20) return { status: "warning", days, effectiveTimestamp };
  return { status: "fresh", days, effectiveTimestamp };
}
