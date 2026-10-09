"use client";
import type {Product} from "@/lib/catalog";
import {useStorefrontFinancing} from "@/lib/commerce/use-storefront-financing";
import {numericPlans,formatStorefrontPlan} from "@/lib/commerce/storefront-financing";
import {ProductInstallmentCalculator} from "./product-installment-calculator";

/** Reuses the existing financing information article; no separate calculator or policy. */
export function ProductFinancingSummary({product}:{product:Product}) {
  const financing=useStorefrontFinancing([product]);
  const plans=numericPlans(financing.data[product.id]?.length?financing.data[product.id]:product.financing);
  const featured=plans.find(plan=>plan.installments===6)??plans.at(-1);
  return <article><span aria-hidden="true">▣</span><div><h2>Financiación clara</h2>{featured?<><p><strong>{formatStorefrontPlan(featured)}</strong></p><p>Cuotas orientativas; confirmá la cotización. Todas las opciones están en Compra, disponibilidad y respaldo.</p></>:<p role="status">{financing.loading?"Consultando cuotas…":"Consultá las opciones de pago disponibles para este producto."}</p>}<ProductInstallmentCalculator product={product}/></div></article>;
}
