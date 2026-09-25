export type CategoryHomePlacement = "primary" | "more" | "fallback";
export type BannerAssetStatus = "ready" | "awaiting-image";
export type NavigationStatus = "active" | "compatibility" | "planned";
export type CategoryBannerFraming = "focused-art" | "full-composition";

export interface SubcategoryDefinition {
  slug: string;
  title: string;
  description: string;
  brand?: string;
  icon: string;
  image?: string;
  imageStatus: BannerAssetStatus;
  navigationStatus?: NavigationStatus;
  legacyAliases?: string[];
}

export interface CategoryDefinition {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  icon: string;
  image?: string;
  mobileImage?: string;
  bannerImage?: string;
  bannerImageStatus?: BannerAssetStatus;
  bannerFraming?: CategoryBannerFraming;
  heroTagline?: string;
  imageStatus: BannerAssetStatus;
  brands: string[];
  homePlacement: CategoryHomePlacement;
  homePriority: number;
  isFallback?: boolean;
  navigationStatus?: Exclude<NavigationStatus, "planned">;
  legacyAliases?: string[];
  subcategories: SubcategoryDefinition[];
}

const sub = (
  slug: string,
  title: string,
  description: string,
  icon: string,
  options: Partial<Pick<SubcategoryDefinition, "brand" | "image" | "imageStatus" | "navigationStatus" | "legacyAliases">> = {},
): SubcategoryDefinition => ({
  slug,
  title,
  description,
  icon,
  imageStatus: options.imageStatus ?? (options.image ? "ready" : "awaiting-image"),
  ...options,
});

export const categories: CategoryDefinition[] = [
  {
    slug: "celulares",
    title: "Celulares",
    eyebrow: "TECNOLOGÍA PERSONAL",
    description: "Celulares para cada forma de comunicarte, trabajar y disfrutar.",
    icon: "📱",
    image: "/assets/categories/celulares.webp",
    mobileImage: "/assets/mobile/celulares.webp",
    bannerImage: "/assets/v16-final/main/celulares-multimarca.jpg",
    bannerImageStatus: "ready",
    imageStatus: "ready",
    brands: ["Apple", "Samsung", "Motorola", "Xiaomi", "Infinix", "Poco"],
    homePlacement: "primary",
    homePriority: 1,
    navigationStatus: "compatibility",
    legacyAliases: ["celulares", "telefonos", "smartphones"],
    subcategories: [
      sub("apple-iphone", "Apple / iPhone", "Ecosistema Apple y líneas premium.", "", { brand: "Apple", imageStatus: "awaiting-image" }),
      sub("samsung", "Samsung", "Familias Galaxy para distintos usos.", "S", { brand: "Samsung", imageStatus: "awaiting-image" }),
      sub("motorola", "Motorola", "Moto G y otras familias.", "M", { brand: "Motorola", imageStatus: "awaiting-image" }),
      sub("xiaomi", "Xiaomi", "Redmi y alternativas de gran variedad.", "X", { brand: "Xiaomi", imageStatus: "awaiting-image" }),
      sub("infinix", "Infinix", "Diseño y opciones para distintos presupuestos.", "I", { brand: "Infinix", imageStatus: "awaiting-image" }),
      sub("poco", "POCO", "Rendimiento y gaming para distintos presupuestos.", "P", { brand: "Poco", imageStatus: "ready" }),
    ],
  },
  {
    slug: "electrodomesticos",
    title: "Electrodomésticos",
    eyebrow: "PARA TU DÍA A DÍA",
    description: "Entrá directo al sector que necesitás: frío, lavado, cocción, clima y más.",
    icon: "🏠",
    image: "/assets/categories/electrodomesticos.webp",
    mobileImage: "/assets/mobile/electrodomesticos.webp",
    bannerImage: "/assets/v16-generated/category-electrodomesticos-ai-v1.png",
    bannerImageStatus: "ready",
    heroTagline: "Todo lo que necesitás para tu hogar, en un solo lugar.",
    imageStatus: "ready",
    brands: [],
    homePlacement: "primary",
    homePriority: 1,
    legacyAliases: ["electrodomesticos", "electro", "linea blanca"],
    subcategories: [
      sub("refrigeracion", "Refrigeración", "Heladeras, freezers, frigobares y conservación.", "❄️", { image: "/assets/v16-correcto/refrigeracion.jpg", imageStatus: "ready", legacyAliases: ["heladeras", "heladera", "freezer", "frigobar", "refrigeracion"] }),
      sub("climatizacion", "Climatización", "Ventilación, calefacción y confort para cada estación.", "🌬️", { image: "/assets/v16-correcto/climatizacion.jpg", imageStatus: "ready", legacyAliases: ["climatizacion", "ventiladores", "estufas", "aires"] }),
      sub("coccion", "Cocción", "Cocinas, hornos, anafes y soluciones para cocinar.", "🍳", { image: "/assets/banners/subcategories/electrodomesticos/coccion.webp", imageStatus: "ready", legacyAliases: ["cocinas", "hornos", "anafes", "coccion"] }),
      sub("lavado", "Lavado", "Lavarropas, secado y cuidado de la ropa.", "🫧", { image: "/assets/banners/subcategories/electrodomesticos/lavado.webp", imageStatus: "ready", legacyAliases: ["lavarropas", "lavado", "secarropas"] }),
      sub("pequenos-electrodomesticos", "Pequeños electrodomésticos", "Soluciones prácticas para cocina y uso diario.", "☕", { image: "/assets/banners/subcategories/electrodomesticos/pequenos-electrodomesticos.webp", imageStatus: "ready", legacyAliases: ["pequenos electrodomesticos", "pequeños electrodomésticos", "pava", "licuadora", "batidora"] }),
      sub("limpieza", "Limpieza", "Aspirado, vapor y cuidado de tus espacios.", "🧹", { image: "/assets/banners/subcategories/electrodomesticos/limpieza.webp", imageStatus: "ready", legacyAliases: ["limpieza", "aspiradoras", "aspiradora"] }),
    ],
  },
  {
    slug: "smart-tv",
    title: "Smart TV",
    eyebrow: "IMAGEN & ENTRETENIMIENTO",
    description: "Pantallas y conectividad para vivir cada momento.",
    icon: "📺",
    image: "/assets/categories/smart-tv.webp",
    mobileImage: "/assets/mobile/smart-tv.webp",
    bannerImage: "/assets/v16-correcto/smart-tv-landscape.jpg",
    bannerImageStatus: "ready",
    bannerFraming: "full-composition",
    imageStatus: "ready",
    brands: [],
    homePlacement: "primary",
    homePriority: 3,
    navigationStatus: "compatibility",
    legacyAliases: ["smart tv", "televisores", "televisor", "tv"],
    subcategories: [],
  },
  {
    slug: "audio",
    title: "Audio",
    eyebrow: "SONIDO",
    description: "Parlantes y equipos para que la música acompañe tus momentos.",
    icon: "🔊",
    image: "/assets/categories/audio.webp",
    mobileImage: "/assets/mobile/audio.webp",
    bannerImage: "/assets/v16-correcto/audio.jpg",
    bannerImageStatus: "ready",
    bannerFraming: "full-composition",
    imageStatus: "ready",
    brands: [],
    homePlacement: "primary",
    homePriority: 4,
    navigationStatus: "compatibility",
    legacyAliases: ["audio", "parlantes", "home theater"],
    subcategories: [
      sub("parlantes-portatiles", "Parlantes portátiles", "Música para llevar a todos lados.", "🔉"),
      sub("torres", "Torres", "Potencia y presencia para tus reuniones.", "🎚️"),
      sub("barras-de-sonido", "Barras de sonido", "Audio para TV y entretenimiento.", "▬"),
      sub("auriculares", "Auriculares", "Escucha personal y comodidad.", "🎧", { navigationStatus: "planned" }),
      sub("home-audio", "Home audio", "Equipos para disfrutar en casa.", "🎵", { navigationStatus: "planned" }),
    ],
  },
  {
    slug: "herramientas",
    title: "Herramientas",
    eyebrow: "TRABAJO & PROYECTOS",
    description: "Herramientas para reparar, construir y llevar tus proyectos más lejos.",
    icon: "🛠️",
    image: "/assets/banners/categories/herramientas-premium-clean.webp",
    bannerImage: "/assets/banners/categories/herramientas-premium-clean.webp",
    bannerImageStatus: "ready",
    heroTagline: "Potencia, precisión y trabajo diario.",
    imageStatus: "ready",
    brands: [],
    homePlacement: "primary",
    homePriority: 2,
    legacyAliases: ["herramientas", "herramienta", "ferreteria", "taladro", "taladros", "amoladora", "amoladoras"],
    subcategories: [
      sub("taladros", "Taladros", "Percutores, atornilladores, mechas y soluciones a batería.", "🛠️", { image: "/assets/banners/subcategories/herramientas/taladros.webp", imageStatus: "ready", legacyAliases: ["taladro", "taladros", "atornillador", "atornilladores", "percutor"] }),
      sub("amoladoras", "Amoladoras", "Corte, desbaste y terminación para trabajo profesional y diario.", "⚙️", { image: "/assets/banners/subcategories/herramientas/amoladoras.webp", imageStatus: "ready", legacyAliases: ["amoladora", "amoladoras", "disco de corte"] }),
      sub("sierras", "Sierras", "Caladoras, circulares y soluciones de corte para cada proyecto.", "🪚", { image: "/assets/banners/subcategories/herramientas/sierras.webp", imageStatus: "ready", legacyAliases: ["sierra", "sierras", "caladora", "circular"] }),
    ],
  },
  {
    slug: "gaming",
    title: "Gaming",
    eyebrow: "ENTRETENIMIENTO",
    description: "Consolas, juegos y accesorios organizados para entrar directo a lo que buscás.",
    icon: "🎮",
    image: "/assets/v16-generated/gaming-sector-brandless-v1.webp",
    mobileImage: "/assets/v16-generated/gaming-sector-brandless-v1.webp",
    bannerImage: "/assets/v16-generated/gaming-sector-brandless-v1.webp",
    bannerImageStatus: "ready",
    bannerFraming: "full-composition",
    heroTagline: "Consolas y experiencias organizadas para entrar directo a lo que buscás.",
    imageStatus: "ready",
    brands: ["PlayStation", "Sony"],
    homePlacement: "primary",
    homePriority: 10,
    legacyAliases: ["gaming", "playstation", "juegos", "consolas"],
    subcategories: [
      sub("playstation", "PlayStation", "Consolas PlayStation y ecosistema Sony.", "△", { brand: "PlayStation", imageStatus: "ready", legacyAliases: ["playstation", "ps4", "ps5"] }),
      sub("xbox", "Xbox", "Sector preparado para consolas y ecosistema Xbox cuando se active.", "X", { navigationStatus: "planned", legacyAliases: ["xbox"] }),
      sub("nintendo", "Nintendo", "Sector preparado para consolas y ecosistema Nintendo cuando se active.", "N", { navigationStatus: "planned", legacyAliases: ["nintendo", "switch"] }),
      sub("accesorios-gamer", "Accesorios gamer", "Sector preparado para periféricos y complementos gamer cuando se active.", "⚡", { navigationStatus: "planned", legacyAliases: ["accesorios gamer", "gaming accesorios"] }),
      sub("juegos", "Juegos", "Ruta heredada conservada para no romper enlaces o clasificación previa.", "💿", { navigationStatus: "compatibility", legacyAliases: ["juegos", "games"] }),
      sub("joysticks", "Joysticks", "Ruta heredada conservada para no romper enlaces o clasificación previa.", "🎮", { navigationStatus: "compatibility", legacyAliases: ["joystick", "joysticks", "controles"] }),
    ],
  },
  {
    slug: "hogar",
    title: "Hogar",
    eyebrow: "CASA & ESTILO",
    description: "Organización, mesa, textiles y detalles para hacer más tuyo cada ambiente.",
    icon: "🛋️",
    image: "/assets/categories/hogar.webp",
    mobileImage: "/assets/mobile/hogar.webp",
    bannerImage: "/assets/v16-correcto/hogar.jpg",
    bannerImageStatus: "ready",
    bannerFraming: "full-composition",
    heroTagline: "Ambientes que se sienten propios, con una navegación simple y cálida.",
    imageStatus: "ready",
    brands: [],
    homePlacement: "primary",
    homePriority: 4,
    legacyAliases: ["hogar", "deco", "bazar", "blanqueria"],
    subcategories: [
      sub("hogar-y-deco", "Hogar y deco", "Muebles, organización y detalles para tus ambientes.", "🪴", { legacyAliases: ["hogar y deco", "deco", "muebles", "cortinas"] }),
      sub("bazar-y-mesa", "Bazar y mesa", "Cocina, vajilla y todo para compartir la mesa.", "🍽️", { legacyAliases: ["bazar", "mesa", "vajilla"] }),
      sub("blanqueria", "Blanquería", "Textiles, abrigo y detalles para cada espacio.", "🛏️", { legacyAliases: ["blanqueria", "blanquería", "sabanas", "toallas"] }),
    ],
  },
  {
    slug: "tecnologia-accesorios",
    title: "Tecnología & Accesorios",
    eyebrow: "CONECTÁ TODO",
    description: "Accesorios prácticos para acompañar tus equipos y dispositivos.",
    icon: "🔌",
    image: "/assets/banners/categories/tecnologia-accesorios-premium-clean.webp",
    bannerImage: "/assets/banners/categories/tecnologia-accesorios-premium-clean.webp",
    bannerImageStatus: "ready",
    bannerFraming: "full-composition",
    heroTagline: "Conectividad y accesorios ordenados para encontrar lo esencial sin vueltas.",
    imageStatus: "ready",
    brands: [],
    homePlacement: "primary",
    homePriority: 3,
    legacyAliases: ["tecnologia", "accesorios", "cargador", "cargadores"],
    subcategories: [
      sub("cargadores-y-accesorios", "Cargadores y accesorios", "Cables, cargadores y complementos para tus dispositivos.", "🔋", { legacyAliases: ["cargador", "cargadores", "cable", "cables", "accesorios celulares"] }),
    ],
  },
  {
    slug: "descanso",
    title: "Descanso",
    eyebrow: "CONFORT",
    description: "Todo para descansar mejor y renovar tu habitación.",
    icon: "🛏️",
    image: "/assets/banners/categories/descanso-premium-clean.webp",
    bannerImage: "/assets/banners/categories/descanso-premium-clean.webp",
    bannerImageStatus: "ready",
    bannerFraming: "full-composition",
    heroTagline: "Confort para renovar tu espacio y elegir con tranquilidad.",
    imageStatus: "ready",
    brands: [],
    homePlacement: "more",
    homePriority: 5,
    legacyAliases: ["descanso", "colchones", "sommiers"],
    subcategories: [
      sub("colchones-y-sommiers", "Colchones y sommiers", "Opciones de descanso, soporte y confort.", "🌙", { legacyAliases: ["colchones", "sommiers", "sommier", "camas"] }),
    ],
  },
  {
    slug: "cuidado-personal-salud",
    title: "Cuidado personal & Salud",
    eyebrow: "BIENESTAR",
    description: "Productos para bienestar, cuidado diario y salud personal.",
    icon: "💙",
    heroTagline: "Bienestar y cuidado diario en una experiencia clara y serena.",
    imageStatus: "awaiting-image",
    brands: [],
    homePlacement: "more",
    homePriority: 6,
    legacyAliases: ["cuidado personal", "salud", "belleza"],
    subcategories: [],
  },
  {
    slug: "bebes-juguetes",
    title: "Bebés & Juguetes",
    eyebrow: "FAMILIA & DIVERSIÓN",
    description: "Opciones para acompañar cada etapa y sumar momentos de juego.",
    icon: "🧸",
    heroTagline: "Soluciones para acompañar a la familia con calidez y confianza.",
    imageStatus: "awaiting-image",
    brands: [],
    homePlacement: "more",
    homePriority: 7,
    legacyAliases: ["bebes", "bebés", "juguetes"],
    subcategories: [
      sub("bebes", "Bebés", "Productos pensados para los más chicos y sus familias.", "🍼", { legacyAliases: ["bebes", "bebés"] }),
      sub("juguetes", "Juguetes", "Diversión, movimiento y aprendizaje.", "🪁", { legacyAliases: ["juguetes", "infantil"] }),
    ],
  },
  {
    slug: "auto-motos-energia",
    title: "Auto, Motos & Energía",
    eyebrow: "MOVILIDAD & RESPALDO",
    description: "Accesorios para movilidad y soluciones de energía para distintos usos.",
    icon: "🚗",
    heroTagline: "Movilidad, respaldo y energía organizados para cada necesidad.",
    imageStatus: "awaiting-image",
    brands: [],
    homePlacement: "more",
    homePriority: 8,
    legacyAliases: ["auto", "motos", "energia", "baterias"],
    subcategories: [
      sub("auto-y-motos", "Auto y motos", "Accesorios y soluciones para movilidad.", "🏍️", { legacyAliases: ["auto", "autos", "motos", "automotor"] }),
      sub("energia", "Energía", "Baterías, cargadores y respaldo energético.", "🔋", { legacyAliases: ["energia", "energía", "baterias", "cargador bateria"] }),
    ],
  },
  {
    slug: "camping-aire-libre-mascotas",
    title: "Camping, Aire libre & Mascotas",
    eyebrow: "AFUERA & COMPAÑÍA",
    description: "Opciones para disfrutar afuera de casa y cuidar a quienes te acompañan.",
    icon: "⛺",
    heroTagline: "Aire libre, compañía y soluciones para disfrutar cada salida.",
    imageStatus: "awaiting-image",
    brands: [],
    homePlacement: "more",
    homePriority: 9,
    legacyAliases: ["camping", "aire libre", "mascotas"],
    subcategories: [
      sub("camping-y-aire-libre", "Camping y aire libre", "Equipo y accesorios para disfrutar afuera.", "🏕️", { legacyAliases: ["camping", "aire libre", "exterior"] }),
      sub("mascotas", "Mascotas", "Productos para cuidado, comodidad y juego.", "🐾", { legacyAliases: ["mascotas", "pet"] }),
    ],
  },
  {
    slug: "otros",
    title: "Más categorías",
    eyebrow: "MÁS CATEGORÍAS",
    description: "Un espacio de respaldo para encontrar lo que todavía no tiene sector propio.",
    icon: "✦",
    heroTagline: "Una exploración guiada para encontrar productos sin recorrer listas interminables.",
    imageStatus: "awaiting-image",
    brands: [],
    homePlacement: "fallback",
    homePriority: 99,
    isFallback: true,
    legacyAliases: ["otros", "varios", "sin categoria"],
    subcategories: [],
  },
];

export const activeCategories = categories
  .filter((category) => category.navigationStatus !== "compatibility");

export const compatibilityCategories = categories
  .filter((category) => category.navigationStatus === "compatibility");

export const navigationCategories = activeCategories
  .slice()
  .sort((a, b) => a.homePriority - b.homePriority);

export const primaryCategories = activeCategories
  .filter((category) => category.homePlacement === "primary")
  .sort((a, b) => a.homePriority - b.homePriority);

export const moreCategories = activeCategories
  .filter((category) => category.homePlacement === "more")
  .sort((a, b) => a.homePriority - b.homePriority);

export const fallbackCategory = activeCategories.find((category) => category.homePlacement === "fallback") ?? null;

export function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug);
}

export function getActiveSubcategories(category: CategoryDefinition) {
  return category.subcategories.filter((subcategory) => (subcategory.navigationStatus ?? "active") === "active");
}

export function getPlannedSubcategories(category: CategoryDefinition) {
  return category.subcategories.filter((subcategory) => subcategory.navigationStatus === "planned");
}

export function getCompatibilitySubcategories(category: CategoryDefinition) {
  return category.subcategories.filter((subcategory) => subcategory.navigationStatus === "compatibility");
}

export function getSubcategory(categorySlug: string, subcategorySlug: string) {
  return getCategory(categorySlug)?.subcategories.find(
    (subcategory) => subcategory.slug === subcategorySlug && subcategory.navigationStatus !== "planned",
  );
}

export function getBannerSlots() {
  return activeCategories.flatMap((category) => [
    {
      id: `category:${category.slug}`,
      categorySlug: category.slug,
      subcategorySlug: null,
      label: category.title,
      imageStatus: category.imageStatus,
      image: category.image ?? null,
    },
    ...getActiveSubcategories(category).map((subcategory) => ({
      id: `subcategory:${category.slug}:${subcategory.slug}`,
      categorySlug: category.slug,
      subcategorySlug: subcategory.slug,
      label: `${category.title} / ${subcategory.title}`,
      imageStatus: subcategory.imageStatus,
      image: subcategory.image ?? null,
    })),
  ]);
}
