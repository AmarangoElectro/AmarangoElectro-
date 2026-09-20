import type { CSSProperties } from "react";
import Link from "./store-link";
import { emotionalRoutes } from "@/lib/theme/sector-theme";
import { getCategory } from "@/lib/catalog/categories";

/**
 * Capa de descubrimiento emocional recuperada de V86 (Emotional Mall /
 * Shopping Master Home). Es curaduría de navegación, no reemplaza la
 * taxonomía canónica: cada ruta enlaza directo a categorías reales de
 * `lib/catalog/categories.ts`. No inventa productos, precios ni datos.
 *
 * Deliberadamente NO es una pared de 26 banners: son 6 rutas curadas, cada
 * una con su propia identidad de color (Sector Theme), ubicadas como capa
 * de entrada entre el hero y la grilla exhaustiva de categorías.
 */
export function EmotionalRoutesRail() {
  return (
    <section className="emotional-routes" aria-labelledby="emotional-routes-title">
      <div className="section-intro split">
        <div>
          <p className="eyebrow orange">EXPLORÁ EL SHOPPING</p>
          <h2 id="emotional-routes-title">Elegí por lo que estás buscando.</h2>
        </div>
      </div>

      <div className="emotional-route-rail">
        {emotionalRoutes.map((route) => {
          const primarySlug = route.categorySlugs[0];
          const primaryCategory = primarySlug ? getCategory(primarySlug) : undefined;
          if (!primaryCategory) return null;
          return (
            <Link
              key={route.key}
              href={`/categoria/${primaryCategory.slug}`}
              className="emotional-route-chip-card"
              style={{ "--route-accent": route.accent } as CSSProperties}
            >
              <span className="emotional-route-chip-num">{route.numberLabel}</span>
              <strong>{route.title}</strong>
              <span className="emotional-route-chip-arrow" aria-hidden="true">Entrar →</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
