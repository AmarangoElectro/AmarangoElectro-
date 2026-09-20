"use client";

import Link from "./store-link";
import { getCategory, type CategoryDefinition } from "@/lib/catalog/categories";
import { openSectorsSheet } from "@/lib/ux/sectors-sheet";
import { playSonicCue } from "@/lib/ux/sonic-feedback";

const FEATURED_SLUGS = ["celulares", "smart-tv", "electrodomesticos", "audio", "gaming", "hogar"] as const;

export function FeaturedSectorsGrid() {
  const featured = FEATURED_SLUGS
    .map((slug) => getCategory(slug))
    .filter((category): category is CategoryDefinition => Boolean(category));
  if (featured.length === 0) return null;

  return (
    <section className="featured-sectors" aria-labelledby="featured-sectors-title">
      <div className="section-intro split">
        <div>
          <p className="eyebrow orange">EXPLORÁ POR SECTOR</p>
          <h2 id="featured-sectors-title">Encontrá rápido lo que buscás.</h2>
        </div>
        <button type="button" className="featured-sectors-all" onClick={() => { playSonicCue("tap"); openSectorsSheet(); }}>
          Ver todos los sectores <span aria-hidden="true">→</span>
        </button>
      </div>
      <div className="featured-sectors-grid">
        {featured.map((category) => (
          <Link key={category.slug} href={`/categoria/${category.slug}`} className="featured-sector-card">
            {category.bannerImage ? (
              <img src={category.bannerImage} alt="" loading="lazy" decoding="async" />
            ) : category.image ? (
              <img src={category.image} alt="" loading="lazy" decoding="async" />
            ) : null}
            <span className="featured-sector-shade" aria-hidden="true" />
            <span className="featured-sector-icon" aria-hidden="true">{category.icon}</span>
            <span className="featured-sector-copy">
              <small>{category.eyebrow}</small>
              <strong>{category.title}</strong>
              <b>Entrar al sector <i aria-hidden="true">→</i></b>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
