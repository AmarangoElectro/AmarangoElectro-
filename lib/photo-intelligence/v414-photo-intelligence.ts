import { classifyV414Category } from "./v414-category-classifier";
import type {
  V414ExistingProductEvidence,
  V414PhotoEvidence,
  V414SuggestedProductMetadata,
  V414SuggestionProvenance,
} from "./v414-types";

function valueWithEvidence<T>(visual: T | null | undefined, existing: T | null | undefined) {
  if (visual != null) return { value: visual, provenance: "ocr_extracted" as V414SuggestionProvenance };
  if (existing != null) return { value: existing, provenance: "matched_existing_data" as V414SuggestionProvenance };
  return { value: null, provenance: "unknown" as V414SuggestionProvenance };
}

export function suggestV414ProductMetadata(options: {
  readonly fingerprint: string;
  readonly existing: V414ExistingProductEvidence | null;
  readonly evidence: V414PhotoEvidence;
  readonly cacheHit?: boolean;
}): V414SuggestedProductMetadata {
  const { existing, evidence } = options;
  const brand = valueWithEvidence(evidence.brand, existing?.brand);
  const model = valueWithEvidence(evidence.model, existing?.model);
  const memory = valueWithEvidence(evidence.memory, existing?.memory);
  const ram = valueWithEvidence(evidence.ram, existing?.ram);
  const category = classifyV414Category(
    [existing?.name, ...evidence.detectedText].filter(Boolean).join(" "),
    evidence.category ?? existing?.category,
  );
  const features = evidence.features?.length
    ? [...evidence.features]
    : (existing?.features ?? []).map((value) => ({
      label: "Característica",
      value,
      provenance: "matched_existing_data" as const,
      confidence: 0.95,
    }));
  const known = [brand.value, model.value, memory.value, category.category].filter(Boolean).length;
  const confidence = Math.min(0.99, 0.45 + known * 0.1 + (evidence.detectedText.length ? 0.08 : 0) + (features.length ? 0.05 : 0));
  return Object.freeze({
    suggestedBrand: brand.value,
    suggestedModel: model.value,
    suggestedMemory: memory.value,
    suggestedRam: ram.value,
    suggestedCategory: category.category,
    suggestedSubcategory: evidence.subcategory ?? null,
    suggestedFeatures: Object.freeze(features),
    detectedText: Object.freeze([...evidence.detectedText]),
    confidence,
    provenance: Object.freeze({
      brand: brand.provenance,
      model: model.provenance,
      memory: memory.provenance,
      ram: ram.provenance,
      category: category.provenance,
      subcategory: evidence.subcategory ? "ocr_extracted" : "unknown",
      features: features.length ? features[0].provenance : "unknown",
    }),
    imageFingerprint: options.fingerprint,
    imageKind: evidence.imageKind,
    warnings: Object.freeze([...new Set(evidence.warnings ?? [])]),
    humanApprovalRequired: true,
    analysis: Object.freeze({
      deterministicLevelUsed: true,
      ocrLevelUsed: evidence.ocrUsed ?? evidence.detectedText.length > 0,
      aiLevelUsed: evidence.aiUsed ?? false,
      aiReason: evidence.aiReason ?? null,
      cache: options.cacheHit ? "hit" : "miss",
      externalCallMade: false,
    }),
  });
}
