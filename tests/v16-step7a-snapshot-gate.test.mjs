import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("snapshot gate strips private and unknown fields before normalization", async () => {
  const { sanitizeLegacySnapshot } = await import(new URL("../lib/catalog/legacy/legacy-snapshot-sanitizer.ts", import.meta.url));
  const input = {
    tiendaCatalogo: {
      datos: [{
        id: 11,
        nombre: "Samsung Galaxy A17",
        venta: 500000,
        categoria: "Celulares",
        visible: true,
        costo: 300000,
        mayorista: "NO DEBE SALIR",
        token: "NO DEBE SALIR",
        proveedorStock: 2,
      }],
    },
    celularesLista: [{
      nombre: "Motorola Moto G15",
      precio: 300000,
      costo: 1,
      proveedor: "NO DEBE SALIR",
    }],
  };
  const before = structuredClone(input);
  const clean = sanitizeLegacySnapshot(input);

  assert.deepEqual(input, before, "snapshot gate mutated the input");
  assert.equal(clean.tiendaCatalogo[0].costo, undefined);
  assert.equal(clean.tiendaCatalogo[0].mayorista, undefined);
  assert.equal(clean.tiendaCatalogo[0].token, undefined);
  assert.equal(clean.tiendaCatalogo[0].venta, 500000);
  assert.equal(clean.celularesLista[0].costo, undefined);
  assert.equal(clean.celularesLista[0].proveedor, undefined);
  assert.equal(clean.celularesLista[0].precio, 300000);
  assert.ok(Object.isFrozen(clean));
  assert.ok(Object.isFrozen(clean.tiendaCatalogo));
});

test("legacy phone brand coverage matches the audited legacy families without changing the approved UI", async () => {
  const { normalizeLegacyCatalog } = await import(new URL("../lib/catalog/legacy/legacy-normalizer.ts", import.meta.url));
  const names = [
    ["Nokia G42", "Nokia"],
    ["Honor X7", "Honor"],
    ["TCL 505", "TCL"],
    ["ZTE Blade A55", "ZTE"],
    ["Realme C75", "Realme"],
    ["Huawei Nova", "Huawei"],
    ["Alcatel 1", "Alcatel"],
    ["LG K52", "LG"],
    ["Oppo A5", "Oppo"],
    ["Vivo Y19", "Vivo"],
  ];
  const result = normalizeLegacyCatalog({
    celularesLista: names.map(([nombre]) => ({ nombre, precio: 100000 })),
  });
  assert.equal(result.rejected.length, 0);
  assert.deepEqual(result.products.map((product) => product.brand), names.map(([, brand]) => brand));
});

test("duplicate diagnostics recognize conservative Moto/Motorola aliases without auto-hiding", async () => {
  const { normalizeLegacyCatalog } = await import(new URL("../lib/catalog/legacy/legacy-normalizer.ts", import.meta.url));
  const result = normalizeLegacyCatalog({
    tiendaCatalogo: [{ id: 1, nombre: "Motorola G15 128GB", categoria: "Celulares", venta: 300000, visible: true }],
    celularesLista: [{ nombre: "Moto G15 128 gb", precio: 300000 }],
  });

  assert.equal(result.products.length, 2);
  assert.equal(result.potentialDuplicates.length, 1);
  assert.equal(result.products.every((product) => product.visible), true, "duplicate diagnostics must never hide products automatically");
});

test("snapshot gate contains no network, credential or write primitive", async () => {
  const source = await readFile(new URL("lib/catalog/legacy/legacy-snapshot-sanitizer.ts", root), "utf8");
  assert.doesNotMatch(source, /fetch\s*\(|createClient|service_role|SUPABASE_URL|NEXT_PUBLIC_SUPABASE/i);
  assert.doesNotMatch(source, /\.(?:insert|upsert|update|delete|rpc)\s*\(/i);
  assert.doesNotMatch(source, /method\s*:\s*["'](?:POST|PUT|PATCH|DELETE)["']/i);
});
