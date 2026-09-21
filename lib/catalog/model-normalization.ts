const TOKEN_RE = /[A-Za-z0-9]+(?:[-_.\/][A-Za-z0-9]+)*/g;

const EXCLUDED_PREFIXES = [
  /^rod\d+$/i,
  /^setx\d+$/i,
  /^gamma\d+w$/i,
  /^fullhd$/i,
  /^uhd4k$/i,
  /^qled4k$/i,
];

function compact(value: string) {
  return value.replace(/[-_.\/]/g, "");
}

/**
 * Extracts a model only when the product name itself contains a strong
 * alphanumeric code. It deliberately ignores capacities, dimensions and
 * generic pack counts so we do not turn specs into models.
 */
export function extractHighConfidenceModelFromName(name: string): string | null {
  const tokens = String(name ?? "").match(TOKEN_RE) ?? [];

  for (const token of tokens) {
    const normalized = compact(token);
    if (normalized.length < 5) continue;
    if (!/^[A-Za-z]/.test(token)) continue;
    if (!/[A-Za-z]/.test(normalized) || !/\d/.test(normalized)) continue;
    if (EXCLUDED_PREFIXES.some((rule) => rule.test(normalized))) continue;

    // Pure specification-like tokens: 24PZAS, 330LTR, 1500W, 20V, etc.
    if (/^\d+(w|v|kg|g|l|lt|lts|ltr|ml|cm|mm|hz|rpm|mah|gb|tb|mp|cc|kcal|pzs|pzas|piezas)$/i.test(normalized)) continue;

    // Short alpha prefix + digits only is often a model (FC200, L3310, N3350),
    // so keep it. But obvious wheel-size aliases are excluded above.
    return token;
  }

  return null;
}

export const v16ModelNormalizationContract = Object.freeze({
  source: "product-name-only",
  providerCodeUsedAsModel: false,
  dimensionsUsedAsModel: false,
  capacitiesUsedAsModel: false,
});
