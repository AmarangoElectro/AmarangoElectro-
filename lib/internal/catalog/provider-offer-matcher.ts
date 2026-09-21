import evidence from "@/fixtures/v16-internal-provider-offers-20260920.json";
import { z } from "zod";

const offerSchema = z.object({
  sourceProductId: z.string().min(1),
  name: z.string().min(1),
  sourceCategory: z.string(),
  provider: z.string().min(1),
  supplierCode: z.string().nullable(),
  salePrice: z.number().positive(),
  image: z.string().url().startsWith("https://").nullable(),
  availability: z.enum(["available","unavailable"]),
  updatedAt: z.string().min(1),
}).strict();

const evidenceSchema = z.object({
  evidence_status: z.literal("internal_provider_offer_snapshot"),
  source_reference: z.string().min(1),
  captured_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  safety: z.object({
    supabase_written: z.literal(false),
    costs_included: z.literal(false),
    credentials_included: z.literal(false),
    internal_only: z.literal(true),
  }).strict(),
  offers: z.array(offerSchema).min(1),
}).strict();

const parsed = evidenceSchema.parse(evidence);

export type InternalProviderOffer = z.infer<typeof offerSchema>;

export type CatalogMatchSignal = {
  nameSimilarity: number;
  sameBrand: boolean;
  sharedModelTokens: string[];
  supplierCodeSimilarity: number;
  sameCategory: boolean;
  numericConflict: boolean;
  visualEvidence: "pending" | "not_available";
};

export type CatalogMatchCandidate = {
  id: string;
  left: InternalProviderOffer;
  right: InternalProviderOffer;
  score: number;
  confidence: "high" | "medium";
  signals: CatalogMatchSignal;
  humanReviewRequired: true;
  suggestedOfferSourceProductId: string;
  suggestedSalePrice: number;
  rationale: string[];
};

const KNOWN_BRANDS = [
  "noblex","samsung","lg","philips","rca","tcl","kanji","kanjihome","sony","jbl","xiaomi",
  "motorola","apple","poco","infinix","delhi","codini","piero","kretz","tramontina","calabria",
  "dinax","philco","bgh","jvc","enova","telefunken","stanley","gamma","luqstoff","omaha",
];

const STOPWORDS = new Set([
  "de","del","la","el","los","las","con","sin","para","por","y","en","c","nuevo","nueva",
  "smart","tv","led","android","google","inverter","color","gris","silver","negro","blanco",
]);

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-AR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function tokenSet(value: string) {
  return new Set(normalize(value).split(" ").filter((token) => token.length > 1 && !STOPWORDS.has(token)));
}

function jaccard(left: string, right: string) {
  const a = tokenSet(left);
  const b = tokenSet(right);
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  return intersection / new Set([...a, ...b]).size;
}

function inferredBrand(value: string) {
  const normalized = normalize(value);
  return KNOWN_BRANDS.find((brand) => normalized.includes(brand)) ?? null;
}

function modelTokens(value: string) {
  return normalize(value)
    .split(" ")
    .filter((token) => /[a-z]/.test(token) && /\d/.test(token) && token.length >= 4)
    .filter((token) => !/^\d+(kg|w|l|lt|lts|cm|mm|gb|tb)$/.test(token));
}

function importantNumbers(value: string) {
  return normalize(value)
    .split(" ")
    .filter((token) => /^\d{2,4}$/.test(token))
    .map(Number)
    .filter((value) => value >= 10);
}

function supplierCodeSimilarity(left: string | null, right: string | null) {
  if (!left || !right) return 0;
  const a = normalize(left).replace(/\s/g, "");
  const b = normalize(right).replace(/\s/g, "");
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.endsWith(b) || b.endsWith(a)) return 0.9;
  if (a.includes(b) || b.includes(a)) return 0.75;
  return 0;
}

function numericConflict(left: string, right: string) {
  const a = importantNumbers(left);
  const b = importantNumbers(right);
  if (!a.length || !b.length) return false;
  return a.every((value) => !b.includes(value)) && b.every((value) => !a.includes(value));
}

function candidateScore(left: InternalProviderOffer, right: InternalProviderOffer) {
  const nameSimilarity = jaccard(left.name, right.name);
  const leftBrand = inferredBrand(left.name);
  const rightBrand = inferredBrand(right.name);
  const sameBrand = Boolean(leftBrand && rightBrand && leftBrand === rightBrand);
  const leftModels = modelTokens(left.name);
  const rightModels = modelTokens(right.name);
  const sharedModelTokens = leftModels.filter((token) => rightModels.includes(token));
  const codeSimilarity = supplierCodeSimilarity(left.supplierCode, right.supplierCode);
  const sameCategory = normalize(left.sourceCategory) === normalize(right.sourceCategory);
  const hasNumericConflict = numericConflict(left.name, right.name);

  let score = (nameSimilarity * 0.5) + (sameBrand ? 0.2 : 0) + (sameCategory ? 0.1 : 0);
  if (sharedModelTokens.length) score += 0.25;
  score += codeSimilarity * 0.25;
  if (hasNumericConflict) score -= 0.25;
  if (leftBrand && rightBrand && leftBrand !== rightBrand) score -= 0.35;

  return {
    score: Math.max(0, Math.min(1, score)),
    signals: {
      nameSimilarity,
      sameBrand,
      sharedModelTokens,
      supplierCodeSimilarity: codeSimilarity,
      sameCategory,
      numericConflict: hasNumericConflict,
      visualEvidence: left.image && right.image ? "pending" as const : "not_available" as const,
    },
  };
}

function recommendedOffer(left: InternalProviderOffer, right: InternalProviderOffer) {
  const available = [left, right].filter((offer) => offer.availability === "available");
  const pool = available.length ? available : [left, right];
  return pool.slice().sort((a, b) => {
    if (a.salePrice !== b.salePrice) return a.salePrice - b.salePrice;
    return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
  })[0];
}

export function getCatalogMatchCandidates(): CatalogMatchCandidate[] {
  const offers = parsed.offers;
  const candidates: CatalogMatchCandidate[] = [];

  for (let i = 0; i < offers.length; i += 1) {
    for (let j = i + 1; j < offers.length; j += 1) {
      const left = offers[i];
      const right = offers[j];
      if (left.sourceProductId === right.sourceProductId) continue;

      const exactPublicName = normalize(left.name) === normalize(right.name);
      const differentProvider = normalize(left.provider) !== normalize(right.provider);
      const { score, signals } = candidateScore(left, right);

      // No se fusiona automáticamente. Se arma una cola conservadora de revisión.
      if (!exactPublicName && score < 0.72) continue;
      if (!differentProvider && !exactPublicName) continue;

      const suggested = recommendedOffer(left, right);
      const rationale: string[] = [];
      if (exactPublicName) rationale.push("Mismo nombre normalizado");
      if (signals.sameBrand) rationale.push("Misma marca detectada");
      if (signals.sharedModelTokens.length) rationale.push(`Modelo coincidente: ${signals.sharedModelTokens.join(", ")}`);
      if (signals.supplierCodeSimilarity >= 0.75) rationale.push("Códigos de proveedor compatibles");
      if (signals.sameCategory) rationale.push("Misma categoría de origen");
      if (signals.visualEvidence === "pending") rationale.push("Comparación visual pendiente de confirmación humana");

      candidates.push({
        id: [left.sourceProductId, right.sourceProductId].sort().join("::"),
        left,
        right,
        score: Number(score.toFixed(2)),
        confidence: score >= 0.85 || exactPublicName ? "high" : "medium",
        signals,
        humanReviewRequired: true,
        suggestedOfferSourceProductId: suggested.sourceProductId,
        suggestedSalePrice: suggested.salePrice,
        rationale,
      });
    }
  }

  return candidates.sort((a, b) => b.score - a.score);
}

export const internalProviderOfferEvidence = Object.freeze({
  capturedAt: parsed.captured_at,
  count: parsed.offers.length,
  providers: Object.freeze([...new Set(parsed.offers.map((offer) => offer.provider))].sort()),
});
