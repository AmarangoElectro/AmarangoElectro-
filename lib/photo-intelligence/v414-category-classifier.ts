import type { V414SuggestionProvenance } from "./v414-types";

export const V414_COMMERCIAL_CATEGORIES = Object.freeze([
  "Celulares",
  "Smart TV",
  "Audio",
  "Refrigeración",
  "Cocción",
  "Climatización",
  "Lavado",
  "Pequeños electrodomésticos",
  "Limpieza",
  "Colchones y sommiers",
  "Blanquería",
  "Muebles",
  "Hogar y decoración",
  "Deporte y movilidad",
  "Informática",
  "Cargadores y accesorios",
  "Cuidado personal y salud",
  "Bebés",
  "Accesorios para auto y motos",
  "Mascotas",
  "Gaming",
  "Otros",
] as const);

const RULES: ReadonlyArray<{ category: typeof V414_COMMERCIAL_CATEGORIES[number]; terms: readonly string[] }> = [
  { category: "Celulares", terms: ["iphone", "samsung a", "moto g", "redmi", "xiaomi", "infinix", "smartphone", "celular"] },
  { category: "Smart TV", terms: ["smart tv", "televisor", "tv "] },
  { category: "Audio", terms: ["parlante", "auricular", "barra de sonido", "audio", "woofer"] },
  { category: "Refrigeración", terms: ["heladera", "freezer", "frigobar"] },
  { category: "Cocción", terms: ["cocina", "horno", "anafe"] },
  { category: "Climatización", terms: ["aire acondicionado", "ventilador", "calefactor"] },
  { category: "Lavado", terms: ["lavarropas", "secadora", "lavavajillas"] },
  { category: "Pequeños electrodomésticos", terms: ["licuadora", "cafetera", "tostadora", "pava eléctrica"] },
  { category: "Limpieza", terms: ["aspiradora", "hidrolavadora", "limpieza"] },
  { category: "Colchones y sommiers", terms: ["colchón", "sommier"] },
  { category: "Blanquería", terms: ["sábana", "toalla", "acolchado", "blanquería"] },
  { category: "Muebles", terms: ["mesa", "silla", "placard", "mueble"] },
  { category: "Hogar y decoración", terms: ["cortina", "decoración", "hogar"] },
  { category: "Deporte y movilidad", terms: ["bicicleta", "monopatín", "deporte"] },
  { category: "Informática", terms: ["notebook", "monitor", "computadora", "impresora"] },
  { category: "Cargadores y accesorios", terms: ["cargador", "cable usb", "power bank", "funda"] },
  { category: "Cuidado personal y salud", terms: ["afeitadora", "secador de pelo", "balanza", "salud"] },
  { category: "Bebés", terms: ["bebé", "cochecito", "mamadera"] },
  { category: "Accesorios para auto y motos", terms: ["auto", "moto", "casco", "estéreo"] },
  { category: "Mascotas", terms: ["mascota", "perro", "gato"] },
  { category: "Gaming", terms: ["playstation", "xbox", "nintendo", "gaming", "gamer", "joystick"] },
];

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
}

export function classifyV414Category(
  text: string,
  existingCategory?: string | null,
): { category: typeof V414_COMMERCIAL_CATEGORIES[number]; confidence: number; provenance: V414SuggestionProvenance; matchedTerms: string[] } {
  if (existingCategory) {
    const canonical = V414_COMMERCIAL_CATEGORIES.find((category) => normalize(category) === normalize(existingCategory));
    if (canonical) return { category: canonical, confidence: 0.99, provenance: "matched_existing_data", matchedTerms: [existingCategory] };
  }
  const normalized = ` ${normalize(text)} `;
  const scored = RULES.map((rule) => ({
    rule,
    matches: rule.terms.filter((term) => normalized.includes(normalize(term))),
  })).filter((candidate) => candidate.matches.length).sort((a, b) => b.matches.length - a.matches.length);
  const best = scored[0];
  if (!best) return { category: "Otros", confidence: 0.25, provenance: "unknown", matchedTerms: [] };
  return {
    category: best.rule.category,
    confidence: Math.min(0.95, 0.72 + best.matches.length * 0.08),
    provenance: "matched_existing_data",
    matchedTerms: [...best.matches],
  };
}
