"use client";

import Link from "./store-link";
import { getCategory } from "@/lib/catalog/categories";
import { openSectorsSheet } from "@/lib/ux/sectors-sheet";
import { playSonicCue } from "@/lib/ux/sonic-feedback";

const FEATURED_SECTORS = [
  { slug: "celulares", subtitle: "Tecnología que va con vos." },
  { slug: "smart-tv", subtitle: "Entretenimiento en gran escala." },
  { slug: "electrodomesticos", subtitle: "Para un hogar más simple." },
  { slug: "audio", subtitle: "Sentí cada momento." },
  { slug: "gaming", subtitle: "Jugá sin límites." },
  { slug: "hogar", subtitle: "Tu espacio. Tu estilo." },
  { slug: "descanso", subtitle: "Mejor sueño, mejores días." },
  { slug: "herramientas", subtitle: "Hacé realidad tus proyectos." },
] as const;

export function FeaturedSectorsGrid() {
  const featured = FEATURED_SECTORS.flatMap(({ slug, subtitle }) => {
    const category = getCategory(slug);
    return category ? [{ category, subtitle }] : [];
  });

  if (featured.length === 0) return null;

  return (
    <section className="featured-sectors" aria-labelledby="featured-sectors-title">
      <div className="section-intro split">
        <div>
          <p className="eyebrow orange">EXPLORÁ POR SECTOR</p>
          <h2 id="featured-sectors-title">Encontrá rápido lo que buscás.</h2>
        </div>
        <button
          type="button"
          className="featured-sectors-all"
          onClick={() => {
            playSonicCue("tap");
            openSectorsSheet();
          }}
        >
          Ver todos los sectores <span aria-hidden="true">→</span>
        </button>
      </div>

      <div className="featured-sectors-grid">
        {featured.map(({ category, subtitle }) => (
          <Link
            key={category.slug}
            href={`/categoria/${category.slug}`}
            className="featured-sector-card"
            aria-label={`Entrar a ${category.title}`}
          >
            {category.image ? (
              <img src={category.image} alt="" loading="lazy" decoding="async" />
            ) : category.bannerImage ? (
              <img src={category.bannerImage} alt="" loading="lazy" decoding="async" />
            ) : null}
            <span className="featured-sector-shade" aria-hidden="true" />
            <span className="featured-sector-copy">
              <strong>{category.title}</strong>
              <small>{subtitle}</small>
            </span>
            <span className="featured-sector-arrow" aria-hidden="true">→</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
