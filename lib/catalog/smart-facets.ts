import type { Product } from "./types";

type FacetProduct = Pick<Product, "name" | "brand" | "model" | "specifications">;

export type FacetKey = "measure" | "storage" | "capacity" | "kind" | "liters" | "burners" | "size" | "brand";
export type FacetSelection = Partial<Record<FacetKey, string>>;
export type FacetGroup = { key: FacetKey; label: string; options: string[] };

const tvSizes = [32, 40, 43, 50, 55, 58, 60, 65, 70, 75, 85];
const storageSizes = ["64 GB", "128 GB", "256 GB", "512 GB", "1 TB", "2 TB"];
const washingSizes = ["6 kg", "7 kg", "8 kg", "9 kg", "10 kg", "11 kg+"];
const mattressSizes = ["1 plaza", "1 plaza y media", "2 plazas", "Queen", "King"];

const normalize = (text: string) => text.toLocaleLowerCase("es-AR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const identity = (product: FacetProduct) => normalize([product.name, product.model ?? ""].join(" "));
const details = (product: FacetProduct) => normalize([product.name, product.model ?? "", ...Object.values(product.specifications)].join(" "));

export function getFacetScope(category: string, sector?: string | null): string {
  if (sector === "lavado" || sector === "refrigeracion" || sector === "climatizacion" || sector === "coccion" || sector === "colchones-y-sommiers") return sector;
  return category;
}

export function productFacetValues(product: FacetProduct, scope: string, key: FacetKey): string[] {
  if (key === "brand") return product.brand ? [product.brand] : [];
  const name = identity(product);
  const full = details(product);
  if ((scope === "smart-tv" || scope === "climatizacion") && key === "measure") {
    if (scope === "climatizacion") {
      if (!/\bventilador|\bturbo\b/.test(name)) return [];
      const fan = full.match(/\b(\d{2})\s*(?:["″”]|pulgadas?)/);
      return fan && Number(fan[1]) >= 12 && Number(fan[1]) <= 30 ? [`${fan[1]}″`] : [];
    }
    const match = full.match(/(?:^|[^\d])(\d{2})\s*(?:["″”]|pulgadas?|inch(?:es)?)/i)
      ?? name.match(/\b(?:smart\s*(?:tv)?|tv|televisor)\b.{0,28}?\b(32|40|43|50|55|58|60|65|70|75|85)\b/)
      ?? name.match(/\b(32|40|43|50|55|58|60|65|70|75|85)\b\s*(?:android|qled|google|led|roku)\b/);
    if (match && tvSizes.includes(Number(match[1]))) return [`${match[1]}″`];
    return [];
  }
  if (scope === "celulares" && key === "storage") {
    const found = new Set<string>();
    // Supplier titles often use storage/RAM (for example 256/12gb).
    // The RAM suffix can itself end in GB, so a boundary after its digits would miss it.
    for (const match of full.matchAll(/(?:^|\D)(64|128|256|512)\s*(?:gb\b|g\b|\/\s*\d{1,2}(?:\s*(?:gb|g|ram))?\b)|(?:^|\D)(1|2)\s*tb\b/gi)) {
      const value = match[1] ? `${match[1]} GB` : `${match[2]} TB`;
      if (storageSizes.includes(value)) found.add(value);
    }
    return [...found];
  }
  if (scope === "lavado") {
    if (key === "capacity") {
      const match = full.match(/\b(\d{1,2}(?:[.,]\d)?)\s*k(?:g|ilos?)\b/);
      const kg = match ? Number(match[1].replace(",", ".")) : 0;
      return kg >= 4 && kg <= 25 ? [`${String(kg).replace(".", ",")} kg`] : [];
    }
    if (key === "kind") {
      const options = [["Semiautomático", /\bsemi\s*automatic/], ["Automático", /\bautomatic/], ["Carga frontal", /\bcarga frontal\b|\bfrontal\b/], ["Carga superior", /\bcarga superior\b|\bsuperior\b/]] as const;
      return options.filter(([, regex]) => regex.test(full)).map(([label]) => label);
    }
  }
  if (scope === "refrigeracion") {
    if (key === "kind") {
      const options = [["Freezer", /\bfreezer|\bcongelador/], ["Frigobar", /\bfrigobar|\bmini\s*bar/], ["Bajo mesada", /\bbajo mesada/], ["Heladera", /\bheladera|\brefrigerador/]] as const;
      return options.filter(([, regex]) => regex.test(name)).map(([label]) => label);
    }
    if (key === "liters") {
      const match = full.match(/\b(\d{2,4})\s*(?:l|lts?|ltrs?|litros?)\b/);
      return match && Number(match[1]) >= 40 && Number(match[1]) <= 800 ? [`${match[1]} L`] : [];
    }
  }
  if (scope === "colchones-y-sommiers" || scope === "descanso") {
    if (key === "size") {
      if (/\b1\s*plaza\s*(?:y\s*media|1\/2|½)/.test(full)) return ["1 plaza y media"];
      const options = [["1 plaza", /\b1\s*plaza\b/], ["2 plazas", /\b2\s*plazas?\b/], ["Queen", /\bqueen\b/], ["King", /\bking\b/]] as const;
      return options.filter(([, regex]) => regex.test(full)).map(([label]) => label);
    }
    if (key === "kind") return [["Sommier", /\bsommiers?\b/], ["Colchón", /\bcolchon(?:es)?\b/]].filter(([, regex]) => (regex as RegExp).test(name)).map(([label]) => label as string);
  }
  if (scope === "audio" && key === "kind") {
    const options = [["Karaoke", /\bkaraoke\b/], ["Party speaker", /\bparty\b|\bfiesta\b/], ["Torre", /\btorre\b/], ["Portátil", /\bportatil\b/], ["Barra de sonido", /\bbarra de sonido\b/]] as const;
    return options.filter(([, regex]) => regex.test(name)).map(([label]) => label);
  }
  if (scope === "climatizacion" && key === "kind") {
    const options = [["Turbo", /\bturbo\b/], ["De pie", /\bde pie\b|\bventilador de pie\b/], ["Ventilador", /\bventilador\b/], ["Aire acondicionado", /\baire acondicionado\b|\bsplit\b/], ["Calefacción", /\bcalefactor|\bestufa|\bcaloventor/]] as const;
    return options.filter(([, regex]) => regex.test(name)).map(([label]) => label);
  }
  if (scope === "coccion" && key === "kind") {
    const options = [["Anafe", /\banafe\b/], ["Horno", /\bhorno\b/], ["Microondas", /\bmicroondas\b/], ["Freidora", /\bfreidora\b/], ["Cocina", /\bcocina\b/]] as const;
    return options.filter(([, regex]) => regex.test(name)).map(([label]) => label);
  }
  if (scope === "coccion" && key === "liters") {
    const match = full.match(/\b(\d{1,3})\s*(?:l|lts?|ltrs?|litros?)\b/);
    return match && Number(match[1]) >= 5 && Number(match[1]) <= 150 ? [`${match[1]} L`] : [];
  }
  if (scope === "coccion" && key === "burners") {
    const match = full.match(/\b([2-8])\s*(?:hornallas?|quemadores?)\b/);
    return match ? [`${match[1]} hornallas`] : [];
  }
  return [];
}

export function deriveFacetGroups(products: readonly FacetProduct[], scope: string, includeSingleValues = false): FacetGroup[] {
  const config: Partial<Record<string, Array<[FacetKey, string]>>> = {
    "smart-tv": [["measure", "Pulgadas"]], celulares: [["storage", "Almacenamiento"]],
    lavado: [["capacity", "Capacidad"], ["kind", "Tipo"]],
    refrigeracion: [["kind", "Tipo"], ["liters", "Litros"]],
    "colchones-y-sommiers": [["size", "Tamaño"], ["kind", "Tipo"]],
    descanso: [["size", "Tamaño"], ["kind", "Tipo"]],
    audio: [["kind", "Tipo"]], climatizacion: [["kind", "Tipo"], ["measure", "Pulgadas"]], coccion: [["kind", "Tipo"], ["liters", "Capacidad"], ["burners", "Hornallas"]],
  };
  const keys = [...(config[scope] ?? []), ["brand", "Marca"] as [FacetKey, string]];
  return keys.map(([key, label]) => {
    const present = new Set(products.flatMap((product) => productFacetValues(product, scope, key)));
    const order = scope === "smart-tv" && key === "measure" ? tvSizes.map((n) => `${n}″`) : key === "storage" ? storageSizes : key === "size" ? mattressSizes : [];
    return { key, label, options: [...present].sort((a, b) => key === "capacity" || key === "liters" || key === "burners" || key === "measure" && scope === "climatizacion" ? Number.parseFloat(a.replace(",", ".")) - Number.parseFloat(b.replace(",", ".")) : order.length ? order.indexOf(a) - order.indexOf(b) : a.localeCompare(b, "es")) };
  }).filter((group) => group.options.length > 1 || group.options.length === 1 && (includeSingleValues || products.some((product) => !productFacetValues(product, scope, group.key).includes(group.options[0]))));
}

export function matchesFacets(product: FacetProduct, scope: string, selected: FacetSelection, except?: FacetKey): boolean {
  return Object.entries(selected).every(([key, value]) => !value || key === except || matchesFacetValue(product, scope, key as FacetKey, value));
}

const laundryRanges = [
  { label: "Menos de 6 kg", min: 0, max: 6 },
  { label: "6–7 kg", min: 6, max: 8 },
  { label: "8–9 kg", min: 8, max: 10 },
  { label: "10–11 kg", min: 10, max: 12 },
  { label: "12 kg+", min: 12, max: Infinity },
];

export function matchesFacetValue(product: FacetProduct, scope: string, key: FacetKey, value: string): boolean {
  const values = productFacetValues(product, scope, key);
  const range = scope === "lavado" && key === "capacity" ? laundryRanges.find(item => item.label === value) : undefined;
  return range ? values.some(item => {
    const kg = Number.parseFloat(item.replace(",", "."));
    return kg >= range.min && kg < range.max;
  }) : values.includes(value);
}

/** Only offer groups with real products; decimal capacity remains intact in the data. */
export function deriveQuickFacetGroups(products: readonly FacetProduct[], scope: string): FacetGroup[] {
  return deriveFacetGroups(products, scope, true).filter(group => group.key !== "brand").map(group => {
    if (scope !== "lavado" || group.key !== "capacity") return group;
    return { ...group, options: laundryRanges.filter(range => products.some(product => matchesFacetValue(product, scope, "capacity", range.label))).map(range => range.label) };
  });
}

export function dominantFacetNumber(product: FacetProduct, scope: string): number {
  const key: FacetKey = scope === "celulares" ? "storage" : scope === "smart-tv" ? "measure" : scope === "lavado" ? "capacity" : "liters";
  const values = productFacetValues(product, scope, key).map(value => Number.parseFloat(value.replace(",", ".")) * (/TB/.test(value) ? 1024 : 1));
  return values.length ? Math.min(...values) : Infinity;
}
