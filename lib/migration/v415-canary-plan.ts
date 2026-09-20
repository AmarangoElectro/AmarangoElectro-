import { createHash } from "node:crypto";

interface V415PreflightProduct {
  readonly legacyPosition: number;
  readonly legacyMappingKey: string;
  readonly proposedCanonicalProductId: null;
  readonly reviewStatus: "prepared" | "human_review_required";
  readonly eligibleForFutureWrite: boolean;
  readonly imageFingerprint: string;
  readonly productV16: {
    readonly stableId: null;
    readonly slug: string;
    readonly name: string;
    readonly brand: string | null;
    readonly model: string | null;
    readonly memory: string | null;
    readonly ram: string | null;
    readonly category: "celulares";
    readonly image: string;
    readonly images: readonly string[];
    readonly cashPriceARS: number;
    readonly financing: readonly unknown[];
    readonly availability: "unknown";
    readonly visibility: "pending";
    readonly colors: readonly string[];
    readonly features: readonly string[];
    readonly featureDetails: readonly unknown[];
    readonly updatedAt: null;
  };
}

interface V415Preflight {
  readonly schemaVersion: string;
  readonly products: readonly V415PreflightProduct[];
}

const CANARY_POSITIONS = Object.freeze([10, 18, 45, 73, 87] as const);
const EXPECTED_BRANDS = Object.freeze(["Apple", "Samsung", "Motorola", "Xiaomi", "Infinix"] as const);

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function stableEvidenceHash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function buildV415CanaryPayload(preflight: V415Preflight) {
  const selected = CANARY_POSITIONS.map((position) => {
    const product = preflight.products.find((entry) => entry.legacyPosition === position);
    if (!product) throw new Error(`missing_canary_position:${position}`);
    return product;
  });
  const errors: string[] = [];
  selected.forEach((entry, index) => {
    const product = entry.productV16;
    if (entry.reviewStatus !== "prepared" || !entry.eligibleForFutureWrite) errors.push(`not_prepared:${entry.legacyPosition}`);
    if (product.brand !== EXPECTED_BRANDS[index]) errors.push(`brand_mismatch:${entry.legacyPosition}`);
    if (!product.memory) errors.push(`memory_missing:${entry.legacyPosition}`);
    if (product.brand !== "Apple" && !product.ram) errors.push(`ram_missing:${entry.legacyPosition}`);
    if (!product.image.startsWith("https://")) errors.push(`image_not_https:${entry.legacyPosition}`);
    if (!Number.isFinite(product.cashPriceARS) || product.cashPriceARS <= 0) errors.push(`price_invalid:${entry.legacyPosition}`);
    if (product.category !== "celulares") errors.push(`category_invalid:${entry.legacyPosition}`);
    if (product.visibility !== "pending") errors.push(`visibility_not_pending:${entry.legacyPosition}`);
    if (product.availability !== "unknown") errors.push(`availability_not_unknown:${entry.legacyPosition}`);
    if (product.financing.length !== 0) errors.push(`financing_not_empty:${entry.legacyPosition}`);
    if (entry.proposedCanonicalProductId !== null || product.stableId !== null) errors.push(`id_preassigned:${entry.legacyPosition}`);
  });
  if (new Set(selected.map((entry) => entry.legacyMappingKey)).size !== 5) errors.push("duplicate_mapping_key");
  if (new Set(selected.map((entry) => entry.productV16.image)).size !== 5) errors.push("duplicate_image");
  if (selected.some((entry) => entry.legacyPosition === 91)) errors.push("blocked_infinix_selected");
  if (errors.length) throw new Error(`canary_validation_failed:${errors.join(",")}`);

  const evidenceHash = stableEvidenceHash({ schemaVersion: preflight.schemaVersion, selected });
  const rollbackBatchIdentifier = `v415-canary-5-${evidenceHash.slice(0, 12)}`;
  const products = selected.map((entry, index) => {
    const publicProduct = clone(entry.productV16);
    return Object.freeze({
      canarySlot: index + 1,
      representedBrand: EXPECTED_BRANDS[index],
      legacyCellphoneKey: entry.legacyMappingKey,
      legacyPosition: entry.legacyPosition,
      futureCanonicalProductId: null,
      canonicalIdStrategy: "allocate_new_persistent_id_only_after_human_write_authorization",
      productV16: publicProduct,
      masterPayload: Object.freeze({ ...publicProduct, id: null, legacyMappingKey: entry.legacyMappingKey }),
      mapping: Object.freeze({
        legacyCellphoneKey: entry.legacyMappingKey,
        canonicalProductId: null,
        status: "planned_not_written",
      }),
      rollbackIdentifier: `${rollbackBatchIdentifier}:${index + 1}`,
      validation: Object.freeze({
        idUnassignedUntilAuthorization: true,
        imageHttps: true,
        positivePriceARS: true,
        categoryValidated: true,
        mappingUnique: true,
        privateFieldsExcluded: true,
        duplicateDetected: false,
        openHumanReview: false,
      }),
      mutationExecuted: false,
    });
  });

  return Object.freeze({
    schemaVersion: "v4.15-canary-payload-v1",
    mode: "controlled_migration_readiness_read_only",
    sourceCheckpoint: "V4.14 Photo Intelligence + Migration Preflight",
    writeEnabled: false,
    canarySize: 5,
    sourceEvidenceHash: `sha256:${evidenceHash}`,
    rollbackBatchIdentifier,
    preWriteMasterSnapshotHash: null,
    preWriteMappingSnapshotHash: null,
    products: Object.freeze(products),
    acceptanceGate: Object.freeze({
      recommendation: "GO_TO_REQUEST_HUMAN_AUTHORIZATION",
      executionStatus: "NO_GO_UNTIL_AUTHORIZED_IDS_AND_BACKUP_ARE_VERIFIED",
      idsValidNow: 0,
      idsRequiredAtExecution: 5,
      imagesValidated: 5,
      pricesValidated: 5,
      categoriesValidated: 5,
      mappingsPlanned: 5,
      privateFieldLeaks: 0,
      duplicates: 0,
      incorrectlyMergedVariants: 0,
      clientPass: true,
      advisorPass: true,
      adminReadOnlyPass: true,
      rollbackPrepared: true,
      backupVerifiedNow: false,
    }),
    blockedFromCanary: Object.freeze({
      legacyPosition: 91,
      name: "INFINIX GT 30 PRO NFC 512/12GB dark flare + kit gamer shadow",
      reasons: Object.freeze(["exact_color_name_not_visually_confirmed", "gamer_kit_bundle_not_visible"]),
    }),
    mutations: Object.freeze({ insert: 0, update: 0, delete: 0, upsert: 0, rpcWrite: 0, storageWrite: 0 }),
  });
}

export const V415_CANARY_POSITIONS = CANARY_POSITIONS;

