export type CatalogSource =
  | "mock"
  | "legacy-pilot"
  | "v411-audit-fixture"
  | "v412-canonical-audit"
  | "supabase-readonly"
  | "cohort-0-frozen-evidence"
  | "v16-electro-sanitized-snapshot"
  | "v16-cellphones-90-materialized"
  | "v16-cellphones-sanitized-snapshot"
  | "v16-catalog-expansion-63"
  | "v16-cellphones-90-public"
  | "v16-catalog-expansion-5-v412"
  | "v16-catalog-expansion-31-known-brand"
  | "v16-catalog-expansion-48-explicit-brand";

export type Availability = "available" | "unavailable" | "unknown";
export type StockStatus = "in_stock" | "out_of_stock" | "unknown";

export interface Money {
  amount: number;
  currency: "ARS";
}

export interface FinancingOption {
  installments: number;
  installmentAmount: Money | null;
  totalAmount: Money | null;
  label: string | null;
}

export interface ProductImage {
  src: string;
  alt: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  model: string | null;
  category: string;
  subcategory: string | null;
  image: ProductImage | null;
  price: Money | null;
  financing: FinancingOption[];
  availability: Availability;
  stock: {
    status: StockStatus;
    quantity: number | null;
    label: string | null;
  };
  features: string[];
  specifications: Record<string, string>;
  description: string | null;
  warranty: string | null;
  visible: boolean;
  source: CatalogSource;
}

export interface CatalogQuery {
  category?: string;
  subcategory?: string;
  brand?: string;
  search?: string;
  visibleOnly?: boolean;
  inStockOnly?: boolean;
  maxPrice?: number;
}

export interface CatalogAdapter {
  readonly source: CatalogSource;
  listProducts(query?: CatalogQuery): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | null>;
}
