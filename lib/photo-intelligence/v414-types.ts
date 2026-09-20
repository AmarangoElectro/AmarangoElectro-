export type V414SuggestionProvenance =
  | "explicit_visual"
  | "ocr_extracted"
  | "ai_inferred"
  | "matched_existing_data"
  | "unknown";

export type V414ImageKind = "flyer" | "isolated_product" | "untrusted" | "unknown";

export interface V414SuggestedFeature {
  readonly label: string;
  readonly value: string;
  readonly provenance: V414SuggestionProvenance;
  readonly confidence: number;
}

export interface V414SuggestedProductMetadata {
  readonly suggestedBrand: string | null;
  readonly suggestedModel: string | null;
  readonly suggestedMemory: string | null;
  readonly suggestedRam: string | null;
  readonly suggestedCategory: string | null;
  readonly suggestedSubcategory: string | null;
  readonly suggestedFeatures: readonly V414SuggestedFeature[];
  readonly detectedText: readonly string[];
  readonly confidence: number;
  readonly provenance: Readonly<Record<string, V414SuggestionProvenance>>;
  readonly imageFingerprint: string;
  readonly imageKind: V414ImageKind;
  readonly warnings: readonly string[];
  readonly humanApprovalRequired: true;
  readonly analysis: {
    readonly deterministicLevelUsed: true;
    readonly ocrLevelUsed: boolean;
    readonly aiLevelUsed: boolean;
    readonly aiReason: string | null;
    readonly cache: "hit" | "miss";
    readonly externalCallMade: false;
  };
}

export interface V414ExistingProductEvidence {
  readonly name: string;
  readonly brand: string | null;
  readonly model: string | null;
  readonly memory: string | null;
  readonly ram: string | null;
  readonly category: string;
  readonly image: string;
  readonly features: readonly string[];
}

export interface V414PhotoEvidence {
  readonly imageKind: V414ImageKind;
  readonly detectedText: readonly string[];
  readonly brand?: string | null;
  readonly model?: string | null;
  readonly memory?: string | null;
  readonly ram?: string | null;
  readonly category?: string | null;
  readonly subcategory?: string | null;
  readonly features?: readonly V414SuggestedFeature[];
  readonly warnings?: readonly string[];
  readonly ocrUsed?: boolean;
  readonly aiUsed?: boolean;
  readonly aiReason?: string | null;
}

export const V414_ALLOWED_PROVENANCE = Object.freeze([
  "explicit_visual",
  "ocr_extracted",
  "ai_inferred",
  "matched_existing_data",
  "unknown",
] as const);
