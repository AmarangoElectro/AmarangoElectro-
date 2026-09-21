"use client";

import Link from "./store-link";
import { getCategory } from "@/lib/catalog/categories";
import { retailCategories } from "@/lib/catalog/retail-categories";
import { openSectorsSheet } from "@/lib/ux/sectors-sheet";
import { playSonicCue } from "@/lib/ux/sonic-feedback";

const FEATURED_SECTORS = [
  { slug: "celulares", subtitle: "Tecnología que va con vos." },
  { slug: "smart-tv", subtitle: "Entretenimiento en gran escala." },
  { slug: "electrodomesticos", subtitle: "Para un hogar más simple." },
  { slug: "audio", subtitle: "Audio para cada ambiente." },
  { slug: "gaming", subtitle: "Consolas, juegos y accesorios." },
  { slug: "hogar", subtitle: "Muebles, deco y soluciones para tu casa." },
  { slug: "descanso", subtitle: "Mejor sueño, mejores días." },
  { slug: "herramientas", subtitle: "Hacé realidad tus proyectos." },
  { slug: "refrigeracion", subtitle: "Heladeras, freezers y frío para tu hogar." },
  { slug: "climatizacion", subtitle: "Confort para todo el año." },
  { slug: "coccion", subtitle: "Todo para cocinar y disfrutar." },
  { slug: "lavado", subtitle: "Cuidado práctico para tu ropa." },
  { slug: "pequenos-electrodomesticos", subtitle: "Soluciones prácticas para todos los días." },
  { slug: "limpieza", subtitle: "Equipos para cuidar cada espacio." },
  { slug: "colchones-sommiers", subtitle: "Confort para renovar tu descanso." },
  { slug: "blanqueria", subtitle: "Textiles para vestir cada ambiente." },
] as const;

export function FeaturedSectorsGrid() {
  const featured = FEATURED_SECTORS.flatMap(({ slug, subtitle }) => {
    const category = getCategory(slug);
    const retail = retailCategories.find((item) => item.id === slug);

    if (category) {
      return [{
        key: category.slug,
        title: category.title,
        href: `/categoria/${category.slug}`,
        subtitle,
        artwork: retail?.image ?? category.image ?? category.bannerImage ?? null,
      }];
    }

    if (retail) {
      return [{
        key: retail.id,
        title: retail.title,
        href: retail.href,
        subtitle,
        artwork: retail.image,
      }];
    }

    return [];
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
        {featured.map(({ key, title, href, subtitle, artwork }) => (
          <Link
            key={key}
            href={href}
            className="featured-sector-card"
            aria-label={`Entrar a ${title}`}
          >
            {artwork ? <img src={artwork} alt="" loading="lazy" decoding="async" /> : null}
            <span className="featured-sector-shade" aria-hidden="true" />
            <span className="featured-sector-copy">
              <strong>{title}</strong>
              <small>{subtitle}</small>
            </span>
            <span className="featured-sector-arrow" aria-hidden="true">→</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
