import type { SubcategoryDefinition } from "@/lib/catalog/categories";

const brand = (slug: string, title: string, description: string, icon: string): SubcategoryDefinition => ({
  slug,
  title,
  description,
  icon,
  brand: title,
  imageStatus: "ready",
});

/** Capa aditiva de campañas V16. No modifica el catálogo maestro ni sus productos. */
export const v16BrandCampaignsByCategory: Readonly<Record<string, readonly SubcategoryDefinition[]>> = Object.freeze({
  electrodomesticos: Object.freeze([
    brand("kanjihome", "Kanjihome", "Electrodomésticos para equipar cada ambiente.", "K"),
    brand("kanji", "Kanji", "Tecnología práctica para el hogar.", "K"),
    brand("philco", "Philco", "Innovación para cada momento.", "P"),
    brand("bgh", "BGH", "Confort y tecnología para tu casa.", "B"),
    brand("ken-brown", "Ken Brown", "Tecnología para tu casa.", "KB"),
    brand("delhi", "Delhi", "Pequeños aliados para tu cocina.", "D"),
    brand("oster", "Oster", "Rendimiento y practicidad en casa.", "O"),
    brand("ultracomb", "Ultracomb", "Soluciones para el hogar y tu rutina.", "U"),
    brand("telefunken", "Telefunken", "Tecnología para tu hogar.", "T"),
  ]),
  "smart-tv": Object.freeze([
    brand("telefunken", "Telefunken", "Imagen, sonido y hogar conectado.", "T"),
    brand("kanji", "Kanji", "Pantallas y entretenimiento para cada espacio.", "K"),
    brand("philco", "Philco", "Imagen e innovación para el hogar.", "P"),
    brand("bgh", "BGH", "Tecnología y confort conectados.", "B"),
    brand("ken-brown", "Ken Brown", "Pantallas y tecnología para tu casa.", "KB"),
    brand("rca", "RCA", "Imagen y entretenimiento en grande.", "R"),
    brand("jvc", "JVC", "Pantallas y sonido para disfrutar.", "J"),
    brand("tcl", "TCL", "Innovación para ver más.", "T"),
    brand("noblex", "Noblex", "Entretenimiento que acompaña.", "N"),
  ]),
  "tecnologia-accesorios": Object.freeze([
    brand("hp", "HP", "Productividad y tecnología diaria.", "HP"),
    brand("epson", "Epson", "Impresión confiable para todos los días.", "E"),
  ]),
});

export function getV16BrandCampaigns(categorySlug: string): readonly SubcategoryDefinition[] {
  return v16BrandCampaignsByCategory[categorySlug] ?? [];
}
