import Link from "../../components/store-link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { catalog } from "@/lib/catalog";
import { ProductActions } from "@/app/components/product-actions";
import { ProductCard } from "@/app/components/product-card";
import { ProductDecisionDetails } from "@/app/components/product-decision-details";
import { ProductMediaViewer } from "@/app/components/product-media-viewer";
import { PurchaseIntentFlow } from "@/app/components/purchase-intent-flow";
import { SiteFooter } from "@/app/components/site-footer";
import { SiteHeader } from "@/app/components/site-header";
import { RecentlyViewedRecorder } from "@/app/components/recently-viewed-recorder";
import { RecentlyViewedRail } from "@/app/components/recently-viewed-rail";
import { ReturnToResults } from "@/app/components/return-to-results";
import { getCategory } from "@/lib/catalog/categories";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await catalog.getProductBySlug(slug);
  if (!product) return {};
  const description = product.price
    ? `${product.brand} en AmarangoElectro · ${new Intl.NumberFormat("es-AR", { style: "currency", currency: product.price.currency, maximumFractionDigits: 0 }).format(product.price.amount)}`
    : `${product.brand} en AmarangoElectro · consultá precio y disponibilidad.`;
  const images = product.image ? [{ url: product.image.src, alt: product.image.alt }] : [];
  return {
    title: `${product.name} | AmarangoElectro`,
    description,
    openGraph: { title: product.name, description, type: "website", images },
    twitter: { card: product.image ? "summary_large_image" : "summary", title: product.name, description, images: product.image ? [product.image.src] : [] },
  };
}

function DataField({ label, value }: { label: string; value: string | null }) {
  return <div className="data-field"><small>{label}</small><strong className={value ? "" : "pending"}>{value ?? "Consultar"}</strong></div>;
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await catalog.getProductBySlug(slug);
  if (!product) notFound();
  const brandTone = product.brand.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const categoryTitle = getCategory(product.category)?.title ?? product.category.replace(/-/g, " ");
  const [categoryProducts, recentCandidates] = await Promise.all([
    catalog.listProducts({ category: product.category, visibleOnly: true }),
    catalog.listProducts({ visibleOnly: true }),
  ]);
  const relatedProducts = categoryProducts
    .filter((candidate) => candidate.id !== product.id)
    .sort((a, b) => Number(b.brand === product.brand) - Number(a.brand === product.brand))
    .slice(0, 3);

  return (
    <>
      <SiteHeader />
      <RecentlyViewedRecorder productId={product.id} />
      <main className="product-page">
        <div className="product-return-row"><ReturnToResults fallbackHref={`/categoria/${product.category}#catalogo`} /></div>
        <nav className="breadcrumb" aria-label="Migas de pan"><Link href="/">Inicio</Link><span>›</span><Link href={`/categoria/${product.category}`}>{categoryTitle}</Link><span>›</span><strong>{product.name}</strong></nav>
        <section className={`product-detail brand-${brandTone}`}>
          <div className="product-detail-visual">
            {product.image ? (
              <>
                <Image className="detail-product-image" src={product.image.src} alt={product.image.alt} fill sizes="(max-width: 840px) 100vw, 45vw" priority unoptimized />
                <ProductMediaViewer image={product.image} productName={product.name} />
              </>
            ) : (
              <>
                <span className="detail-orbit detail-orbit-one" aria-hidden="true" />
                <span className="detail-orbit detail-orbit-two" aria-hidden="true" />
                <span className="detail-watermark" aria-hidden="true">{product.brand}</span>
                <div className="detail-monogram" aria-hidden="true"><span>{product.brand.slice(0, 2).toUpperCase()}</span></div>
                <div className="detail-visual-caption" aria-hidden="true"><small>AMARANGO SELECT</small><strong>{product.name}</strong></div>
                <p className="detail-image-note">La fotografía oficial se mostrará desde el catálogo</p>
              </>
            )}
          </div>
          <div className="product-detail-copy">
            <p className="eyebrow orange">{product.brand} · AMARANGOELECTRO</p>
            <h1>{product.name}</h1>
            <p className="product-lead">{product.description ?? "Consultá características y disponibilidad."}</p>
            <div className="feature-chips large">{product.features.map((feature) => <span key={feature}>{feature}</span>)}</div>
            <div className="product-data-grid">
              <DataField label="MODELO" value={product.model} />
              <DataField label="DISPONIBILIDAD" value={product.stock.label} />
              <DataField label="PRECIO" value={product.price ? new Intl.NumberFormat("es-AR", { style: "currency", currency: product.price.currency, maximumFractionDigits: 0 }).format(product.price.amount) : null} />
              <DataField label="GARANTÍA" value={product.warranty} />
            </div>
            <ProductActions product={product} />
            <p className="product-honesty">Consultá con nuestro equipo los datos comerciales que no figuren publicados.</p>
          </div>
        </section>

        <section className="product-information">
          <article><span>▣</span><div><h2>Financiación clara</h2><p>{product.financing.length ? "Opciones disponibles en el catálogo." : "Consultá las opciones de pago disponibles para este producto."}</p></div></article>
          <article><span>⌂</span><div><h2>Entrega y disponibilidad</h2><p>Consultá disponibilidad y condiciones de entrega para tu zona.</p></div></article>
          <article><span>✓</span><div><h2>Garantía y respaldo</h2><p>Consultá la garantía correspondiente a este producto.</p></div></article>
        </section>

        <ProductDecisionDetails product={product} />

        <RecentlyViewedRail products={recentCandidates} excludeId={product.id} />

        {relatedProducts.length > 0 && (
          <section className="related-products" aria-labelledby="related-products-title">
            <div className="related-products-heading">
              <div>
                <p className="eyebrow orange">SEGUÍ EXPLORANDO</p>
                <h2 id="related-products-title">También te puede interesar.</h2>
              </div>
              <Link href={`/categoria/${product.category}#catalogo`}>Volver al catálogo <span>→</span></Link>
            </div>
            <div className="catalog-grid">{relatedProducts.map((item) => <ProductCard key={item.id} product={item} />)}</div>
          </section>
        )}
      </main>
      <SiteFooter />
      <PurchaseIntentFlow />
    </>
  );
}
