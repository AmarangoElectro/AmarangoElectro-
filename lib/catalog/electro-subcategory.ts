export type ElectroSubcategory =
  | "refrigeracion"
  | "climatizacion"
  | "coccion"
  | "lavado"
  | "pequenos-electrodomesticos"
  | "limpieza";

function normalize(value: string) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-AR");
}

/**
 * Conservative router for electro products.
 * Returns null when the name is not strong enough to classify safely.
 * It never rewrites source data and never invents a category.
 */
export function inferElectroSubcategory(name: string): ElectroSubcategory | null {
  const value = normalize(name);

  if (/(heladera|freezer|frigobar|minibar|exhibidora|cava|conservador.*frio)/.test(value)) {
    return "refrigeracion";
  }
  if (/(lavarrop|lavasecarrop|secarrop)/.test(value)) {
    return "lavado";
  }
  if (/(aire ac|aire acondicionado|ventilador|caloventor|estufa|calefactor|convector|radiador|climatizador)/.test(value)) {
    return "climatizacion";
  }
  if (/(aspiradora|hidrolavadora|lavadora a presion|sopla aspiradora|limpiador a vapor|mopa electr)/.test(value)) {
    return "limpieza";
  }
  if (/(^|\s)(cocina|horno|anafe|microondas)(\s|$)/.test(value)) {
    return "coccion";
  }
  if (/(cafetera|licuadora|batidora|mixer|freidora|pava electr|sandwichera|tostadora|exprimidor|multiprocesadora|procesadora|hamburguesera|parrilla electr|maquina pan|panificadora|plancha a vapor|rallador)/.test(value)) {
    return "pequenos-electrodomesticos";
  }

  return null;
}

export const electroSubcategoryContract = Object.freeze({
  failClosed: true,
  sourceWrite: false,
  supported: Object.freeze([
    "refrigeracion",
    "climatizacion",
    "coccion",
    "lavado",
    "pequenos-electrodomesticos",
    "limpieza",
  ] as const),
});
