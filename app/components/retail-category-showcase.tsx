import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "./store-link";
import { retailCategories } from "@/lib/catalog/retail-categories";
import { getSectorAccent } from "@/lib/theme/sector-theme";

function slugFromHref(href: string): string | undefined {
  return href.match(/^\/categoria\/([^/?#]+)/)?.[1];
}

export function RetailCategoryShowcase() {
  return (
    <section className="retail-categories" id="categorias" aria-labelledby="retail-categories-title">
      <div className="section-intro split">
        <div><p className="eyebrow orange">{retailCategories.length} CATEGORÍAS</p><h2 id="retail-categories-title">Recorré todo el Shopping Amarango.</h2></div>
        <p>El directorio completo, siempre disponible. Cada categoría tiene una campaña propia y una entrada directa, con la ambientación de su sector.</p>
      </div>

      <div className="retail-category-featured">
        {retailCategories.map((category, index) => {
          const canonicalSlug = slugFromHref(category.href);
          const sectorAccent = canonicalSlug ? getSectorAccent(canonicalSlug) : undefined;
          return (
          <Link
            key={category.id}
            href={category.href}
            className={`retail-art-card retail-art-card-${category.size}`}
            data-artwork-framing={category.artworkMode === "embedded" ? "full-composition" : "ratio-designed"}
            data-artwork-mode={category.artworkMode}
            data-artwork-ratio={category.artworkRatio}
            data-category-art={category.id}
            style={sectorAccent ? ({ "--sector-accent": sectorAccent } as CSSProperties) : undefined}
          >
            <span className="sr-only">Explorar {category.title}</span>
            <picture className="retail-art-picture">
              <source media="(max-width: 760px)" srcSet={category.mobileImage} />
              <img
                src={category.image}
                alt=""
                width="1536"
                height={category.artworkRatio === "4:3" ? "1152" : "1024"}
                loading={index < 2 ? "eager" : "lazy"}
                fetchPriority={index < 2 ? "high" : "auto"}
                decoding="async"
              />
            </picture>
            {category.artworkMode === "background" ? (
              <>
                <span className="retail-art-shade" aria-hidden="true" />
                <span className="retail-official-logo" aria-hidden="true"><Image src="/logo-320.webp" alt="" fill sizes="76px" unoptimized /></span>
                <span className="retail-art-copy">
                  <small>{category.eyebrow}</small>
                  <strong>{category.title}</strong>
                  <span>{category.description}</span>
                </span>
                <span className="retail-card-hit" aria-hidden="true">Explorar <b>→</b></span>
              </>
            ) : category.overlayLogo ? (
              <span className="retail-official-logo retail-official-logo-embedded" aria-hidden="true"><Image src="/logo-320.webp" alt="" fill sizes="76px" unoptimized /></span>
            ) : null}
          </Link>
          );
        })}
      </div>

      <div className="retail-category-count"><strong>{retailCategories.length}</strong><span>categorías comerciales preparadas sobre la arquitectura V16</span></div>
    </section>
  );
}
