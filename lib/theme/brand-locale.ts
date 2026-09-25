import { brandsShareFamily } from "@/lib/catalog/brand-family";

export type BrandLocaleKey =
  | "apple" | "samsung" | "motorola" | "xiaomi" | "infinix" | "poco"
  | "tcl" | "jbl" | "sony" | "playstation"
  | "kanjihome" | "kanji" | "kanji-tools" | "telefunken" | "ken-brown";

export interface BrandLocaleDefinition {
  key: BrandLocaleKey;
  brand: string;
  sectors: readonly string[];
  tabLabel: string;
  badge: string;
  kicker: string;
  title: string;
  description: string;
  mood: string;
  accent: string;
  accent2: string;
  background: string;
  darkBackground: string;
  fontFamily: string;
  orb: string;
  wordmark: string;
}

/**
 * V16 Brand Locale System.
 *
 * Presentational only. Values are recovered from the owner-approved
 * `AMARANGOELECTRO-V16-PREVIEW-LOCALES-APPLE-SAMSUNG-MOTOROLA-CHROME.html`.
 * This layer never changes Product, catalog data, pricing, financing, stock,
 * CTA semantics or authorization. It only changes the atmosphere when a
 * supported brand is explicitly selected in Celulares.
 */
export const brandLocales: readonly BrandLocaleDefinition[] = [
  {
    key: "apple",
    brand: "Apple",
    sectors: ["celulares"],
    tabLabel: "Apple / iPhone",
    badge: "LOCAL APPLE",
    kicker: "IPHONE · ECOSISTEMA APPLE",
    title: "iPhone",
    description:
      "Minimalismo, precisión y mucha respiración visual. El local se siente más editorial y refinado, sin copiar Apple.com ni salir de AmarangoElectro.",
    mood: "Precisión · aluminio · silencio visual",
    accent: "#111827",
    accent2: "#9ca3af",
    background: "linear-gradient(145deg,#ffffff 0%,#f4f5f7 55%,#eef0f3 100%)",
    darkBackground: "linear-gradient(145deg,#07090d,#10141b 60%,#090c11)",
    fontFamily: "'SF Pro Display','Helvetica Neue',Arial,sans-serif",
    orb: "radial-gradient(circle at 50% 45%,rgba(255,255,255,.95),rgba(220,224,230,.48) 38%,rgba(17,24,39,.12) 68%,transparent 70%)",
    wordmark: "iPhone",
  },
  {
    key: "samsung",
    brand: "Samsung",
    sectors: ["celulares", "smart-tv"],
    tabLabel: "Samsung",
    badge: "LOCAL SAMSUNG",
    kicker: "GALAXY · TECNOLOGÍA CONECTADA",
    title: "Samsung Galaxy",
    description:
      "Azul profundo, movimiento sutil y sensación de innovación. Más dinámico que Apple, pero igual de premium y limpio.",
    mood: "Galaxy · profundidad · innovación",
    accent: "#1428a0",
    accent2: "#4f8cff",
    background:
      "radial-gradient(circle at 75% 15%,rgba(79,140,255,.22),transparent 27%),linear-gradient(145deg,#fbfdff,#edf3ff 55%,#f9fbff)",
    darkBackground:
      "radial-gradient(circle at 76% 18%,rgba(79,140,255,.18),transparent 28%),linear-gradient(145deg,#050a18,#0b1530 58%,#071020)",
    fontFamily: "'Helvetica Neue',Arial,sans-serif",
    orb: "conic-gradient(from 220deg,rgba(20,40,160,.12),rgba(79,140,255,.46),rgba(20,40,160,.14),rgba(79,140,255,.10))",
    wordmark: "SAMSUNG",
  },
  {
    key: "motorola",
    brand: "Motorola",
    sectors: ["celulares"],
    tabLabel: "Motorola",
    badge: "LOCAL MOTOROLA",
    kicker: "MOTO · DISEÑO Y PERSONALIDAD",
    title: "Motorola",
    description:
      "Más humano y expresivo, con curvas y contraste controlado. Mantiene una estética tecnológica sin volverse juvenil ni estridente.",
    mood: "Curvas · ligereza · identidad",
    accent: "#001428",
    accent2: "#5ec6f4",
    background:
      "radial-gradient(circle at 76% 18%,rgba(94,198,244,.24),transparent 26%),linear-gradient(145deg,#fbfdff,#eaf6fb 54%,#f8fcfe)",
    darkBackground:
      "radial-gradient(circle at 76% 18%,rgba(94,198,244,.16),transparent 28%),linear-gradient(145deg,#03101a,#071b2b 60%,#05131f)",
    fontFamily: "'Avenir Next','Helvetica Neue',Arial,sans-serif",
    orb: "radial-gradient(ellipse at 50% 50%,rgba(94,198,244,.42),rgba(0,20,40,.12) 52%,transparent 66%)",
    wordmark: "motorola",
  },
  {
    key: "xiaomi", brand: "Xiaomi", sectors: ["celulares", "cuidado-personal-salud", "tecnologia-accesorios"],
    tabLabel: "Xiaomi", badge: "LOCAL XIAOMI", kicker: "SMART · ECOSISTEMA XIAOMI", title: "Xiaomi",
    description: "Tecnología conectada, limpia y funcional dentro del sistema AmarangoElectro.",
    mood: "Smart · simple · conectado", accent: "#ff6900", accent2: "#ff9d52",
    background: "linear-gradient(145deg,#fffaf6,#fff1e5 58%,#fffaf6)", darkBackground: "linear-gradient(145deg,#170b03,#2a1205 60%,#120802)",
    fontFamily: "'Helvetica Neue',Arial,sans-serif", orb: "radial-gradient(circle,rgba(255,105,0,.32),transparent 66%)", wordmark: "Xiaomi",
  },
  {
    key: "infinix", brand: "Infinix", sectors: ["celulares"], tabLabel: "Infinix", badge: "LOCAL INFINIX",
    kicker: "SMARTPHONE · DISEÑO", title: "Infinix", description: "Una identidad tecnológica moderna sin romper la estructura comercial de AmarangoElectro.",
    mood: "Energía · pantalla · diseño", accent: "#75d600", accent2: "#b8ff65",
    background: "linear-gradient(145deg,#fbfff7,#efffe1 58%,#fbfff7)", darkBackground: "linear-gradient(145deg,#071006,#102006 60%,#071006)",
    fontFamily: "Arial,sans-serif", orb: "radial-gradient(circle,rgba(117,214,0,.32),transparent 66%)", wordmark: "Infinix",
  },
  {
    key: "poco", brand: "Poco", sectors: ["celulares"], tabLabel: "POCO", badge: "LOCAL POCO",
    kicker: "SPEED · PERFORMANCE", title: "POCO", description: "Rendimiento y gaming con una identidad veloz y directa.",
    mood: "Potencia · velocidad · estilo", accent: "#111111", accent2: "#ffd21f",
    background: "linear-gradient(145deg,#fffef8,#fff7cd 58%,#ffffff)", darkBackground: "linear-gradient(145deg,#050709,#111821 60%,#07090d)",
    fontFamily: "Arial,sans-serif", orb: "radial-gradient(circle,rgba(255,210,31,.34),transparent 66%)", wordmark: "POCO",
  },
  {
    key: "tcl", brand: "TCL", sectors: ["smart-tv"], tabLabel: "TCL", badge: "LOCAL TCL",
    kicker: "SMART TV · ENTRETENIMIENTO", title: "TCL", description: "Más pantalla, inmersión y una presencia visual propia dentro del shopping AmarangoElectro.",
    mood: "Pantalla · inmersión · color", accent: "#ff3b30", accent2: "#8d0b0b",
    background: "linear-gradient(145deg,#fff8f7,#ffe9e7 58%,#fff8f7)", darkBackground: "linear-gradient(145deg,#190504,#300807 60%,#120303)",
    fontFamily: "Arial,sans-serif", orb: "radial-gradient(circle,rgba(255,59,48,.34),transparent 66%)", wordmark: "TCL",
  },
  {
    key: "jbl", brand: "JBL", sectors: ["audio"], tabLabel: "JBL", badge: "LOCAL JBL",
    kicker: "AUDIO · POTENCIA", title: "JBL", description: "Sonido con identidad fuerte, manteniendo cards, cuotas y navegación global.",
    mood: "Potencia · ritmo · energía", accent: "#ff5a00", accent2: "#ff9b5c",
    background: "linear-gradient(145deg,#fff9f5,#ffeadf 58%,#fff9f5)", darkBackground: "linear-gradient(145deg,#180a02,#301004 60%,#120701)",
    fontFamily: "Arial,sans-serif", orb: "radial-gradient(circle,rgba(255,90,0,.35),transparent 66%)", wordmark: "JBL",
  },
  {
    key: "sony", brand: "Sony", sectors: ["audio", "gaming"], tabLabel: "Sony", badge: "LOCAL SONY",
    kicker: "SONIDO · ENTRETENIMIENTO", title: "Sony", description: "Una atmósfera sobria y tecnológica para audio y entretenimiento.",
    mood: "Precisión · sonido · imagen", accent: "#1d4ed8", accent2: "#60a5fa",
    background: "linear-gradient(145deg,#fbfdff,#eaf1ff 58%,#fbfdff)", darkBackground: "linear-gradient(145deg,#050914,#0a1630 60%,#050914)",
    fontFamily: "'Helvetica Neue',Arial,sans-serif", orb: "radial-gradient(circle,rgba(29,78,216,.30),transparent 66%)", wordmark: "SONY",
  },
  {
    key: "playstation", brand: "PlayStation", sectors: ["gaming"], tabLabel: "PlayStation", badge: "LOCAL PLAYSTATION",
    kicker: "PLAY · GAMING", title: "PlayStation", description: "Gaming premium con identidad propia y el sistema comercial Amarango intacto.",
    mood: "Juego · velocidad · inmersión", accent: "#006fcd", accent2: "#52a8ff",
    background: "linear-gradient(145deg,#f8fbff,#e5f2ff 58%,#f8fbff)", darkBackground: "linear-gradient(145deg,#030b16,#071a31 60%,#030914)",
    fontFamily: "Arial,sans-serif", orb: "radial-gradient(circle,rgba(0,111,205,.34),transparent 66%)", wordmark: "PlayStation",
  },
  {
    key: "kanjihome", brand: "Kanjihome", sectors: ["hogar"], tabLabel: "Kanjihome", badge: "LOCAL KANJIHOME",
    kicker: "HOGAR · DISEÑO", title: "Kanjihome", description: "Un local cálido y ordenado para hogar, sin alterar la lógica global de la tienda.",
    mood: "Hogar · calma · diseño", accent: "#8b5e3c", accent2: "#c79a72",
    background: "linear-gradient(145deg,#fffdf9,#f5eee6 58%,#fffdf9)", darkBackground: "linear-gradient(145deg,#120d09,#24170f 60%,#100b08)",
    fontFamily: "Arial,sans-serif", orb: "radial-gradient(circle,rgba(139,94,60,.28),transparent 66%)", wordmark: "Kanjihome",
  },
  {
    key: "kanji", brand: "Kanji", sectors: ["electrodomesticos", "hogar"], tabLabel: "Kanji", badge: "LOCAL KANJI",
    kicker: "ELECTRO · HOGAR", title: "Kanji", description: "Electro y hogar con una identidad clara, integrada al mismo sistema V16.",
    mood: "Práctico · hogar · tecnología", accent: "#d97706", accent2: "#fbbf24",
    background: "linear-gradient(145deg,#fffdf7,#fff3d6 58%,#fffdf7)", darkBackground: "linear-gradient(145deg,#160d02,#2b1904 60%,#120a02)",
    fontFamily: "Arial,sans-serif", orb: "radial-gradient(circle,rgba(217,119,6,.30),transparent 66%)", wordmark: "KANJI",
  },
  {
    key: "kanji-tools", brand: "Kanji Tools", sectors: ["herramientas"], tabLabel: "Kanji Tools", badge: "LOCAL KANJI TOOLS",
    kicker: "HERRAMIENTAS · POTENCIA", title: "Kanji Tools", description: "Herramientas con presencia industrial limpia y navegación Amarango consistente.",
    mood: "Potencia · precisión · trabajo", accent: "#f59e0b", accent2: "#fcd34d",
    background: "linear-gradient(145deg,#fffdf7,#fff2cc 58%,#fffdf7)", darkBackground: "linear-gradient(145deg,#12100a,#27200b 60%,#0f0d08)",
    fontFamily: "Arial,sans-serif", orb: "radial-gradient(circle,rgba(245,158,11,.32),transparent 66%)", wordmark: "KANJI TOOLS",
  },
  {
    key: "telefunken", brand: "Telefunken", sectors: ["electrodomesticos"], tabLabel: "Telefunken", badge: "LOCAL TELEFUNKEN",
    kicker: "ELECTRO · TECNOLOGÍA", title: "Telefunken", description: "Una experiencia tecnológica sobria para electrodomésticos dentro de V16.",
    mood: "Tecnología · hogar · confianza", accent: "#dc2626", accent2: "#fb7185",
    background: "linear-gradient(145deg,#fffafa,#ffecec 58%,#fffafa)", darkBackground: "linear-gradient(145deg,#150505,#2b0909 60%,#110404)",
    fontFamily: "Arial,sans-serif", orb: "radial-gradient(circle,rgba(220,38,38,.30),transparent 66%)", wordmark: "TELEFUNKEN",
  },
  {
    key: "ken-brown", brand: "Ken Brown", sectors: ["audio", "electrodomesticos", "hogar"], tabLabel: "Ken Brown", badge: "LOCAL KEN BROWN",
    kicker: "ELECTRO · AUDIO", title: "Ken Brown", description: "Productos Ken Brown organizados como local dinámico cuando exista catálogo publicable.",
    mood: "Potencia · uso diario · presencia", accent: "#c2410c", accent2: "#fb923c",
    background: "linear-gradient(145deg,#fffaf7,#ffede3 58%,#fffaf7)", darkBackground: "linear-gradient(145deg,#160903,#2c1106 60%,#110702)",
    fontFamily: "Arial,sans-serif", orb: "radial-gradient(circle,rgba(194,65,12,.30),transparent 66%)", wordmark: "KEN BROWN",
  },
] as const;

export function getBrandLocale(brand?: string, sector?: string): BrandLocaleDefinition | undefined {
  if (!brand) return undefined;
  return brandLocales.find((locale) =>
    brandsShareFamily(locale.brand, brand) &&
    (!sector || locale.sectors.includes(sector))
  );
}

export function getBrandLocalesForSector(sector: string, publishableBrands: ReadonlySet<string>) {
  return brandLocales.filter((locale) =>
    locale.sectors.includes(sector)
    && [...publishableBrands].some((brand) => brandsShareFamily(locale.brand, brand))
  );
}
