"use client";
import type { Product } from "@/lib/catalog";
import {useProductFlyerFacts} from "@/lib/photo-intelligence/use-product-flyer-facts";
import {technicalSpecifications} from "@/lib/photo-intelligence/flyer-text";
import {useStorefrontFinancing} from "@/lib/commerce/use-storefront-financing";
import {numericPlans,formatStorefrontPlan} from "@/lib/commerce/storefront-financing";

export function ProductDecisionDetails({ product: original }: { product: Product }) {
  const {products,reading}=useProductFlyerFacts([original]);
  const product=products[0];
  const specifications = Object.entries(technicalSpecifications(product.specifications));
  const financing=useStorefrontFinancing([original]);
  const plans=numericPlans(financing.data[original.id]?.length?financing.data[original.id]:original.financing);

  return (
    <section className="product-decision-section" aria-labelledby="product-decision-title">
      <div className="product-decision-heading">
        <p className="eyebrow orange">TODO LO IMPORTANTE, SIN RUIDO</p>
        <h2 id="product-decision-title">Información para decidir mejor.</h2>
        <p>Características del catálogo y datos legibles del flyer del producto.</p>
        {reading&&<small role="status">Leyendo características de la foto…</small>}
      </div>
      <div className="product-decision-accordion">
        {product.features.length>0&&<details open>
          <summary><span>01</span><strong>Características principales</strong><i>+</i></summary>
          <div className="product-decision-content">
              <ul>{product.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
          </div>
        </details>}
        {specifications.length>0&&<details open>
          <summary><span>02</span><strong>Especificaciones</strong><i>+</i></summary>
          <div className="product-decision-content">
              <dl className="product-spec-table">
                {specifications.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
              </dl>
          </div>
        </details>}
        <details>
          <summary><span>03</span><strong>Compra, disponibilidad y respaldo</strong><i>+</i></summary>
          <div className="product-decision-content product-decision-commerce">
            <div><small>DISPONIBILIDAD</small><strong>{product.stock.label ?? "A confirmar"}</strong></div>
            <div><small>GARANTÍA</small><strong>{product.warranty ?? "A confirmar"}</strong></div>
            <div><small>FINANCIACIÓN</small>{plans.length?<><ul className="product-decision-financing-options">{plans.map(plan=><li key={plan.installments}>{formatStorefrontPlan(plan)}</li>)}</ul><small>Cuotas orientativas; confirmá la cotización.</small></>:<strong>{financing.loading?"Consultando cuotas…":"Consultá las opciones de cuotas"}</strong>}</div>
          </div>
        </details>
      </div>
    </section>
  );
}
