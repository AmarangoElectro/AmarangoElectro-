export type FieldProvenance = "explicit" | "parsed_from_name" | "unknown";

export interface V413LegacyPhone {
  readonly legacyPosition: number;
  readonly name: string;
  readonly cashPriceARS: number;
  readonly image: string;
  readonly colors: readonly string[];
  readonly features?: string | null;
}

export interface V413ParsedField<T> {
  readonly value: T | null;
  readonly provenance: FieldProvenance;
}

export interface V413ParsedPhone {
  readonly legacyPosition: number;
  readonly originalName: string;
  readonly normalizedName: string;
  readonly brand: V413ParsedField<string>;
  readonly model: V413ParsedField<string>;
  readonly modelFamily: V413ParsedField<string>;
  readonly memory: V413ParsedField<string>;
  readonly ram: V413ParsedField<string>;
  readonly colors: readonly string[];
  readonly colorsProvenance: FieldProvenance;
  readonly cashPriceARS: number;
  readonly image: string;
  readonly features: readonly string[];
  readonly featuresProvenance: FieldProvenance;
  readonly extractionQuality: "high" | "review";
  readonly ambiguities: readonly string[];
}

const BRAND_RULES = [
  { pattern: /^iphone\b/i, brand: "Apple", prefix: /^iphone\b/i, displayPrefix: "iPhone" },
  { pattern: /^samsung\b/i, brand: "Samsung", prefix: /^samsung\b/i, displayPrefix: "Samsung" },
  { pattern: /^(?:moto|motorola)\b/i, brand: "Motorola", prefix: /^(?:moto|motorola)\b/i, displayPrefix: "Moto" },
  { pattern: /^redmi\b/i, brand: "Redmi", prefix: /^redmi\b/i, displayPrefix: "Redmi" },
  { pattern: /^poco\b/i, brand: "POCO", prefix: /^poco\b/i, displayPrefix: "POCO" },
  { pattern: /^xiaomi\b/i, brand: "Xiaomi", prefix: /^xiaomi\b/i, displayPrefix: "Xiaomi" },
  { pattern: /^infinix\b/i, brand: "Infinix", prefix: /^infinix\b/i, displayPrefix: "Infinix" },
] as const;

const STORAGE_VALUES = new Set([32, 64, 128, 256, 512, 1024, 2048]);
const RAM_VALUES = new Set([2, 3, 4, 6, 8, 12, 16, 24]);

export function normalizeCellphoneText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[“”"']/g, " ")
    .replace(/[‼!]+/g, " ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLocaleLowerCase("es");
}

function cleanDisplayName(value: string) {
  return value
    .replace(/[“”]/g, " ")
    .replace(/‼?\s*NOVEDAD\b/gi, " ")
    .replace(/\bNUEVO\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toGb(value: number, unit?: string) {
  return unit?.toLocaleLowerCase("en") === "tb" ? value * 1024 : value;
}

function formatCapacity(gb: number) {
  return gb >= 1024 && gb % 1024 === 0 ? `${gb / 1024} TB` : `${gb} GB`;
}

function parseCapacity(name: string) {
  const pair = /(?<!\d)(\d+)\s*(tb|gb)?\s*\/\s*(\d+)\s*(tb|gb)?\b/i.exec(name);
  if (pair) {
    const left = toGb(Number(pair[1]), pair[2]);
    const right = toGb(Number(pair[3]), pair[4]);
    const larger = Math.max(left, right);
    const smaller = Math.min(left, right);
    if (STORAGE_VALUES.has(larger) && RAM_VALUES.has(smaller)) {
      return {
        memory: formatCapacity(larger),
        ram: formatCapacity(smaller),
        start: pair.index,
      };
    }
  }

  const single = /(?<!\d)(\d+)\s*(tb|gb)\b/i.exec(name);
  if (single) {
    const capacity = toGb(Number(single[1]), single[2]);
    if (STORAGE_VALUES.has(capacity)) {
      return {
        memory: formatCapacity(capacity),
        ram: null,
        start: single.index,
      };
    }
  }

  return { memory: null, ram: null, start: -1 };
}

function canonicalWords(value: string) {
  const upperTokens = new Set(["POCO", "NFC", "GT", "PRO", "MAX", "PLUS", "EDGE", "POWER", "HOT", "SMART", "NOTE", "FUSION"]);
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const upper = token.toLocaleUpperCase("en");
      if (/^[A-Z]\d+$/i.test(token) || /^\d+$/.test(token) || /^\d+G$/i.test(token) || upperTokens.has(upper)) return upper;
      if (upper === "IPHONE") return "iPhone";
      if (upper === "MOTO") return "Moto";
      if (upper === "INFINIX") return "Infinix";
      if (upper === "SAMSUNG") return "Samsung";
      if (upper === "XIAOMI") return "Xiaomi";
      if (upper === "REDMI") return "Redmi";
      return token.charAt(0).toLocaleUpperCase("es") + token.slice(1).toLocaleLowerCase("es");
    })
    .join(" ");
}

function parseBrandAndModel(cleanName: string, capacityStart: number) {
  const beforeCapacity = (capacityStart >= 0 ? cleanName.slice(0, capacityStart) : cleanName)
    .replace(/\s+/g, " ")
    .trim();
  const rule = BRAND_RULES.find((candidate) => candidate.pattern.test(beforeCapacity));
  if (!rule) return { brand: null, model: null, family: null };
  const rest = beforeCapacity.replace(rule.prefix, "").trim();
  if (!rest) return { brand: rule.brand, model: null, family: null };
  const model = canonicalWords(`${rule.displayPrefix} ${rest}`);
  const familyRest = rest
    .replace(/\b(?:5G|NFC)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const family = familyRest ? canonicalWords(`${rule.displayPrefix} ${familyRest}`) : null;
  return { brand: rule.brand, model, family };
}

function normalizeColors(values: readonly string[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const clean = value.trim();
    const key = normalizeCellphoneText(clean);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(clean.charAt(0).toLocaleUpperCase("es") + clean.slice(1).toLocaleLowerCase("es"));
  }
  return result;
}

function parseColorsFromName(name: string) {
  const suffix = /\s+-\s+([a-z]+(?:-[a-z]+)*)\s*$/i.exec(name)?.[1];
  if (!suffix) return [];
  return normalizeColors(suffix.split("-"));
}

function parseFeatures(value?: string | null) {
  if (!value?.trim()) return [];
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[•*-]\s*/, "").trim())
    .filter((line) => line && !/^caracter[ií]sticas principales:?$/i.test(line));
}

export function parseLegacyCellphone(input: V413LegacyPhone): V413ParsedPhone {
  const originalName = input.name.trim();
  const cleanName = cleanDisplayName(originalName);
  const capacity = parseCapacity(cleanName);
  const identity = parseBrandAndModel(cleanName, capacity.start);
  const explicitColors = normalizeColors(input.colors ?? []);
  const parsedColors = explicitColors.length ? [] : parseColorsFromName(originalName);
  const features = parseFeatures(input.features);
  const ambiguities: string[] = [];

  if (!identity.brand) ambiguities.push("brand_unknown");
  if (!identity.model || !identity.family) ambiguities.push("model_unknown");
  if (!capacity.memory) ambiguities.push("memory_unknown");
  if (features.some((feature) => /(?:USB-|\bUSB)$/i.test(feature))) ambiguities.push("truncated_characteristics");
  if (/\bkit\s+gamer\b|dark\s+flare|gamer\s+shadow/i.test(originalName)) ambiguities.push("bundle_or_color_suffix_requires_review");

  return Object.freeze({
    legacyPosition: input.legacyPosition,
    originalName,
    normalizedName: normalizeCellphoneText(cleanName),
    brand: Object.freeze({ value: identity.brand, provenance: identity.brand ? "parsed_from_name" : "unknown" }),
    model: Object.freeze({ value: identity.model, provenance: identity.model ? "parsed_from_name" : "unknown" }),
    modelFamily: Object.freeze({ value: identity.family, provenance: identity.family ? "parsed_from_name" : "unknown" }),
    memory: Object.freeze({ value: capacity.memory, provenance: capacity.memory ? "parsed_from_name" : "unknown" }),
    ram: Object.freeze({ value: capacity.ram, provenance: capacity.ram ? "parsed_from_name" : "unknown" }),
    colors: Object.freeze(explicitColors.length ? explicitColors : parsedColors),
    colorsProvenance: explicitColors.length ? "explicit" : parsedColors.length ? "parsed_from_name" : "unknown",
    cashPriceARS: input.cashPriceARS,
    image: input.image,
    features: Object.freeze(features),
    featuresProvenance: features.length ? "explicit" : "unknown",
    extractionQuality: ambiguities.length ? "review" : "high",
    ambiguities: Object.freeze(ambiguities),
  });
}

export function parseLegacyCellphones(inputs: readonly V413LegacyPhone[]) {
  return Object.freeze(inputs.map(parseLegacyCellphone));
}
