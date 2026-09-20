import type { Product } from "@/lib/catalog";

export function ProductDecisionDetails({ product }: { product: Product }) {
  const specifications = Object.entries(product.specifications);

  return (
    <section className="product-decision-section" aria-labelledby="product-decision-title">
      <div className="product-decision-heading">
        <p className="eyebrow orange">TODO LO IMPORTANTE, SIN RUIDO</p>
        <h2 id="product-decision-title">Información para decidir mejor.</h2>
        <p>La ficha prioriza datos verificables y evita pestañas ocultas o información inventada.</p>
      </div>
      <div className="product-decision-accordion">
        <details open>
          <summary><span>01</span><strong>Características principales</strong><i>+</i></summary>
          <div className="product-decision-content">
            {product.features.length ? (
              <ul>{product.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
            ) : (
              <p>Las características se mostrarán cuando estén disponibles en el catálogo oficial.</p>
            )}
          </div>
        </details>
        <details>
          <summary><span>02</span><strong>Especificaciones</strong><i>+</i></summary>
          <div className="product-decision-content">
            {specifications.length ? (
              <dl className="product-spec-table">
                {specifications.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
              </dl>
            ) : (
              <p>Las especificaciones técnicas completas quedan pendientes de la fuente oficial validada.</p>
            )}
          </div>
        </details>
        <details>
          <summary><span>03</span><strong>Compra, disponibilidad y respaldo</strong><i>+</i></summary>
          <div className="product-decision-content product-decision-commerce">
            <div><small>DISPONIBILIDAD</small><strong>{product.stock.label ?? "A confirmar"}</strong></div>
            <div><small>GARANTÍA</small><strong>{product.warranty ?? "A confirmar"}</strong></div>
            <div><small>FINANCIACIÓN</small><strong>{product.financing[0]?.label ?? "A confirmar"}</strong></div>
          </div>
        </details>
      </div>
    </section>
  );
}
