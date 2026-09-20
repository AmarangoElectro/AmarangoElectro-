import { fingerprintImageUrl } from "./v414-image-fingerprint";
import { suggestV414ProductMetadata } from "./v414-photo-intelligence";
import type { V414PhotoEvidence, V414SuggestedFeature } from "./v414-types";

interface V413SimulationProduct {
  readonly legacyPosition: number;
  readonly legacyCellphoneKey: string;
  readonly slug: string;
  readonly name: string;
  readonly normalizedName: string;
  readonly brand: string | null;
  readonly model: string | null;
  readonly modelFamily: string | null;
  readonly memory: string | null;
  readonly ram: string | null;
  readonly category: string;
  readonly image: string;
  readonly images: readonly string[];
  readonly cashPriceARS: number;
  readonly financing: readonly unknown[];
  readonly availability: "unknown";
  readonly visibility: "pending";
  readonly colors: readonly string[];
  readonly features: readonly string[];
  readonly updatedAt: null;
  readonly migrationStatus: "ready" | "review" | "conflict";
  readonly reviewReasons: readonly string[];
  readonly provenance: Readonly<Record<string, string>>;
}

interface V413Simulation {
  readonly products: readonly V413SimulationProduct[];
}

const iphoneFeatures: readonly V414SuggestedFeature[] = Object.freeze([
  { label: "Pantalla", value: "Super Retina XDR OLED de 6,3 pulgadas con ProMotion 120 Hz", provenance: "ocr_extracted", confidence: 0.99 },
  { label: "Procesador", value: "Chip A19 Pro", provenance: "ocr_extracted", confidence: 0.99 },
  { label: "Cámaras", value: "Sistema de cámaras Pro 48 MP + 48 MP + 12 MP", provenance: "ocr_extracted", confidence: 0.98 },
  { label: "Carga", value: "Carga rápida USB-C", provenance: "ocr_extracted", confidence: 0.99 },
]);

const infinixFeatures: readonly V414SuggestedFeature[] = Object.freeze([
  { label: "Pantalla", value: "AMOLED 6,78 pulgadas FHD+ 144 Hz", provenance: "ocr_extracted", confidence: 0.99 },
  { label: "Memoria", value: "12 GB RAM expandible", provenance: "ocr_extracted", confidence: 0.99 },
  { label: "Cámara", value: "108 MP", provenance: "ocr_extracted", confidence: 0.99 },
  { label: "Batería", value: "5000 mAh con carga rápida 45 W", provenance: "ocr_extracted", confidence: 0.99 },
]);

export function v414EvidenceForLegacyPosition(position: number): V414PhotoEvidence {
  if (position === 10) {
    return Object.freeze({
      imageKind: "flyer",
      detectedText: Object.freeze([
        "iPhone 17 Pro",
        "256GB / 512GB / 1TB",
        "Pantalla Super Retina XDR 6.3 OLED ProMotion 120Hz",
        "Chip A19 Pro",
        "Carga rápida USB-C",
      ]),
      brand: "Apple",
      model: "iPhone 17 Pro",
      memory: "256 GB",
      category: "Celulares",
      subcategory: "iPhone",
      features: iphoneFeatures,
      ocrUsed: true,
      aiUsed: false,
      warnings: Object.freeze(["flyer_contains_marketing_content", "human_approval_required"]),
    });
  }
  if (position === 91) {
    return Object.freeze({
      imageKind: "flyer",
      detectedText: Object.freeze([
        "Infinix GT 30 Pro NFC",
        "512 GB almacenamiento",
        "12 GB RAM",
        "Pantalla AMOLED 6.78 FHD+ 144Hz",
        "Cámara 108 MP",
        "Batería 5000 mAh carga rápida 45W",
      ]),
      brand: "Infinix",
      model: "Infinix GT 30 Pro NFC",
      memory: "512 GB",
      ram: "12 GB",
      category: "Celulares",
      subcategory: "Infinix",
      features: infinixFeatures,
      ocrUsed: true,
      aiUsed: true,
      aiReason: "El nombre legacy mezcla color y bundle; se simuló el fallback para buscar evidencia visual adicional.",
      warnings: Object.freeze([
        "exact_color_name_not_visually_confirmed",
        "gamer_kit_bundle_not_visible",
        "ai_fallback_inconclusive",
        "human_approval_required",
      ]),
    });
  }
  return Object.freeze({
    imageKind: "unknown",
    detectedText: Object.freeze([]),
    category: "Celulares",
    subcategory: null,
    ocrUsed: false,
    aiUsed: false,
    warnings: Object.freeze(["visual_analysis_not_required_for_preflight"]),
  });
}

function sanitizeFeatures(features: readonly string[]) {
  return features.map((value) => ({
    label: "Característica",
    value,
    provenance: "matched_existing_data" as const,
    confidence: 0.95,
  }));
}

export function buildV414MigrationPreflight(simulation: V413Simulation) {
  const products = simulation.products.map((phone) => {
    const evidence = v414EvidenceForLegacyPosition(phone.legacyPosition);
    const fingerprint = fingerprintImageUrl(phone.image);
    const suggestion = suggestV414ProductMetadata({
      fingerprint,
      existing: {
        name: phone.name,
        brand: phone.brand,
        model: phone.model,
        memory: phone.memory,
        ram: phone.ram,
        category: "Celulares",
        image: phone.image,
        features: phone.features,
      },
      evidence: evidence.features?.length
        ? evidence
        : { ...evidence, features: sanitizeFeatures(phone.features) },
      cacheHit: false,
    });

    const iphoneResolved = phone.legacyPosition === 10;
    const infinixPending = phone.legacyPosition === 91;
    const reviewReasons = iphoneResolved
      ? []
      : infinixPending
        ? ["exact_color_name_not_visually_confirmed", "gamer_kit_bundle_not_visible"]
        : [...phone.reviewReasons];
    const reviewStatus = reviewReasons.length ? "human_review_required" as const : "prepared" as const;
    const featureDetails = suggestion.suggestedFeatures.length
      ? suggestion.suggestedFeatures
      : sanitizeFeatures(phone.features);
    const productV16 = Object.freeze({
      stableId: null,
      slug: phone.slug,
      name: phone.name,
      brand: suggestion.suggestedBrand,
      model: suggestion.suggestedModel,
      memory: suggestion.suggestedMemory,
      ram: suggestion.suggestedRam,
      category: "celulares",
      image: phone.image,
      images: [...phone.images],
      cashPriceARS: phone.cashPriceARS,
      financing: [],
      availability: "unknown" as const,
      visibility: "pending" as const,
      colors: [...phone.colors],
      features: featureDetails.map((feature) => feature.value),
      featureDetails,
      updatedAt: null,
    });
    return Object.freeze({
      legacyPosition: phone.legacyPosition,
      legacyMappingKey: phone.legacyCellphoneKey,
      proposedCanonicalProductId: null,
      canonicalIdPlan: "assign_new_persistent_id_on_authorized_master_migration_then_persist_mapping",
      reviewStatus,
      reviewReasons,
      eligibleForFutureWrite: reviewStatus === "prepared",
      imageFingerprint: fingerprint,
      photoIntelligence: suggestion,
      productV16,
      payloadToWrite: Object.freeze({
        id: null,
        legacyMappingKey: phone.legacyCellphoneKey,
        name: productV16.name,
        brand: productV16.brand,
        model: productV16.model,
        memory: productV16.memory,
        ram: productV16.ram,
        category: productV16.category,
        image: productV16.image,
        images: productV16.images,
        cashPriceARS: productV16.cashPriceARS,
        financing: [],
        availability: "unknown",
        visibility: "pending",
        colors: productV16.colors,
        features: productV16.featureDetails,
        updatedAt: null,
      }),
      privateFieldDisposition: Object.freeze({
        retainedOutsidePublicProduct: ["source monetary reference", "source conversion reference"],
        valuesCapturedInPreflight: false,
        clientExposure: false,
      }),
      rollbackPlan: "restore_pre_migration_master_snapshot_remove_batch_mapping_and_regenerate_read_model_after_human_authorization",
      mutationExecuted: false,
    });
  });

  const prepared = products.filter((product) => product.reviewStatus === "prepared");
  const review = products.filter((product) => product.reviewStatus === "human_review_required");
  return Object.freeze({
    schemaVersion: "v4.14-migration-preflight-v1",
    mode: "lab_preflight_read_only",
    sourceCheckpoint: "V4.13 Canonical Cellphones Migration Lab",
    writeEnabled: false,
    generatedFromSanitizedFixture: true,
    identityStrategy: "legacyCellphoneKey_to_futureCanonicalProductId_mapping",
    counts: Object.freeze({
      source: products.length,
      prepared: prepared.length,
      humanReviewRequired: review.length,
      conflict: 0,
      resolvedWithVisualEvidence: iphoneResolvedCount(products),
      simulatedAiFallbacks: products.filter((product) => product.photoIntelligence.analysis.aiLevelUsed).length,
    }),
    simulatedCostPolicy: Object.freeze({
      monthlyBudgetUSCents: 2_500,
      estimatedUnitCostUSCents: 1,
      simulatedAccountedCostUSCents: products.filter((product) => product.photoIntelligence.analysis.aiLevelUsed).length,
      actualExternalCostUSCents: 0,
      worstCaseAll92USCents: products.length,
      repeatedValidFingerprintCostUSCents: 0,
    }),
    reviewQueue: review.map((product) => ({
      legacyPosition: product.legacyPosition,
      legacyMappingKey: product.legacyMappingKey,
      name: product.productV16.name,
      problems: product.reviewReasons,
      suggestedAction: "Confirmar manualmente color comercial y contenido real del kit; aprobar o separar el bundle.",
      alternatives: ["approve_phone_only", "define_bundle_as_variant", "keep_pending"],
      risk: "medium",
      humanApprovalRequired: true,
    })),
    preparedLegacyPositions: prepared.map((product) => product.legacyPosition),
    products,
    rollbackContract: Object.freeze({
      beforeWrite: "capture_hash_and_snapshot_of_canonical_master_and_mapping",
      onFailure: "restore_master_snapshot_remove_only_batch_created_mapping_rows",
      afterRollback: "regenerate_derived_read_model_and_verify_parity",
      executableInV414: false,
    }),
  });
}

function iphoneResolvedCount(products: readonly { legacyPosition: number; reviewStatus: string }[]) {
  return products.some((product) => product.legacyPosition === 10 && product.reviewStatus === "prepared") ? 1 : 0;
}
