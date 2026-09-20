import "server-only";

import { z } from "zod";
import type { CatalogAdapter, CatalogQuery, Product } from "./types";

const moneySchema = z.object({
  amount: z.number().finite().nonnegative(),
  currency: z.literal("ARS"),
});

const productSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().nullable(),
  category: z.string().min(1),
  subcategory: z.string().nullable(),
  image: z.object({ src: z.string().min(1), alt: z.string() }).nullable(),
  price: moneySchema.nullable(),
  financing: z.array(z.object({
    installments: z.number().int().positive(),
    installmentAmount: moneySchema.nullable(),
    totalAmount: moneySchema.nullable(),
    label: z.string().nullable(),
  })),
  availability: z.enum(["available", "unavailable", "unknown"]),
  stock: z.object({
    status: z.enum(["in_stock", "out_of_stock", "unknown"]),
    quantity: z.number().int().nonnegative().nullable(),
    label: z.string().nullable(),
  }),
  features: z.array(z.string()),
  specifications: z.record(z.string(), z.string()),
  description: z.string().nullable(),
  warranty: z.string().nullable(),
  visible: z.boolean(),
  source: z.literal("supabase-readonly"),
});

export interface SupabaseReadOnlyConfig {
  url: string;
  anonKey: string;
  // Debe ser una vista o recurso previamente auditado que ya devuelva la
  // estructura Product. No se asume un nombre de tabla real.
  resource: string;
}

export class SupabaseReadOnlyCatalogAdapter implements CatalogAdapter {
  readonly source = "supabase-readonly" as const;

  constructor(private readonly config: SupabaseReadOnlyConfig) {}

  private async read(searchParams: URLSearchParams): Promise<Product[]> {
    const endpoint = new URL(
      `/rest/v1/${encodeURIComponent(this.config.resource)}`,
      this.config.url,
    );
    searchParams.forEach((value, key) => endpoint.searchParams.set(key, value));

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        apikey: this.config.anonKey,
        Authorization: `Bearer ${this.config.anonKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Catalog read failed (${response.status})`);
    }

    const rows: unknown = await response.json();
    const parsed = z.array(productSchema).safeParse(rows);
    if (!parsed.success) throw new Error("Catalog response failed the public product contract");
    return parsed.data satisfies Product[];
  }

  async listProducts(query: CatalogQuery = {}) {
    const params = new URLSearchParams({ select: "*" });
    if (query.category) params.set("category", `eq.${query.category}`);
    if (query.subcategory) params.set("subcategory", `eq.${query.subcategory}`);
    if (query.brand) params.set("brand", `eq.${query.brand}`);
    // Este adaptador pertenece al storefront público: nunca expone registros
    // ocultos, incluso si un consumidor futuro intenta omitir el filtro.
    params.set("visible", "eq.true");
    if (query.inStockOnly) params.set("stock.status", "eq.in_stock");
    // La búsqueda textual se activa únicamente después de auditar las columnas
    // reales; no se construyen filtros con nombres supuestos.
    return this.read(params);
  }

  async getProductBySlug(slug: string) {
    const rows = await this.read(
      new URLSearchParams({ select: "*", slug: `eq.${slug}`, visible: "eq.true", limit: "1" }),
    );
    return rows[0] ?? null;
  }
}
