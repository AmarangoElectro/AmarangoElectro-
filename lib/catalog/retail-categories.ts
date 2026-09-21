export type RetailCategorySize = "hero" | "wide" | "compact";
export type RetailCategoryArtworkMode = "embedded" | "background";
export type RetailCategoryArtworkRatio = "4:3" | "3:2";

export interface RetailCategoryEntry {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  href: string;
  icon: string;
  image: string;
  mobileImage: string;
  size: RetailCategorySize;
  artworkMode: RetailCategoryArtworkMode;
  artworkRatio: RetailCategoryArtworkRatio;
  overlayLogo?: boolean;
}

const categoryHref = (category: string, sector?: string) =>
  `/categoria/${category}${sector ? `?sector=${sector}#sector-activo` : ""}`;

const sectorArt = (id: string) => `/assets/v16-generated/sectors-v2/${id}.webp`;

const backgroundArtwork = {
  artworkMode: "background" as const,
  artworkRatio: "3:2" as const,
};

/**
 * Capa de descubrimiento V4.9. No reemplaza la taxonomía canónica de 11
 * universos: traduce las 22 entradas comerciales aprobadas a sus rutas V16.
 */
export const retailCategories: readonly RetailCategoryEntry[] = [
  { id: "celulares", title: "Celulares", eyebrow: "TECNOLOGÍA PERSONAL", description: "Modelos premium, innovación y potencia para cada estilo.", href: categoryHref("celulares"), icon: "📱", image: sectorArt("celulares"), mobileImage: sectorArt("celulares"), size: "hero", ...backgroundArtwork },
  { id: "smart-tv", title: "Smart TV", eyebrow: "IMAGEN & ENTRETENIMIENTO", description: "Cine, profundidad y conectividad en gran escala.", href: categoryHref("smart-tv"), icon: "📺", image: sectorArt("smart-tv"), mobileImage: sectorArt("smart-tv"), size: "hero", ...backgroundArtwork },
  { id: "audio", title: "Audio", eyebrow: "SONIDO & ENTRETENIMIENTO", description: "Parlantes, barras y auriculares que se sienten.", href: categoryHref("audio"), icon: "🔊", image: sectorArt("audio"), mobileImage: sectorArt("audio"), size: "hero", ...backgroundArtwork },
  { id: "refrigeracion", title: "Refrigeración", eyebrow: "ELECTRODOMÉSTICOS", description: "Heladeras, freezers y frigobares.", href: categoryHref("electrodomesticos", "refrigeracion"), icon: "❄️", image: sectorArt("refrigeracion"), mobileImage: sectorArt("refrigeracion"), size: "wide", ...backgroundArtwork },
  { id: "coccion", title: "Cocción", eyebrow: "SABORES & CALIDEZ", description: "Cocinas, hornos y soluciones para cocinar.", href: categoryHref("electrodomesticos", "coccion"), icon: "🍳", image: sectorArt("coccion"), mobileImage: sectorArt("coccion"), size: "wide", ...backgroundArtwork },
  { id: "climatizacion", title: "Climatización", eyebrow: "CONFORT TODO EL AÑO", description: "Frío, calor y bienestar para cada ambiente.", href: categoryHref("electrodomesticos", "climatizacion"), icon: "🌬️", image: sectorArt("climatizacion"), mobileImage: sectorArt("climatizacion"), size: "wide", ...backgroundArtwork },
  { id: "lavado", title: "Lavado", eyebrow: "HOGAR PREMIUM", description: "Cuidado moderno para tu ropa y tu día a día.", href: categoryHref("electrodomesticos", "lavado"), icon: "🫧", image: sectorArt("lavado"), mobileImage: sectorArt("lavado"), size: "wide", ...backgroundArtwork },
  { id: "pequenos-electrodomesticos", title: "Pequeños electrodomésticos", eyebrow: "SOLUCIONES PRÁCTICAS", description: "Equipos que simplifican cada momento.", href: categoryHref("electrodomesticos", "pequenos-electrodomesticos"), icon: "☕", image: sectorArt("pequenos-electrodomesticos"), mobileImage: sectorArt("pequenos-electrodomesticos"), size: "wide", ...backgroundArtwork },
  { id: "limpieza", title: "Limpieza", eyebrow: "ESPACIOS IMPECABLES", description: "Aspirado, vapor y cuidado del hogar.", href: categoryHref("electrodomesticos", "limpieza"), icon: "🧹", image: sectorArt("limpieza"), mobileImage: sectorArt("limpieza"), size: "wide", ...backgroundArtwork },
  { id: "colchones-sommiers", title: "Colchones y sommiers", eyebrow: "DESCANSO PREMIUM", description: "Confort y soporte con Piero como referencia comercial.", href: categoryHref("descanso", "colchones-y-sommiers"), icon: "🌙", image: sectorArt("colchones-sommiers"), mobileImage: sectorArt("colchones-sommiers"), size: "wide", ...backgroundArtwork },
  { id: "blanqueria", title: "Blanquería", eyebrow: "SUAVIDAD & LUZ", description: "Textiles para renovar cada espacio.", href: categoryHref("hogar", "blanqueria"), icon: "🛏️", image: sectorArt("blanqueria"), mobileImage: sectorArt("blanqueria"), size: "wide", ...backgroundArtwork },
  { id: "muebles", title: "Muebles", eyebrow: "CONFORT & DISEÑO", description: "Muebles y soluciones para ambientes cálidos.", href: categoryHref("hogar", "hogar-y-deco"), icon: "🛋️", image: sectorArt("muebles"), mobileImage: sectorArt("muebles"), size: "wide", ...backgroundArtwork },
  { id: "hogar-decoracion", title: "Hogar y decoración", eyebrow: "CASA & ESTILO", description: "Calidez, luz natural y detalles que acompañan.", href: categoryHref("hogar", "hogar-y-deco"), icon: "🪴", image: sectorArt("hogar-decoracion"), mobileImage: sectorArt("hogar-decoracion"), size: "wide", ...backgroundArtwork },
  { id: "deporte-movilidad", title: "Deporte y movilidad", eyebrow: "MOVIMIENTO", description: "Aire libre, movilidad y opciones para disfrutar cada salida.", href: categoryHref("deportes-movilidad"), icon: "🚲", image: sectorArt("deporte-movilidad"), mobileImage: sectorArt("deporte-movilidad"), size: "wide", ...backgroundArtwork },
  { id: "informatica", title: "Informática", eyebrow: "TRABAJO & ESTUDIO", description: "Sector preparado para equipos y periféricos.", href: categoryHref("tecnologia-accesorios"), icon: "💻", image: sectorArt("informatica"), mobileImage: sectorArt("informatica"), size: "wide", ...backgroundArtwork },
  { id: "cargadores-accesorios", title: "Cargadores y accesorios", eyebrow: "CONECTÁ TODO", description: "Cables, cargadores y complementos.", href: categoryHref("tecnologia-accesorios", "cargadores-y-accesorios"), icon: "🔌", image: sectorArt("cargadores-accesorios"), mobileImage: sectorArt("cargadores-accesorios"), size: "wide", ...backgroundArtwork },
  { id: "cuidado-personal-salud", title: "Cuidado personal y salud", eyebrow: "BIENESTAR", description: "Cuidado diario en una experiencia clara.", href: categoryHref("cuidado-personal-salud"), icon: "💙", image: sectorArt("cuidado-personal-salud"), mobileImage: sectorArt("cuidado-personal-salud"), size: "wide", ...backgroundArtwork },
  { id: "bebes", title: "Bebés", eyebrow: "FAMILIA", description: "Soluciones para acompañar cada etapa.", href: categoryHref("bebes-juguetes", "bebes"), icon: "🍼", image: sectorArt("bebes"), mobileImage: sectorArt("bebes"), size: "wide", ...backgroundArtwork },
  { id: "auto-motos", title: "Accesorios para auto y motos", eyebrow: "MOVILIDAD", description: "Accesorios y soluciones para el camino.", href: categoryHref("auto-motos-energia", "auto-y-motos"), icon: "🚗", image: sectorArt("auto-motos"), mobileImage: sectorArt("auto-motos"), size: "wide", ...backgroundArtwork },
  { id: "mascotas", title: "Mascotas", eyebrow: "COMPAÑÍA", description: "Cuidado, comodidad y juego.", href: categoryHref("camping-aire-libre-mascotas", "mascotas"), icon: "🐾", image: sectorArt("mascotas"), mobileImage: sectorArt("mascotas"), size: "wide", ...backgroundArtwork },
  { id: "gaming", title: "Gaming", eyebrow: "PLAYSTATION & MÁS", description: "Consolas, juegos y accesorios gamer.", href: categoryHref("gaming"), icon: "🎮", image: sectorArt("gaming"), mobileImage: sectorArt("gaming"), size: "wide", ...backgroundArtwork },
  { id: "otros", title: "Otros", eyebrow: "EXPLORÁ MÁS", description: "Búsqueda y exploración progresiva sin listas interminables.", href: categoryHref("otros"), icon: "✦", image: sectorArt("otros"), mobileImage: sectorArt("otros"), size: "wide", ...backgroundArtwork },
] as const;
