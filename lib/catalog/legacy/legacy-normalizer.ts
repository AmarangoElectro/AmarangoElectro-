import { z } from "zod";
import type { Availability, Product, StockStatus } from "../types";

export type LegacyDatasetName = "tienda_catalogo" | "celulares_lista";

export interface LegacyCatalogSnapshot {
  tiendaCatalogo?: unknown;
  celularesLista?: unknown;
}

export interface LegacyCatalogDiagnostic {
  source: LegacyDatasetName;
  index: number;
  legacyId: string | null;
  reason: string;
}

export interface LegacyDuplicateCandidate {
  key: string;
  products: Array<{ source: LegacyDatasetName; index: number; id: string; name: string }>;
}

export interface LegacyNormalizationResult {
  products: Product[];
  rejected: LegacyCatalogDiagnostic[];
  potentialDuplicates: LegacyDuplicateCandidate[];
}

const identifierSchema = z.union([z.string(), z.number()]);
const scalarSchema = z.union([z.string(), z.number(), z.boolean()]);

const catalogProductSchema = z.object({
  id: identifierSchema,
  nombre: z.string().trim().min(1),
  venta: scalarSchema.optional(),
  categoria: z.string().optional(),
  categoriaManualProveedor: z.string().optional(),
  caracteristicas: z.union([z.string(), z.array(z.string())]).optional(),
  foto: z.string().optional(),
  fotoManualProveedor: z.string().optional(),
  visible: z.boolean().optional(),
  eliminado: z.boolean().optional(),
  sinStock: z.boolean().optional(),
  estadoProveedor: z.string().optional(),
  ocultoManualProveedor: z.boolean().optional(),
  ocultoManualAdmin: z.boolean().optional(),
  ocultoPorDuplicado: z.boolean().optional(),
  pendienteRevisionManual: z.boolean().optional(),
  proveedorStock: scalarSchema.optional(),
  stockProveedor: scalarSchema.optional(),
  stock: scalarSchema.optional(),
  cantidadStock: scalarSchema.optional(),
  cantidadDisponible: scalarSchema.optional(),
}).passthrough();

const phoneProductSchema = z.object({
  nombre: z.string().trim().min(1),
  precio: scalarSchema,
  foto: z.string().optional(),
  colores: z.array(z.string()).optional(),
  caracteristicas: z.union([z.string(), z.array(z.string())]).optional(),
  ocultoTienda: z.boolean().optional(),
  sinStock: z.boolean().optional(),
}).passthrough();

type CatalogProduct = z.infer<typeof catalogProductSchema>;
type PhoneProduct = z.infer<typeof phoneProductSchema>;

function datasetRows(input: unknown): unknown[] {
  if (Array.isArray(input)) return input;
  if (input && typeof input === "object" && "datos" in input) {
    const rows = (input as { datos?: unknown }).datos;
    return Array.isArray(rows) ? rows : [];
  }
  return [];
}

function legacyNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  let normalized = trimmed.replace(/[^\d,.-]/g, "");
  if (/^-?\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(normalized)) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else if (/^-?\d+(?:,\d+)?$/.test(normalized)) {
    normalized = normalized.replace(",", ".");
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function cleanText(value: unknown) {
  if (typeof value !== "string") return null;
  const text = value.replace(/\s+/g, " ").trim();
  return text || null;
}

function normalized(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugPart(value: unknown) {
  return normalized(value).replace(/\s+/g, "-").replace(/^-|-$/g, "") || "producto";
}

function stableHash(value: string) {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0).toString(36);
}

function safeImage(value: unknown) {
  const text = cleanText(value);
  if (!text) return null;
  try {
    const url = new URL(text);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function splitFeatures(value: unknown) {
  const values = Array.isArray(value) ? value : typeof value === "string" ? value.split(/[\n•|]+/) : [];
  return [...new Set(values.map(cleanText).filter((item): item is string => Boolean(item)))].slice(0, 12);
}

const PHONE_BRAND_RULES: ReadonlyArray<{ brand: string; pattern: RegExp }> = [
  { brand: "Apple", pattern: /\b(?:apple|iphone)\b/ },
  { brand: "Samsung", pattern: /\b(?:samsung|galaxy)\b/ },
  { brand: "Motorola", pattern: /\b(?:motorola|moto)\b/ },
  { brand: "Xiaomi", pattern: /\b(?:xiaomi|redmi|poco)\b/ },
  { brand: "Infinix", pattern: /\binfinix\b/ },
  { brand: "Nokia", pattern: /\bnokia\b/ },
  { brand: "Honor", pattern: /\bhonor\b/ },
  { brand: "TCL", pattern: /\btcl\b/ },
  { brand: "ZTE", pattern: /\bzte\b/ },
  { brand: "Realme", pattern: /\brealme\b/ },
  { brand: "Huawei", pattern: /\bhuawei\b/ },
  { brand: "Alcatel", pattern: /\balcatel\b/ },
  { brand: "LG", pattern: /\blg\b/ },
  { brand: "Oppo", pattern: /\boppo\b/ },
  { brand: "Vivo", pattern: /\bvivo\b/ },
];

function verifiedBrand(name: string) {
  const value = normalized(name);
  return PHONE_BRAND_RULES.find((rule) => rule.pattern.test(value))?.brand ?? null;
}

function duplicateFingerprint(product: Pick<Product, "brand" | "name" | "category">) {
  let value = normalized(product.name);
  const brand = normalized(product.brand);
  const aliases: Record<string, string[]> = {
    apple: ["apple", "iphone"],
    samsung: ["samsung", "galaxy"],
    motorola: ["motorola", "moto"],
    xiaomi: ["xiaomi"],
  };
  for (const token of aliases[brand] ?? [brand]) {
    if (token) value = value.replace(new RegExp(`\\b${token}\\b`, "g"), " ");
  }
  value = value
    .replace(/(\d)\s*(?:gb|gigas?)\b/g, "$1 gb ")
    .replace(/\b(?:gb|gigas?)\b/g, " gb ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized(`${product.category} ${brand} ${value}`);
}

function v16Category(value: unknown, name: string) {
  const category = normalized(`${value ?? ""}`);
  const combined = normalized(`${value ?? ""} ${name}`);
  if (/\b(?:celular|celulares|smartphone|apple|iphone|samsung|galaxy|motorola|moto|xiaomi|redmi|poco|infinix)\b/.test(combined)) return "celulares";
  if (/\b(?:smart tv|televisor|television)\b/.test(category)) return "smart-tv";
  if (/\b(?:audio|parlante|auricular|barra de sonido)\b/.test(category)) return "audio";
  if (/\b(?:gaming|playstation|juego|joystick)\b/.test(category)) return "gaming";
  if (/\b(?:hogar|descanso|colchon|sommier|mueble|cortina|blanqueria)\b/.test(category)) return "hogar-descanso";
  if (/\b(?:refrigeracion|heladera|freezer|lavarropas|coccion|cocina|horno|climatizacion|ventilador|estufa|pequenos electro|aspiradora)\b/.test(category)) {
    return "electrodomesticos";
  }
  return null;
}

function phoneSubcategory(brand: string) {
  if (brand === "Apple") return "apple-iphone";
  return slugPart(brand);
}

function stockValue(product: CatalogProduct) {
  const fields = [
    product.proveedorStock,
    product.stockProveedor,
    product.stock,
    product.cantidadStock,
    product.cantidadDisponible,
  ];
  for (const value of fields) {
    const parsed = legacyNumber(value);
    if (parsed !== null) return Math.max(0, parsed);
  }
  return null;
}

/** Regla pura equivalente al filtro público auditado del catálogo principal. */
export function isLegacyCatalogProductPublic(product: Readonly<CatalogProduct>) {
  if (product.eliminado === true || product.visible !== true) return false;
  if (product.sinStock === true || product.estadoProveedor === "sin_stock") return false;
  if (product.ocultoManualProveedor === true || product.ocultoManualAdmin === true) return false;
  if (product.ocultoPorDuplicado === true) return false;
  const stock = stockValue(product as CatalogProduct);
  return stock === null || stock > 0;
}

/** Regla pura equivalente al filtro público de la lista histórica de celulares. */
export function isLegacyPhonePublic(product: Readonly<PhoneProduct>) {
  return product.ocultoTienda !== true && product.sinStock !== true;
}

function productStock(quantity: number | null, explicitlyOut: boolean) {
  let status: StockStatus = "unknown";
  let availability: Availability = "unknown";
  let label: string | null = null;
  if (explicitlyOut || quantity === 0) {
    status = "out_of_stock";
    availability = "unavailable";
    label = "Sin stock";
  } else if (quantity !== null && quantity > 0) {
    status = "in_stock";
    availability = "available";
    label = "Disponible";
  }
  return { status, availability, label };
}

function freezeProduct(product: Product) {
  Object.freeze(product.features);
  Object.freeze(product.specifications);
  Object.freeze(product.stock);
  if (product.image) Object.freeze(product.image);
  if (product.price) Object.freeze(product.price);
  Object.freeze(product.financing);
  return Object.freeze(product);
}

type ConversionResult = { product?: Product; reason?: string; legacyId?: string | null };

function fromCatalog(raw: unknown): ConversionResult {
  const parsed = catalogProductSchema.safeParse(raw);
  if (!parsed.success) return { reason: "Registro inválido: requiere id y nombre", legacyId: null };
  const item = parsed.data;
  const legacyId = String(item.id).trim();
  if (!legacyId) return { reason: "ID legacy vacío", legacyId };
  if (!isLegacyCatalogProductPublic(item)) return { reason: "No cumple la regla pública de visibilidad/stock", legacyId };

  const name = cleanText(item.nombre)!;
  const category = v16Category(item.categoriaManualProveedor ?? item.categoria, name);
  if (!category) return { reason: "Categoría no verificable", legacyId };
  const brand = verifiedBrand(name);
  if (!brand) return { reason: "Marca no verificable", legacyId };
  const price = legacyNumber(item.venta);
  if (price === null || price <= 0) return { reason: "Precio de venta público inválido o ausente", legacyId };

  const quantity = stockValue(item);
  const stock = productStock(quantity, false);
  const imageSrc = safeImage(item.fotoManualProveedor ?? item.foto);
  const technicalId = `legacy-catalog:${legacyId}`;

  return {
    legacyId,
    product: freezeProduct({
      id: technicalId,
      slug: `${slugPart(name)}-${stableHash(technicalId)}`,
      name,
      brand,
      model: null,
      category,
      subcategory: category === "celulares" ? phoneSubcategory(brand) : null,
      image: imageSrc ? { src: imageSrc, alt: `${name} — AmarangoElectro` } : null,
      price: { amount: price, currency: "ARS" },
      financing: [],
      availability: stock.availability,
      stock: { status: stock.status, quantity: null, label: stock.label },
      features: splitFeatures(item.caracteristicas),
      specifications: {},
      description: null,
      warranty: null,
      visible: true,
      source: "legacy-pilot",
    }),
  };
}

function fromPhone(raw: unknown, index: number): ConversionResult {
  const parsed = phoneProductSchema.safeParse(raw);
  if (!parsed.success) return { reason: "Registro inválido: requiere nombre y precio", legacyId: null };
  const item = parsed.data;
  const name = cleanText(item.nombre)!;
  const legacyId = `row-${index}:${stableHash(normalized(name))}`;
  if (!isLegacyPhonePublic(item)) return { reason: "Celular oculto o sin stock", legacyId };
  const price = legacyNumber(item.precio);
  if (price === null || price <= 0) return { reason: "Precio público inválido o ausente", legacyId };
  const brand = verifiedBrand(name);
  if (!brand) return { reason: "Marca de celular no verificable", legacyId };
  const imageSrc = safeImage(item.foto);
  const colors = (item.colores ?? []).map(cleanText).filter((value): value is string => Boolean(value));
  const technicalId = `legacy-phone:${legacyId}`;

  return {
    legacyId,
    product: freezeProduct({
      id: technicalId,
      slug: `${slugPart(name)}-${stableHash(technicalId)}`,
      name,
      brand,
      model: null,
      category: "celulares",
      subcategory: phoneSubcategory(brand),
      image: imageSrc ? { src: imageSrc, alt: `${name} — AmarangoElectro` } : null,
      price: { amount: price, currency: "ARS" },
      financing: [],
      availability: "unknown",
      stock: { status: "unknown", quantity: null, label: null },
      features: splitFeatures(item.caracteristicas),
      specifications: colors.length ? { Colores: colors.join(", ") } : {},
      description: null,
      warranty: null,
      visible: true,
      source: "legacy-pilot",
    }),
  };
}

export function normalizeLegacyCatalog(snapshot: Readonly<LegacyCatalogSnapshot>): LegacyNormalizationResult {
  const products: Product[] = [];
  const rejected: LegacyCatalogDiagnostic[] = [];
  const acceptedMeta: Array<{ source: LegacyDatasetName; index: number; product: Product }> = [];

  const sources: Array<{ name: LegacyDatasetName; rows: unknown[]; convert: (raw: unknown, index: number) => ConversionResult }> = [
    { name: "tienda_catalogo", rows: datasetRows(snapshot.tiendaCatalogo), convert: fromCatalog },
    { name: "celulares_lista", rows: datasetRows(snapshot.celularesLista), convert: fromPhone },
  ];

  for (const source of sources) {
    source.rows.forEach((row, index) => {
      const result = source.convert(row, index);
      if (!result.product) {
        rejected.push({
          source: source.name,
          index,
          legacyId: result.legacyId ?? null,
          reason: result.reason ?? "Registro no normalizable",
        });
        return;
      }
      products.push(result.product);
      acceptedMeta.push({ source: source.name, index, product: result.product });
    });
  }

  const duplicateGroups = new Map<string, typeof acceptedMeta>();
  for (const item of acceptedMeta) {
    const key = duplicateFingerprint(item.product);
    duplicateGroups.set(key, [...(duplicateGroups.get(key) ?? []), item]);
  }
  const potentialDuplicates = [...duplicateGroups.entries()]
    .filter(([, entries]) => entries.length > 1)
    .map(([key, entries]) => ({
      key,
      products: entries.map((entry) => ({
        source: entry.source,
        index: entry.index,
        id: entry.product.id,
        name: entry.product.name,
      })),
    }));

  return { products, rejected, potentialDuplicates };
}
