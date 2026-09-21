const BRAND_RULES = [
  { brand: "Kanji Tools", patterns: [/\bkanji\s*tools\b/i, /\bkanjitools\b/i, /\bkjt[-\s]/i] },
  { brand: "Kanjihome", patterns: [/\bkanji\s*home\b/i, /\bkanjihome\b/i, /\bkanihome\b/i] },
  { brand: "Lusqtoff", patterns: [/\blusqtoff\b/i, /\bl[üu]qstoff\b/i] },
  { brand: "Martin & Martin", patterns: [/\bmartin\s*&\s*martin\b/i] },
  { brand: "Westinghouse", patterns: [/\bwestinghouse\b/i, /\bwestinhouse\b/i] },
  { brand: "Black & Decker", patterns: [/\bblack\s*&\s*decker\b/i] },
  { brand: "Ken Brown", patterns: [/\bken\s+brown\b/i] },
  { brand: "Poppy Baby", patterns: [/\bpoppy\s+baby\b/i] },
  { brand: "Alien Tech", patterns: [/\balien\s+tech\b/i] },
  { brand: "Air Cool", patterns: [/\bair\s+cool\b/i] },
  { brand: "Stella Dustin", patterns: [/\bstella\s+dustin\b/i] },
  { brand: "Milenial Venezia", patterns: [/\bmilenial\s+venezia\b/i] },
  { brand: "Usman Win", patterns: [/\busman\s+win\b/i] },
  { brand: "Eurotech", patterns: [/\beurotech\b/i] },
  { brand: "Westinghouse", patterns: [/\bwestinghouse\b/i, /\bwestinhouse\b/i] },
  { brand: "Fedders", patterns: [/\bfedders\b/i, /\bfedeers\b/i] },
  { brand: "Kanji", patterns: [/\bkanji\b/i] },
  { brand: "LG", patterns: [/(?:^|[^a-z0-9])lg(?:$|[^a-z0-9])/i] },
  { brand: "OM", patterns: [/(?:^|[^a-z0-9])om(?:$|[^a-z0-9])/i] },
] as const;

/**
 * Conservative brand normalization for future catalog imports.
 * Short brands such as LG/OM require token boundaries so they cannot match
 * inside words like "PULGADAS" or "Bomba".
 */
export function inferCanonicalBrandFromName(name: string): string | null {
  const value = String(name ?? "").trim();
  if (!value) return null;

  for (const rule of BRAND_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(value))) return rule.brand;
  }

  return null;
}

export const v16BrandNormalizationRules = BRAND_RULES;
