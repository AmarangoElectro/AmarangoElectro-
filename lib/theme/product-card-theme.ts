export type ProductCardVisualTheme = {
  sectorId: string;
  brandId: string;
  sectorAccent: string;
  sectorSoft: string;
  brandAccent: string;
  brandSoft: string;
  brandDeep: string;
  watermarkLabel: string;
};

export type ProductCardVisualContext = "amarango" | "sector" | "brand";

type AccentTokens = {
  accent: string;
  soft: string;
  deep: string;
};

const DEFAULT_SECTOR: AccentTokens = { accent: "#0b3978", soft: "#eaf1fb", deep: "#061a37" };
const DEFAULT_BRAND: AccentTokens = { accent: "#155cac", soft: "#e7effa", deep: "#061a37" };
const AMARANGO_BRAND: AccentTokens = { accent: "#ff6818", soft: "#fff0e8", deep: "#071a36" };

export const PRODUCT_CARD_THEMES = {
  sectors: {
    celulares: { accent: "#155cac", soft: "#e8f1ff", deep: "#061a37" },
    "smart-tv": { accent: "#123f7a", soft: "#e8eef8", deep: "#06152d" },
    audio: { accent: "#087ed1", soft: "#e3f4ff", deep: "#051a36" },
    gaming: { accent: "#3155d7", soft: "#e9edff", deep: "#070d25" },
    electrodomesticos: { accent: "#39708f", soft: "#edf4f7", deep: "#102b3d" },
    hogar: { accent: "#b65e24", soft: "#fbefe7", deep: "#382015" },
    herramientas: { accent: "#d56f18", soft: "#fff0e2", deep: "#3d210d" },
    "tecnologia-accesorios": { accent: "#087d8c", soft: "#e4f6f7", deep: "#06313a" },
    descanso: { accent: "#9a633f", soft: "#f7eee8", deep: "#362318" },
    "cuidado-personal-salud": { accent: "#138b86", soft: "#e5f7f4", deep: "#073a38" },
    "bebes-juguetes": { accent: "#7762c9", soft: "#f0edff", deep: "#292047" },
    "auto-motos-energia": { accent: "#b6522f", soft: "#faece7", deep: "#392017" },
    "camping-aire-libre-mascotas": { accent: "#477b50", soft: "#ecf5ed", deep: "#17331d" },
    otros: DEFAULT_SECTOR,
  },
  brands: {
    apple: { accent: "#69717d", soft: "#eef0f3", deep: "#171c24" },
    samsung: { accent: "#0b5be7", soft: "#e4edff", deep: "#071b48" },
    motorola: { accent: "#1872d1", soft: "#e2f0ff", deep: "#08264f" },
    xiaomi: { accent: "#f56600", soft: "#fff0e6", deep: "#4a1d06" },
    redmi: { accent: "#f56600", soft: "#fff0e6", deep: "#4a1d06" },
    poco: { accent: "#e9c500", soft: "#fffbe0", deep: "#383000" },
    infinix: { accent: "#17a58d", soft: "#e2f7f2", deep: "#073d35" },
    jbl: { accent: "#f15a24", soft: "#ffebe4", deep: "#491909" },
    sony: { accent: "#2359a7", soft: "#e7eef9", deep: "#101d36" },
    playstation: { accent: "#006fcd", soft: "#e2f1ff", deep: "#061d3d" },
    tcl: { accent: "#df1234", soft: "#ffe8ec", deep: "#4a0713" },
    kanji: { accent: "#cc3e2e", soft: "#fceae7", deep: "#3f1510" },
    kanjihome: { accent: "#cc3e2e", soft: "#fceae7", deep: "#3f1510" },
    "kanji-tools": { accent: "#cc3e2e", soft: "#fceae7", deep: "#3f1510" },
    telefunken: { accent: "#d4142d", soft: "#fde7ea", deep: "#430811" },
    "ken-brown": { accent: "#d77a1d", soft: "#fff0df", deep: "#45260b" },
  },
} as const;

function tokenKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getProductCardVisualTheme(sector: string, brand: string, context: ProductCardVisualContext = "brand"): ProductCardVisualTheme {
  const sectorId = tokenKey(sector) || "otros";
  const brandId = tokenKey(brand) || "generica";
  const sectors = PRODUCT_CARD_THEMES.sectors as Record<string, AccentTokens>;
  const brands = PRODUCT_CARD_THEMES.brands as Record<string, AccentTokens>;
  const sectorTokens = sectors[sectorId] ?? DEFAULT_SECTOR;
  const brandTokens = context === "amarango"
    ? AMARANGO_BRAND
    : context === "sector"
      ? sectorTokens
      : brands[brandId] ?? DEFAULT_BRAND;
  const contextBrandId = context === "amarango" ? "amarango" : context === "sector" ? `sector-${sectorId}` : brandId;

  return {
    sectorId,
    brandId: contextBrandId,
    sectorAccent: sectorTokens.accent,
    sectorSoft: sectorTokens.soft,
    brandAccent: brandTokens.accent,
    brandSoft: brandTokens.soft,
    brandDeep: brandTokens.deep,
    watermarkLabel: context === "amarango" ? "AMARANGO" : context === "sector" ? sector.replace(/-/g, " ").trim() : brand.trim(),
  };
}
