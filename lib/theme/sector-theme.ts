/**
 * Capa puramente presentacional (Sector Theme / Emotional Context) recuperada
 * del paquete visual V86 · Emotional Mall / Shopping Master Home.
 *
 * NO es taxonomía canónica ni dato de producto: es solo color/copy de
 * ambientación. La fuente de verdad de sectores/subcategorías sigue siendo
 * `lib/catalog/categories.ts` (no se modifica ni se lee de acá ningún dato
 * comercial). Los `categorySlugs` de cada ruta emocional son curación de
 * descubrimiento, no reemplazan la navegación canónica por categoría.
 *
 * Colores extraídos literalmente de las 6 "Rutas" reales del archivo
 * `amarangoelectro-v16-visual-lab-v86-emotional-mall-shopping-master-home.html`
 * (paquete AMARANGOELECTRO-V16-PAQUETE-MAESTRO-INTEGRACION-VISUAL, SHA-256
 * 16d8a76511340675afd6b475c206c0baca379857adfa3e6ffd464586f11f7aaf).
 */

export type EmotionalRouteKey =
  | "descansar"
  | "disfrutar"
  | "cocinar-compartir"
  | "tu-hogar"
  | "trabajar-conectarte"
  | "salir-moverte";

export interface EmotionalRouteDefinition {
  key: EmotionalRouteKey;
  numberLabel: string;
  title: string;
  copy: string;
  /** Color literal recuperado de V86 (--route-accent de esa ruta). */
  accent: string;
  /** Slugs reales de `lib/catalog/categories.ts` asociados a esta ruta. */
  categorySlugs: string[];
}

export const emotionalRoutes: readonly EmotionalRouteDefinition[] = [
  {
    key: "descansar",
    numberLabel: "Ruta 01",
    title: "Para descansar",
    copy: "Hacer del descanso un lugar.",
    accent: "#0b63ce",
    categorySlugs: ["descanso", "hogar"],
  },
  {
    key: "disfrutar",
    numberLabel: "Ruta 02",
    title: "Para disfrutar",
    copy: "Cuando el plan es quedarse y pasarla bien.",
    accent: "#198e78",
    categorySlugs: ["audio", "smart-tv", "gaming"],
  },
  {
    key: "cocinar-compartir",
    numberLabel: "Ruta 03",
    title: "Para cocinar y compartir",
    copy: "Preparar algo también es preparar el momento.",
    accent: "#4476d8",
    categorySlugs: ["electrodomesticos", "hogar"],
  },
  {
    key: "tu-hogar",
    numberLabel: "Ruta 04",
    title: "Para tu hogar",
    copy: "Resolver, ordenar y hacer tuyo el espacio.",
    accent: "#7c4bd2",
    categorySlugs: ["hogar", "electrodomesticos"],
  },
  {
    key: "trabajar-conectarte",
    numberLabel: "Ruta 05",
    title: "Para trabajar y conectarte",
    copy: "Seguir tu ritmo, donde estés.",
    accent: "#c87b08",
    categorySlugs: ["tecnologia-accesorios", "celulares"],
  },
  {
    key: "salir-moverte",
    numberLabel: "Ruta 06",
    title: "Para salir y moverte",
    copy: "Cuando el día sigue afuera.",
    accent: "#e97819",
    categorySlugs: ["camping-aire-libre-mascotas", "auto-motos-energia"],
  },
] as const;

/**
 * Mapa slug de categoría canónica → color de sector, derivado de la ruta
 * emocional primaria a la que pertenece esa categoría en V86. Las categorías
 * sin ruta asignada (herramientas, cuidado-personal-salud, bebes-juguetes,
 * otros) heredan el Amarango Theme base (sin --sector-accent propio) en vez
 * de inventarles un color que V86 no definió.
 */
export const sectorAccentBySlug: Readonly<Record<string, string>> = Object.fromEntries(
  emotionalRoutes.flatMap((route) => route.categorySlugs.map((slug) => [slug, route.accent])),
);

export function getSectorAccent(slug: string): string | undefined {
  return sectorAccentBySlug[slug];
}
