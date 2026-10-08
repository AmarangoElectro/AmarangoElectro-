import { normalizeBrandFamily } from "@/lib/catalog/brand-family";
import { categories } from "@/lib/catalog/categories";
import { retailCategories } from "@/lib/catalog/retail-categories";
import { coordinatedSectorArt } from "./sector-banner-art";

const generated = (key: string) => `/assets/v16-generated/brand-drawers-v1/${key}.webp`;

const generatedScopes: Readonly<Record<string, string>> = {
  audio: generated("audio"),
  "smart-tv": generated("smart-tv"),
  lavado: generated("lavado"),
  refrigeracion: generated("refrigeracion"),
  coccion: generated("coccion"),
  "pequenos-electrodomesticos": generated("pequenos-electrodomesticos"),
  limpieza: generated("limpieza"),
  herramientas: generated("herramientas"),
  descanso: generated("descanso"),
};

const audioBrands: Readonly<Record<string, string>> = {
  crown: generated("crown-audio"),
  xiaomi: generated("xiaomi-audio"),
  novik: generated("novik-audio"),
  telefunken: generated("telefunken-audio"),
};

const retailAliases: Readonly<Record<string, string>> = {
  "colchones-y-sommiers": "colchones-sommiers",
  "hogar-y-deco": "hogar-decoracion",
  "bazar-y-mesa": "hogar-decoracion",
  "cargadores-y-accesorios": "cargadores-accesorios",
  "camping-y-aire-libre": "deporte-movilidad",
  "auto-y-motos": "auto-motos",
  energia: "auto-motos",
  juguetes: "bebes",
};

const descriptions: Readonly<Record<string, string>> = {
  audio: "Sonido para tus mejores momentos.",
  "smart-tv": "Encontrá tu próxima pantalla.",
  lavado: "Cuidado para tu ropa, todos los días.",
  refrigeracion: "Frescura para tu hogar.",
  coccion: "Más ideas para tu cocina.",
  "pequenos-electrodomesticos": "Hacé más simple tu día.",
  limpieza: "Tu casa, a tu manera.",
  herramientas: "Potencia para tus proyectos.",
  descanso: "Confort para descansar mejor.",
  hogar: "Detalles para sentirte en casa.",
  "tecnologia-accesorios": "Conectá lo que necesitás.",
};

/** Backgrounds for missing brand artwork only. No product, price or route changes. */
export function getBrandDrawerBackdrop(categorySlug: string, sectorSlug?: string, brand = "") {
  const category = categories.find((item) => item.slug === categorySlug);
  const sector = category?.subcategories.find((item) => item.slug === sectorSlug);
  const scope = sectorSlug ?? categorySlug;
  const retail = retailCategories.find((item) => item.id === (retailAliases[scope] ?? scope));
  const image = (categorySlug === "audio" ? audioBrands[normalizeBrandFamily(brand)] : undefined)
    ?? generatedScopes[scope]
    ?? generatedScopes[categorySlug]
    ?? retail?.image
    ?? coordinatedSectorArt[scope]
    ?? coordinatedSectorArt[categorySlug]
    ?? coordinatedSectorArt.otros;
  return {
    image,
    title: sector?.title ?? category?.title ?? "Catálogo",
    description: descriptions[scope] ?? descriptions[categorySlug] ?? "Encontrá lo que buscás.",
  };
}
