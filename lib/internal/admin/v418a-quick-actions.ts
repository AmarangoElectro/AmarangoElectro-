import { categories, getActiveSubcategories } from "../../catalog/categories";

export const V418A_AVAILABILITY = ["available", "check_availability", "unavailable", "paused"] as const;
export type V418AAvailability = typeof V418A_AVAILABILITY[number];
export type V418AAction = "price" | "availability" | "photo" | "taxonomy" | "visibility" | "full-sheet";

export interface V418AProductSnapshot {
  id: string;
  name: string;
  price: number | null;
  availability: V418AAvailability;
  imageLabel: string;
  categorySlug: string;
  subcategorySlug: string;
  visible: boolean;
}

export interface V418ADraft extends V418AProductSnapshot { imageFile: File | null; }
export interface V418ADiffRow {
  field: "price" | "availability" | "photo" | "category" | "subcategory" | "visibility";
  label: string;
  before: string;
  after: string;
}

export const v418aActions = Object.freeze([
  { id: "price" as const, label: "Editar precio", icon: "💲" },
  { id: "availability" as const, label: "Disponibilidad", icon: "📦" },
  { id: "photo" as const, label: "Cambiar foto", icon: "📷" },
  { id: "taxonomy" as const, label: "Categoría / subcategoría", icon: "🗂️" },
  { id: "visibility" as const, label: "Ocultar / mostrar", icon: "👁️" },
  { id: "full-sheet" as const, label: "Abrir ficha completa", icon: "↗" },
]);

const availabilityLabels: Record<V418AAvailability, string> = {
  available: "Disponible",
  check_availability: "Consultar disponibilidad",
  unavailable: "No disponible",
  paused: "Pausado",
};

function taxonomyLabel(categorySlug: string, subcategorySlug: string): string {
  const category = categories.find((entry) => entry.slug === categorySlug);
  if (!category) return "No autorizada";
  if (!subcategorySlug) return category.title;
  return getActiveSubcategories(category).find((entry) => entry.slug === subcategorySlug)?.title ?? "No autorizada";
}

export function inferAuthorizedTaxonomy(label: string | null): Pick<V418AProductSnapshot, "categorySlug" | "subcategorySlug"> {
  const normalized = (label ?? "").trim().toLocaleLowerCase("es");
  for (const category of categories) {
    if (category.title.toLocaleLowerCase("es") === normalized) return { categorySlug: category.slug, subcategorySlug: "" };
    const subcategory = getActiveSubcategories(category).find((entry) => entry.title.toLocaleLowerCase("es") === normalized);
    if (subcategory) return { categorySlug: category.slug, subcategorySlug: subcategory.slug };
  }
  return { categorySlug: "otros", subcategorySlug: "" };
}

export function createV418ADraft(snapshot: V418AProductSnapshot): V418ADraft {
  return { ...snapshot, imageFile: null };
}

export function validateV418ADraft(draft: V418ADraft): readonly string[] {
  const errors: string[] = [];
  if (draft.price === null || !Number.isFinite(draft.price) || draft.price <= 0) errors.push("El precio debe ser un número mayor que cero.");
  if (!V418A_AVAILABILITY.includes(draft.availability)) errors.push("La disponibilidad no pertenece al contrato autorizado.");
  const category = categories.find((entry) => entry.slug === draft.categorySlug);
  if (!category) errors.push("La categoría no pertenece a la taxonomía autorizada.");
  if (category && draft.subcategorySlug && !getActiveSubcategories(category).some((entry) => entry.slug === draft.subcategorySlug)) errors.push("La subcategoría no pertenece a la categoría autorizada.");
  return Object.freeze(errors);
}

const money = (value: number | null) => value === null ? "Sin precio" : `$${Math.round(value).toLocaleString("es-AR")}`;

export function buildV418ADiff(before: V418AProductSnapshot, after: V418ADraft): readonly V418ADiffRow[] {
  const rows: V418ADiffRow[] = [];
  const add = (field: V418ADiffRow["field"], label: string, previous: string, next: string) => {
    if (previous !== next) rows.push({ field, label, before: previous, after: next });
  };
  add("price", "Precio", money(before.price), money(after.price));
  add("availability", "Disponibilidad", availabilityLabels[before.availability], availabilityLabels[after.availability]);
  add("photo", "Foto", before.imageLabel || "Sin foto", after.imageFile?.name ?? (after.imageLabel || "Sin foto"));
  add("category", "Categoría", taxonomyLabel(before.categorySlug, ""), taxonomyLabel(after.categorySlug, ""));
  add("subcategory", "Subcategoría", taxonomyLabel(before.categorySlug, before.subcategorySlug), taxonomyLabel(after.categorySlug, after.subcategorySlug));
  add("visibility", "Visibilidad", before.visible ? "Visible" : "Oculto", after.visible ? "Visible" : "Oculto");
  return Object.freeze(rows);
}

export const v418aWriteGate = Object.freeze({
  mode: "SIMULADO_BLOQUEADO",
  productionWritesEnabled: false,
  canonicalCatalogWritesEnabled: false,
  storageUploadsEnabled: false,
  persistenceEnabled: false,
  fullProductSheetImplemented: false,
});
