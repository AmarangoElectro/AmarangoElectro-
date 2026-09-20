import Image from "next/image";
import Link from "./store-link";
import type { CategoryDefinition } from "@/lib/catalog/categories";

interface Props {
  category: CategoryDefinition;
  activeSubcategories: Array<{ title: string }>;
}

export function PremiumCategoryHero({ category, activeSubcategories }: Props) {
  return (
    <section
      className={`premium-category-hero${category.bannerImage ? " has-editorial-art" : " has-prepared-art"}`}
      aria-label={`Banner ${category.title}`}
      data-image-status={category.bannerImageStatus ?? category.imageStatus}
      data-banner-framing={category.bannerFraming ?? "focused-art"}
      data-banner-slug={category.slug}
    >
      <div className="premium-category-hero-art" aria-hidden="true">
        {category.bannerImage ? (
          <Image
            src={category.bannerImage}
            alt=""
            fill
            priority
            sizes="(max-width: 760px) 100vw, 58vw"
            unoptimized
          />
        ) : (
          <span className={`premium-category-prepared-art premium-category-prepared-${category.slug}`}>
            <i>{category.icon}</i>
            <strong>{category.title}</strong>
            <b>AMARANGO</b>
          </span>
        )}
        <span className="premium-category-hero-art-mask" />
      </div>

      <span className="premium-category-watermark" aria-hidden="true">
        <Image src="/logo-320.webp" alt="" fill sizes="340px" unoptimized />
      </span>

      <div className="premium-category-brand">
        <span className="premium-category-brand-disc">
          <Image src="/logo-320.webp" alt="AmarangoElectro" fill sizes="180px" unoptimized />
          <i aria-hidden="true">🐝</i>
        </span>
      </div>

      <div className="premium-category-copy">
        <Link className="premium-category-back" href="/">← Volver a la tienda</Link>
        <p className="premium-category-eyebrow">{category.eyebrow}</p>
        <h1>{category.title}</h1>
        {activeSubcategories.length > 0 && (
          <p className="premium-category-sectors">
            {activeSubcategories.map((item, index) => (
              <span key={item.title}>{item.title}{index < activeSubcategories.length - 1 ? <b aria-hidden="true">•</b> : null}</span>
            ))}
          </p>
        )}
        <p className="premium-category-description">{category.heroTagline ?? category.description}</p>
        <div className="premium-category-trust" aria-label="Beneficios AmarangoElectro">
          <span><i aria-hidden="true">✓</i><b>Calidad</b><small>garantizada</small></span>
          <span><i aria-hidden="true">◎</i><b>Marcas</b><small>confiables</small></span>
          <span><i aria-hidden="true">◉</i><b>Soporte</b><small>especializado</small></span>
        </div>
      </div>
      <span className="premium-category-honeycomb premium-category-honeycomb-left" aria-hidden="true" />
      <span className="premium-category-honeycomb premium-category-honeycomb-right" aria-hidden="true" />
      <span className="premium-category-wave" aria-hidden="true" />
    </section>
  );
}
