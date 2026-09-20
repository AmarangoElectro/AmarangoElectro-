import Image from "next/image";
import Link from "./store-link";
import type { SubcategoryDefinition } from "@/lib/catalog/categories";

interface Props {
  categorySlug: string;
  categoryTitle: string;
  subcategory: SubcategoryDefinition;
}

export function SubcategorySectorHero({ categorySlug, categoryTitle, subcategory }: Props) {
  return (
    <section
      id="sector-activo"
      className={`subcategory-sector-hero${subcategory.image ? " has-editorial-art" : " has-prepared-art"}`}
      aria-label={`${categoryTitle} / ${subcategory.title}`}
      data-image-status={subcategory.imageStatus}
    >
      {subcategory.image ? (
        <Image
          src={subcategory.image}
          alt={`${subcategory.title} — ${categoryTitle}`}
          fill
          sizes="(max-width: 760px) 100vw, 92vw"
          unoptimized
        />
      ) : (
        <span className="subcategory-sector-prepared-art" aria-hidden="true">
          <i>{subcategory.icon}</i>
          <small>{categoryTitle}</small>
          <strong>{subcategory.title}</strong>
          <span>{subcategory.description}</span>
        </span>
      )}
      <span className="subcategory-sector-logo-patch" aria-hidden="true">
        <Image src="/logo-320.webp" alt="" fill sizes="190px" unoptimized />
        <i className="subcategory-logo-bee" aria-hidden="true">🐝</i>
      </span>
      <div className="subcategory-sector-actions">
        <Link href={`/categoria/${categorySlug}#subcategories-title`}>← Volver a {categoryTitle}</Link>
        <span>{subcategory.title}</span>
      </div>
    </section>
  );
}
