import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function readDirectorySources(relativeDirectory) {
  const directory = new URL(relativeDirectory, root);
  const files = (await readdir(directory)).filter((name) => /\.(?:ts|tsx|mjs|js)$/.test(name));
  return Promise.all(files.map((name) => readFile(new URL(name, directory), "utf8")));
}

test("legacy public adapter is isolated and contains no write operation", async () => {
  const sources = await readDirectorySources("lib/catalog/legacy/");
  const combined = sources.join("\n");

  assert.doesNotMatch(combined, /\.(?:insert|upsert|update|delete|rpc)\s*\(/i);
  assert.doesNotMatch(combined, /method\s*:\s*["'](?:POST|PUT|PATCH|DELETE)["']/i);
  assert.doesNotMatch(combined, /createClient|service_role|SUPABASE_URL|NEXT_PUBLIC_SUPABASE/i);

  const adapter = await readFile(new URL("lib/catalog/legacy/legacy-catalog-adapter.ts", root), "utf8");
  for (const operation of ["listProducts", "getProductBySlug"]) assert.match(adapter, new RegExp(operation));
});

test("legacy normalization is pure, fail-closed and never invents financing", async () => {
  const { normalizeLegacyCatalog } = await import(new URL("../lib/catalog/legacy/legacy-normalizer.ts", import.meta.url));
  const snapshot = {
    tiendaCatalogo: {
      datos: [
        {
          id: 501,
          nombre: "Samsung Galaxy A17",
          categoria: "📱 Celulares",
          venta: 420000,
          visible: true,
          proveedorStock: 3,
          foto: "https://images.example.test/galaxy-a17.jpg",
          caracteristicas: "Pantalla AMOLED\n128 GB",
          sinInteres: 6,
        },
        { id: 502, nombre: "Samsung Galaxy oculto", categoria: "📱 Celulares", venta: 1, visible: false },
        { id: 503, nombre: "Motorola Moto sin stock", categoria: "📱 Celulares", venta: 1, visible: true, proveedorStock: 0 },
      ],
    },
    celularesLista: [
      { nombre: "iPhone 15", precio: 900000, colores: ["Negro"], foto: "javascript:alert(1)" },
      { nombre: "Xiaomi Redmi agotado", precio: 200000, sinStock: true },
    ],
  };
  const before = structuredClone(snapshot);
  Object.freeze(snapshot.tiendaCatalogo.datos[0]);
  Object.freeze(snapshot.tiendaCatalogo.datos[1]);
  Object.freeze(snapshot.tiendaCatalogo.datos[2]);
  Object.freeze(snapshot.tiendaCatalogo.datos);
  Object.freeze(snapshot.tiendaCatalogo);
  Object.freeze(snapshot.celularesLista[0]);
  Object.freeze(snapshot.celularesLista[1]);
  Object.freeze(snapshot.celularesLista);
  Object.freeze(snapshot);

  const result = normalizeLegacyCatalog(snapshot);
  assert.deepEqual(snapshot, before, "normalization mutated the legacy snapshot");
  assert.equal(result.products.length, 2);
  assert.equal(result.rejected.length, 3);

  const samsung = result.products.find((product) => product.brand === "Samsung");
  const iphone = result.products.find((product) => product.brand === "Apple");
  assert.ok(samsung);
  assert.equal(samsung.category, "celulares");
  assert.equal(samsung.price.amount, 420000);
  assert.equal(samsung.stock.status, "in_stock");
  assert.equal(samsung.stock.quantity, null, "provider quantity must not leak into the public contract");
  assert.deepEqual(samsung.financing, [], "legacy installments are not commercially validated");
  assert.ok(Object.isFrozen(samsung));
  assert.ok(iphone);
  assert.equal(iphone.image, null, "unsafe image protocols must be rejected");
  assert.match(iphone.slug, /^iphone-15-/);
});

test("potential duplicates are reported without automatically hiding records", async () => {
  const { normalizeLegacyCatalog } = await import(new URL("../lib/catalog/legacy/legacy-normalizer.ts", import.meta.url));
  const result = normalizeLegacyCatalog({
    tiendaCatalogo: [{ id: "catalog-1", nombre: "Samsung Galaxy A17", categoria: "Celulares", venta: 10, visible: true }],
    celularesLista: [{ nombre: "Samsung Galaxy A17", precio: 10 }],
  });

  assert.equal(result.products.length, 2);
  assert.equal(result.potentialDuplicates.length, 1);
  assert.deepEqual(new Set(result.potentialDuplicates[0].products.map((item) => item.source)), new Set(["tienda_catalogo", "celulares_lista"]));
});

test("catalogue search tolerates accents and case while keeping numeric models exact", async () => {
  const { rankProductsForSearch } = await import(new URL("../lib/catalog/search.ts", import.meta.url));
  const base = {
    slug: "sample",
    category: "celulares",
    subcategory: "samsung",
    image: null,
    price: null,
    financing: [],
    availability: "unknown",
    stock: { status: "unknown", quantity: null, label: null },
    features: ["Cámara nítida"],
    specifications: {},
    description: null,
    warranty: null,
    visible: true,
    source: "mock",
  };
  const products = [
    { ...base, id: "a17", name: "Samsung Galaxy A17", brand: "Samsung", model: "A17" },
    { ...base, id: "a16", name: "Samsung Galaxy A16", brand: "Samsung", model: "A16" },
    { ...base, id: "moto", name: "Motorola Moto G", brand: "Motorola", model: null },
  ];

  assert.deepEqual(rankProductsForSearch(products, "SÁMSUNG a17").map((item) => item.id), ["a17"]);
  assert.deepEqual(rankProductsForSearch(products, "camara").map((item) => item.id), ["a17", "a16", "moto"]);
  assert.deepEqual(rankProductsForSearch(products, "motorola").map((item) => item.id), ["moto"]);
});

test("individual product sharing uses the new URL and falls back to clipboard", async () => {
  const { shareProductLink } = await import(new URL("../lib/commerce/share-product.ts", import.meta.url));
  const url = "https://preview.example/producto/samsung-galaxy-a17-abc";
  let copied = "";
  const result = await shareProductLink(
    { name: "Samsung Galaxy A17", url },
    {
      share: async () => { const error = new Error("native share unavailable"); error.name = "NotAllowedError"; throw error; },
      clipboard: { writeText: async (value) => { copied = value; } },
    },
  );

  assert.equal(result, "copied");
  assert.match(copied, /^Samsung Galaxy A17\nAmarangoElectro\n/);
  assert.match(copied, new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(url, /\/producto\//);
});

test("Margarita legacy files remain out of scope", async () => {
  const index = await readFile(new URL("lib/catalog/index.ts", root), "utf8");
  const legacySources = (await readDirectorySources("lib/catalog/legacy/")).join("\n");
  assert.doesNotMatch(`${index}\n${legacySources}`, /margarita-ui|margarita-|amara\.js|worker-core|prompt|openai/i);
});
