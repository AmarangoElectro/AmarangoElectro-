import type { CSSProperties } from "react";
import Link from "./store-link";

const brands = ["Esmeralda Home", "Kavanag", "Estelar", "Piero", "Dubeflex", "Suavestar", "Cannon"] as const;

export function DescansoBrandGallery() {
  return (
    <section className="descanso-brand-gallery" aria-labelledby="descanso-brand-gallery-title">
      <div className="descanso-brand-gallery-heading">
        <div>
          <p className="eyebrow orange">MARCAS DE DESCANSO</p>
          <h2 id="descanso-brand-gallery-title">Elegí tu forma de descansar.</h2>
        </div>
        <p>Cada banner se adapta automáticamente al modo claro u oscuro.</p>
      </div>
      <div className="descanso-brand-gallery-grid">
        {brands.map((brand, index) => (
          <Link
            key={brand}
            href={`/categoria/descanso?marca=${encodeURIComponent(brand)}#catalogo`}
            className="descanso-brand-banner"
            aria-label={`Explorar productos ${brand}`}
          >
            <span
              className="descanso-brand-sheet-crop"
              aria-hidden="true"
              style={{ "--brand-row": `${index * (100 / (brands.length - 1))}%` } as CSSProperties}
            />
            <span className="sr-only">{brand}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
