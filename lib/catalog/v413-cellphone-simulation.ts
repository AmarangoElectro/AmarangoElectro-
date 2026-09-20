import {
  identityTuple,
  modelFamilyTuple,
  proposedLabSlug,
  proposeLegacyCellphoneKey,
} from "./v413-cellphone-identity";
import {
  normalizeCellphoneText,
  parseLegacyCellphone,
  parseLegacyCellphones,
  type V413LegacyPhone,
  type V413ParsedPhone,
} from "./v413-cellphone-parser";

export interface V413MasterPhoneEvidence {
  readonly id: number;
  readonly name: string;
  readonly category: string;
  readonly cashPriceARS: number;
  readonly image: string;
  readonly visible: boolean;
  readonly outOfStock?: boolean;
}

type MatchLevel = "strong_match" | "probable_match" | "no_match" | "conflict";
type MigrationStatus = "ready" | "review" | "conflict";

function imagePath(value: string) {
  try {
    return new URL(value).pathname.toLocaleLowerCase("en");
  } catch {
    return "";
  }
}

function scoreMasterMatch(phone: V413ParsedPhone, master: V413MasterPhoneEvidence) {
  const parsedMaster = parseLegacyCellphone({
    legacyPosition: -1,
    name: master.name,
    cashPriceARS: master.cashPriceARS,
    image: master.image,
    colors: [],
  });
  let score = 0;
  const reasons: string[] = [];
  if (phone.normalizedName === parsedMaster.normalizedName) { score += 45; reasons.push("normalized_name"); }
  if (phone.brand.value && phone.brand.value === parsedMaster.brand.value) { score += 15; reasons.push("brand"); }
  if (phone.modelFamily.value && phone.modelFamily.value === parsedMaster.modelFamily.value) { score += 25; reasons.push("model_family"); }
  if (phone.memory.value && phone.memory.value === parsedMaster.memory.value) { score += 10; reasons.push("memory"); }
  if (phone.ram.value && phone.ram.value === parsedMaster.ram.value) { score += 5; reasons.push("ram"); }
  if (phone.cashPriceARS === master.cashPriceARS) { score += 15; reasons.push("price"); }
  if (imagePath(phone.image) && imagePath(phone.image) === imagePath(master.image)) { score += 40; reasons.push("image"); }
  const strong = score >= 75 || reasons.includes("normalized_name") || reasons.includes("image");
  const level: MatchLevel = strong && master.visible === false
    ? "conflict"
    : strong
      ? "strong_match"
      : score >= 45
        ? "probable_match"
        : "no_match";
  return { masterId: String(master.id), masterName: master.name, score, reasons, level, masterVisible: master.visible };
}

export function analyzeV413Cellphones(
  legacyPhones: readonly V413LegacyPhone[],
  masterPhones: readonly V413MasterPhoneEvidence[],
) {
  const parsed = parseLegacyCellphones(legacyPhones);
  const keys = parsed.map(proposeLegacyCellphoneKey);
  const keyCounts = new Map<string, number>();
  const identityCounts = new Map<string, number>();
  for (const [index, phone] of parsed.entries()) {
    keyCounts.set(keys[index], (keyCounts.get(keys[index]) ?? 0) + 1);
    const tuple = identityTuple(phone);
    identityCounts.set(tuple, (identityCounts.get(tuple) ?? 0) + 1);
  }

  const duplicateClusters = [...new Set(parsed.map(identityTuple))]
    .filter((tuple) => tuple.replaceAll("|", "") && (identityCounts.get(tuple) ?? 0) > 1)
    .map((tuple) => ({
      classification: "probable_duplicate" as const,
      tuple,
      legacyPositions: parsed.filter((phone) => identityTuple(phone) === tuple).map((phone) => phone.legacyPosition),
      reason: "same_brand_model_memory_ram",
      autoMerge: false,
    }));

  const familyGroups = Map.groupBy(parsed, modelFamilyTuple);
  const variantClusters = [...familyGroups.entries()]
    .filter(([tuple, phones]) => tuple.replaceAll("|", "") && phones.length > 1 && new Set(phones.map(identityTuple)).size > 1)
    .map(([tuple, phones]) => ({
      classification: "real_variants" as const,
      tuple,
      brand: phones[0].brand.value,
      modelFamily: phones[0].modelFamily.value,
      variants: phones.map((phone) => ({
        legacyPosition: phone.legacyPosition,
        name: phone.originalName,
        memory: phone.memory.value,
        ram: phone.ram.value,
      })),
      autoMerge: false,
    }));

  const products = parsed.map((phone, index) => {
    const key = keys[index];
    const masterMatches = masterPhones
      .map((master) => scoreMasterMatch(phone, master))
      .sort((a, b) => b.score - a.score);
    const bestMatch = masterMatches[0] ?? null;
    const duplicate = duplicateClusters.find((cluster) => cluster.legacyPositions.includes(phone.legacyPosition));
    const identityCollision = (keyCounts.get(key) ?? 0) > 1;
    const conflict = bestMatch?.level === "conflict" || identityCollision || Boolean(duplicate);
    const reviewReasons = [
      ...phone.ambiguities,
      ...(identityCollision ? ["fingerprint_collision"] : []),
      ...(duplicate ? ["probable_duplicate"] : []),
      ...(bestMatch?.level === "probable_match" ? ["probable_master_match"] : []),
      ...(bestMatch?.level === "conflict" ? ["hidden_master_conflict"] : []),
    ];
    const migrationStatus: MigrationStatus = conflict ? "conflict" : reviewReasons.length ? "review" : "ready";
    return Object.freeze({
      legacyPosition: phone.legacyPosition,
      legacyCellphoneKey: key,
      canonicalProductId: null,
      stableId: null,
      slug: proposedLabSlug(key),
      name: phone.originalName,
      normalizedName: phone.normalizedName,
      brand: phone.brand.value,
      model: phone.model.value,
      modelFamily: phone.modelFamily.value,
      memory: phone.memory.value,
      ram: phone.ram.value,
      category: "celulares",
      image: phone.image,
      images: [phone.image],
      cashPriceARS: phone.cashPriceARS,
      financing: [],
      availability: "unknown" as const,
      visibility: "pending" as const,
      colors: [...phone.colors],
      features: [...phone.features],
      updatedAt: null,
      migrationStatus,
      reviewReasons,
      provenance: {
        name: "explicit",
        brand: phone.brand.provenance,
        model: phone.model.provenance,
        memory: phone.memory.provenance,
        ram: phone.ram.provenance,
        colors: phone.colorsProvenance,
        price: "explicit",
        image: "explicit",
        features: phone.featuresProvenance,
        visibility: "unknown",
        availability: "unknown",
        updatedAt: "unknown",
      },
      masterCrosscheck: bestMatch && bestMatch.level !== "no_match" ? bestMatch : { level: "no_match", score: bestMatch?.score ?? 0 },
    });
  });

  const reviewQueue = products
    .filter((product) => product.migrationStatus !== "ready")
    .map((product) => ({
      legacyPosition: product.legacyPosition,
      legacyCellphoneKey: product.legacyCellphoneKey,
      name: product.name,
      status: product.migrationStatus,
      problems: product.reviewReasons,
      suggestion: product.migrationStatus === "conflict"
        ? "Comparar manualmente contra master y asignar o descartar el mapping."
        : "Validar el dato ambiguo y aprobar explícitamente el mapping.",
      alternatives: ["aprobar_como_nuevo", "vincular_a_master", "mantener_pendiente"],
      risk: product.migrationStatus === "conflict" ? "high" : "medium",
      humanActionRequired: true,
    }));

  const statusCounts = Object.fromEntries(["ready", "review", "conflict"].map((status) => [
    status,
    products.filter((product) => product.migrationStatus === status).length,
  ]));
  const matchCounts = Object.fromEntries(["strong_match", "probable_match", "no_match", "conflict"].map((level) => [
    level,
    products.filter((product) => product.masterCrosscheck.level === level).length,
  ]));

  return Object.freeze({
    schemaVersion: "v4.13-cellphones-migration-simulation-v1",
    mode: "lab_read_only",
    source: "public.celulares_lista/id=lista",
    canonicalMaster: "public.tienda_catalogo/id=catalogo",
    writeEnabled: false,
    identityStrategy: "future_mapping_table",
    identityContract: "legacyCellphoneKey -> canonicalProductId",
    counts: {
      source: products.length,
      ...statusCounts,
      probableDuplicates: duplicateClusters.length,
      variantClusters: variantClusters.length,
      productsInVariantClusters: new Set(variantClusters.flatMap((cluster) => cluster.variants.map((variant) => variant.legacyPosition))).size,
      reviewQueue: reviewQueue.length,
      masterMatches: matchCounts,
    },
    duplicateClusters,
    variantClusters,
    reviewQueue,
    products,
  });
}

export function searchV413Products(
  products: readonly ReturnType<typeof analyzeV413Cellphones>["products"][number][],
  query: string,
) {
  const needle = normalizeCellphoneText(query);
  if (!needle) return [...products];
  const needleTokens = needle.split(" ").filter(Boolean);
  return products.filter((product) => {
    const haystack = normalizeCellphoneText([
      product.name,
      product.brand,
      product.model,
      product.modelFamily,
      product.memory,
      product.ram,
      product.category,
    ].filter(Boolean).join(" "));
    const haystackTokens = haystack.split(" ");
    return needleTokens.every((token) => haystackTokens.some((candidate) => candidate === token || candidate.startsWith(token)));
  });
}
