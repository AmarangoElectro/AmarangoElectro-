import type { Product } from "./types";

/** Normalización compartida por el buscador y los filtros públicos. */
export function normalizeCatalogText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value: unknown) {
  return normalizeCatalogText(value).split(" ").filter(Boolean);
}

function scoreToken(queryToken: string, values: Array<{ value: unknown; weight: number }>) {
  const containsNumber = /\d/.test(queryToken);

  for (const { value, weight } of values) {
    const fieldTokens = tokens(value);
    if (fieldTokens.includes(queryToken)) return weight;

    // Los modelos con números deben coincidir como token completo: A17 no
    // puede devolver A16. En palabras largas aceptamos prefijo/subcadena.
    if (containsNumber) continue;
    if (queryToken.length >= 3 && fieldTokens.some((item) => item.startsWith(queryToken))) {
      return Math.round(weight * 0.62);
    }
    if (queryToken.length >= 4 && normalizeCatalogText(value).includes(queryToken)) {
      return Math.round(weight * 0.38);
    }
  }

  return 0;
}

/**
 * Ranking puro, sin telemetría ni efectos secundarios. Cada término debe estar
 * justificado por nombre, marca, modelo, categoría o datos descriptivos.
 */
export function scoreProductSearch(product: Product, rawQuery: string) {
  const query = normalizeCatalogText(rawQuery);
  if (!query) return 1;

  const name = normalizeCatalogText(product.name);
  if (name === query) return 100_000;
  if (query.length >= 3 && name.includes(query)) return 50_000;

  const descriptive = [
    ...product.features,
    ...Object.keys(product.specifications),
    ...Object.values(product.specifications),
  ];
  const weightedValues = [
    { value: product.name, weight: 3_000 },
    { value: product.model, weight: 2_800 },
    { value: product.brand, weight: 2_400 },
    { value: product.category, weight: 900 },
    { value: product.subcategory, weight: 800 },
    ...descriptive.map((value) => ({ value, weight: 450 })),
  ];

  let score = 0;
  for (const queryToken of tokens(query)) {
    const tokenScore = scoreToken(queryToken, weightedValues);
    if (tokenScore === 0) return 0;
    score += tokenScore;
  }

  if (name.startsWith(tokens(query)[0] ?? "")) score += 300;
  return score;
}

export function rankProductsForSearch(products: readonly Product[], rawQuery: string) {
  const query = normalizeCatalogText(rawQuery);
  if (!query) return [...products];

  return products
    .map((product, index) => ({ product, index, score: scoreProductSearch(product, query) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((item) => item.product);
}

export interface CatalogSearchSuggestion {
  id: string;
  kind: "product" | "brand" | "correction";
  label: string;
  query: string;
  meta: string;
}

function editDistance(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost,
      );
    }
    for (let j = 0; j <= b.length; j += 1) previous[j] = current[j];
  }

  return previous[b.length];
}

function uniqueByNormalized(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const normalized = normalizeCatalogText(value);
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function typoDictionary(products: readonly Product[]) {
  return uniqueByNormalized([
    ...products.map((product) => product.brand),
    ...products.flatMap((product) => normalizeCatalogText(product.name).split(" ")),
    ...products.flatMap((product) => product.features.flatMap((feature) => normalizeCatalogText(feature).split(" "))),
  ]).filter((value) => {
    const normalized = normalizeCatalogText(value);
    return normalized.length >= 4 && !/\d/.test(normalized);
  });
}

/**
 * Corrección defensiva para autocomplete/no-results. Nunca cambia la búsqueda
 * automáticamente: solo devuelve una alternativa para que el usuario decida.
 */
export function suggestCatalogCorrection(products: readonly Product[], rawQuery: string) {
  const query = normalizeCatalogText(rawQuery);
  if (!query || query.includes(" ") || /\d/.test(query) || query.length < 4) return null;

  let best: { value: string; distance: number } | null = null;
  for (const value of typoDictionary(products)) {
    const candidate = normalizeCatalogText(value);
    if (candidate === query) return null;
    if (candidate[0] !== query[0]) continue;

    const distance = editDistance(query, candidate);
    const maximum = query.length >= 8 ? 2 : 1;
    if (distance > maximum) continue;
    if (!best || distance < best.distance || (distance === best.distance && candidate.length < normalizeCatalogText(best.value).length)) {
      best = { value, distance };
    }
  }
  return best?.value ?? null;
}

/**
 * Autocomplete derivado exclusivamente del catálogo ya recibido por V16.
 * No consulta red, no registra telemetría y no inventa productos.
 */
export function buildCatalogSuggestions(
  products: readonly Product[],
  rawQuery: string,
  limit = 6,
): CatalogSearchSuggestion[] {
  const query = normalizeCatalogText(rawQuery);
  if (!query) return [];

  const suggestions: CatalogSearchSuggestion[] = [];
  const seenQueries = new Set<string>();
  const push = (suggestion: CatalogSearchSuggestion) => {
    const key = normalizeCatalogText(suggestion.query);
    if (!key || seenQueries.has(key) || suggestions.length >= limit) return;
    seenQueries.add(key);
    suggestions.push(suggestion);
  };

  const matchingBrands = uniqueByNormalized(products.map((product) => product.brand))
    .filter((brand) => {
      const normalized = normalizeCatalogText(brand);
      return normalized.startsWith(query) || (query.length >= 3 && normalized.includes(query));
    })
    .slice(0, 2);

  for (const brand of matchingBrands) {
    push({
      id: `brand:${normalizeCatalogText(brand)}`,
      kind: "brand",
      label: brand,
      query: brand,
      meta: "Explorar marca",
    });
  }

  for (const product of rankProductsForSearch(products, rawQuery).slice(0, limit)) {
    push({
      id: `product:${product.id}`,
      kind: "product",
      label: product.name,
      query: product.name,
      meta: product.model ? `${product.brand} · ${product.model}` : product.brand,
    });
  }

  const correction = suggestCatalogCorrection(products, rawQuery);
  if (correction) {
    push({
      id: `correction:${normalizeCatalogText(correction)}`,
      kind: "correction",
      label: correction,
      query: correction,
      meta: "¿Quisiste decir?",
    });
  }

  return suggestions.slice(0, limit);
}
