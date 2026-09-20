import Link from "./store-link";
import { ProductCard } from "./product-card";
import type { Product } from "@/lib/catalog";

const PREVIEW_COUNT = 8;

export function HomeProductsPreview({ products }: { products: Product[] }) {
  const preview = products.slice(0, PREVIEW_COUNT);
  if (preview.length === 0) return null;

  return (
    <section className="home-products-preview" aria-labelledby="home-products-title">
      <div className="section-intro split">
        <div>
          <p className="eyebrow orange">PRODUCTOS</p>
          <h2 id="home-products-title">Lo que estamos mostrando ahora.</h2>
        </div>
        <Link href="/buscar" className="featured-sectors-all">
          Ver más productos <span aria-hidden="true">→</span>
        </Link>
      </div>
      <div className="home-products-grid">
        {preview.map((product) => (
          <ProductCard key={product.id} product={product} visualContext="amarango" />
        ))}
      </div>
    </section>
  );
}
