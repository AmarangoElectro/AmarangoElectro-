"use client";

import {coordinatedSectorArt} from "@/lib/visual/sector-banner-art";
import {AudioWave} from "./audio-wave";
import Link from "./store-link";
import { getCategory } from "@/lib/catalog/categories";
import { retailCategories } from "@/lib/catalog/retail-categories";
import { openSectorsSheet } from "@/lib/ux/sectors-sheet";
import { playSonicCue } from "@/lib/ux/sonic-feedback";

const FINAL_HOME_SECTORS = [
  { slug: "celulares", subtitle: "Tecnología que va con vos." },
  { slug: "smart-tv", subtitle: "Entretenimiento en gran escala." },
  { slug: "electrodomesticos", subtitle: "Para un hogar más simple." },
  { slug: "audio", subtitle: "Audio para cada ambiente." },
  { slug: "hogar", title: "Hogar y Deco", subtitle: "Muebles, deco y soluciones para tu casa." },
  { slug: "herramientas", subtitle: "Hacé realidad tus proyectos." },
  { slug: "gaming", subtitle: "Consolas, juegos y accesorios." },
  { slug: "descanso", subtitle: "Mejor sueño, mejores días." },
] as const;

const HOME_ARTWORK: Readonly<Record<string, string>> = {
  ...coordinatedSectorArt,
  celulares: "/assets/v16-generated/sectors-v2/celulares.webp",
};

export function FeaturedSectorsGrid() {
  const featured = FINAL_HOME_SECTORS.flatMap(({ slug, subtitle, ...sector }) => {
    const category = getCategory(slug);
    const retail = retailCategories.find((item) => item.id === slug);

    if (category) {
      return [{
        key: category.slug,
        title: "title" in sector ? sector.title : category.title,
        href: `/categoria/${category.slug}#catalogo`,
        subtitle,
        artwork: HOME_ARTWORK[slug] ?? retail?.image ?? category.image ?? category.bannerImage ?? null,
      }];
    }

    if (retail) {
      return [{
        key: retail.id,
        title: "title" in sector ? sector.title : retail.title,
        href: retail.href,
        subtitle,
        artwork: HOME_ARTWORK[slug] ?? retail.image,
      }];
    }

    return [];
  });

  if (featured.length === 0) return null;

  return (
    <section id="sectores" className="featured-sectors home-final-sectors" aria-labelledby="featured-sectors-title">
      <div className="section-intro split">
        <div>
          <p className="eyebrow orange">EXPLORÁ POR SECTOR</p>
          <h2 id="featured-sectors-title">Encontrá rápido lo que buscás.</h2>
        </div>
      </div>

      <div className="featured-sectors-grid">
        {featured.map(({ key, title, href, subtitle, artwork }) => (
          <Link
            key={key}
            href={href}
            className={`featured-sector-card${coordinatedSectorArt[key]?" has-coordinated-art":""}`}
            data-home-sector={key}
            aria-label={`Entrar a ${title}`}
          >
            {artwork ? <img src={artwork} alt="" loading="lazy" decoding="async" /> : null}
            <span className="featured-sector-shade" aria-hidden="true" />
            <span className="featured-sector-copy">
              <strong>{title}</strong>
              <small>{subtitle}</small>
              {key === "audio" ? <AudioWave className="home-audio-wave"/> : null}
            </span>
            <span className="featured-sector-arrow" aria-hidden="true">→</span>
          </Link>
        ))}
        <button
          type="button"
          className="featured-sector-card featured-sector-more has-coordinated-art"
          data-home-sector="more"
          aria-label="Ver más sectores"
          onClick={() => {
            playSonicCue("tap");
            openSectorsSheet();
          }}
        >
          <img src={coordinatedSectorArt.otros} alt="" loading="lazy" decoding="async" />
          <span className="featured-sector-shade" aria-hidden="true" />
          <span className="featured-sector-copy">
            <strong>Más sectores</strong>
            <small>Explorá todas las categorías AmarangoElectro.</small>
          </span>
          <span className="featured-sector-arrow" aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}
