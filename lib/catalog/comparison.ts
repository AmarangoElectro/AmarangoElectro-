import type { Product } from "./types";

export interface ComparisonRow {
  id: string;
  label: string;
  values: string[];
  differs: boolean;
}

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

function text(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized || "A confirmar";
}

function uniqueFeatures(product: Product) {
  return [...new Set(product.features.map((feature) => feature.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es")).join(" · ") || "A confirmar";
}

function createRow(id: string, label: string, values: string[]): ComparisonRow {
  const normalized = values.map((value) => value.trim().toLocaleLowerCase("es-AR"));
  return { id, label, values, differs: new Set(normalized).size > 1 };
}

export function buildComparisonRows(products: readonly Product[]): ComparisonRow[] {
  if (products.length < 2) return [];

  const baseRows = [
    createRow("brand", "Marca", products.map((product) => text(product.brand))),
    createRow("model", "Modelo", products.map((product) => text(product.model))),
    createRow("price", "Precio", products.map((product) => product.price ? money.format(product.price.amount) : "A confirmar")),
    createRow("availability", "Disponibilidad", products.map((product) => text(product.stock.label))),
    createRow("warranty", "Garantía", products.map((product) => text(product.warranty))),
    createRow("features", "Características clave", products.map(uniqueFeatures)),
  ];

  const specificationKeys = [...new Set(products.flatMap((product) => Object.keys(product.specifications)))].sort((a, b) => a.localeCompare(b, "es"));
  const specificationRows = specificationKeys.map((key) =>
    createRow(`spec:${key}`, key, products.map((product) => text(product.specifications[key]))),
  );

  return [...baseRows, ...specificationRows];
}
