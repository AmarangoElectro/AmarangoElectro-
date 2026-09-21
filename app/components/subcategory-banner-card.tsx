import Image from "next/image";
import Link from "./store-link";
import type { SubcategoryDefinition } from "@/lib/catalog/categories";
import { retailCategories } from "@/lib/catalog/retail-categories";
import { getBrandCampaignArtwork } from "./brand-campaign-banner";

interface Props {
  categorySlug: string;
  categoryTitle: string;
  subcategory: SubcategoryDefinition;
  index: number;
}

export function SubcategoryBannerCard({ categorySlug, categoryTitle, subcategory, index }: Props) {
  const brandArtwork = subcategory.brand ? getBrandCampaignArtwork(subcategory.brand) : null;
  const retailArtworkAliases: Record<string, string> = {
    "colchones-y-sommiers": "colchones-sommiers",
    "cargadores-y-accesorios": "cargadores-accesorios",
    "hogar-y-deco": "hogar-decoracion",
    "bazar-y-mesa": "hogar-decoracion",
    "camping-y-aire-libre": "deporte-movilidad",
    "auto-y-motos": "auto-motos",
    energia: "auto-motos",
    juguetes: "bebes",
    "parlantes-portatiles": "audio",
    torres: "audio",
    "barras-de-sonido": "audio",
    auriculares: "audio",
    "home-audio": "audio",
  };
  const retailArtwork = retailCategories.find((item) => item.id === (retailArtworkAliases[subcategory.slug] ?? subcategory.slug))?.image;
  const artwork = retailArtwork ?? subcategory.image;
  const hasEditorialBanner = !retailArtwork && Boolean(subcategory.image?.startsWith("/assets/banners/subcategories/"));
  const showEditorialLogo = hasEditorialBanner && categorySlug !== "herramientas";
  const href = subcategory.brand
    ? `/categoria/${categorySlug}?marca=${encodeURIComponent(subcategory.brand)}#catalogo`
    : `/categoria/${categorySlug}?sector=${encodeURIComponent(subcategory.slug)}#sector-activo`;

  if (subcategory.brand && brandArtwork) {
    return (
      <Link className="subcategory-brand-campaign" href={href} aria-label={`Explorar ${subcategory.title}`}>
        <Image className="subcategory-brand-campaign-art subcategory-brand-campaign-art-light" src={brandArtwork.light} alt={`Banner ${brandArtwork.label}`} fill sizes="(max-width: 760px) 100vw, 50vw" unoptimized />
        <Image className="subcategory-brand-campaign-art subcategory-brand-campaign-art-dark" src={brandArtwork.dark} alt={`Banner ${brandArtwork.label} en modo oscuro`} fill sizes="(max-width: 760px) 100vw, 50vw" unoptimized />
      </Link>
    );
  }

  if (subcategory.brand) {
    return (
      <Link className="subcategory-brand-missing" href={href} aria-label={`Banner pendiente para ${subcategory.title}`}>
        <span className="subcategory-brand-missing-mark" aria-hidden="true">×</span>
        <span><small>BANNER PENDIENTE</small><strong>{subcategory.title}</strong><b>Reemplazar cuando llegue el arte</b></span>
      </Link>
    );
  }

  return (
    <Link
      className={`subcategory-banner subcategory-banner-${subcategory.slug}${hasEditorialBanner ? " subcategory-banner-editorial" : ""}`}
      href={href}
      aria-label={`Entrar a ${categoryTitle} / ${subcategory.title}`}
    >
      {artwork ? (
        <Image
          src={artwork}
          alt={`${subcategory.title} — ${categoryTitle}`}
          fill
          sizes="(max-width: 760px) 100vw, (max-width: 1200px) 50vw, 50vw"
          unoptimized
        />
      ) : (
        <span className="subcategory-banner-art" aria-hidden="true">
          <i>{subcategory.icon}</i>
          <span />
        </span>
      )}

      {hasEditorialBanner ? (
        <>
          {showEditorialLogo ? (
            <span className="subcategory-banner-logo-patch" aria-hidden="true">
              <Image src="/logo-320.webp" alt="" fill sizes="150px" unoptimized />
              <i className="subcategory-logo-bee" aria-hidden="true">🐝</i>
            </span>
          ) : null}
          <span className="subcategory-banner-enter">Entrar al sector <b aria-hidden="true">→</b></span>
        </>
      ) : (
        <>
          <span className="subcategory-banner-shade" />
          <span className="subcategory-banner-index">{String(index + 1).padStart(2, "0")}</span>
          <span className="subcategory-banner-copy">
            <small>{categoryTitle}</small>
            <strong>{subcategory.title}</strong>
            <span>{subcategory.description}</span>
            <b>{subcategory.brand ? "Ver línea" : "Entrar al sector"} <span aria-hidden="true">→</span></b>
          </span>
        </>
      )}
    </Link>
  );
}
