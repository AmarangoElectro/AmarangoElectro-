"use client";
import {useState,type ReactElement} from "react";
import {Dialog} from "radix-ui";
import type {Product,FinancingOption} from "@/lib/catalog/types";
import {useStorefrontFinancing} from "@/lib/commerce/use-storefront-financing";
import {numericPlans,formatStorefrontPlan} from "@/lib/commerce/storefront-financing";

export function InstallmentCalculatorDetails({plans,count,onCount,cash,loading}:{plans:readonly FinancingOption[];count:number;onCount:(count:number)=>void;cash:string|null;loading:boolean}) {
  const options=numericPlans(plans).sort((a,b)=>a.installments-b.installments);
  const selected=options.find(plan=>plan.installments===count)??options.at(-1);
  return <>{options.length?<><div className="product-calculator-options" role="group" aria-label="Cantidad de cuotas">{options.map(plan=><button type="button" key={plan.installments} aria-pressed={selected?.installments===plan.installments} onClick={()=>onCount(plan.installments)}>{plan.installments} cuotas</button>)}</div><p className="product-calculator-result"><strong>{selected&&formatStorefrontPlan(selected)}</strong></p><p>Cuotas orientativas; confirmá la cotización con Amarango.</p></>:<p role="status">{loading?"Consultando cuotas…":"Consultá con Amarango las opciones disponibles."}</p>}{cash&&<p className="product-calculator-cash">Contado: {cash}</p>}</>;
}

/** Public commercial view: only already-authorized installment amounts. Never receives costs. */
export function ProductInstallmentCalculator({product,trigger}:{product:Product;trigger?:ReactElement}) {
  const [open,setOpen]=useState(false),[count,setCount]=useState(6);
  const financing=useStorefrontFinancing([product],open);
  const plans=numericPlans(financing.data[product.id]?.length?financing.data[product.id]:product.financing).sort((a,b)=>a.installments-b.installments);
  const cash=product.price?new Intl.NumberFormat("es-AR",{style:"currency",currency:product.price.currency,maximumFractionDigits:2}).format(product.price.amount):null;
  return <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger asChild>{trigger??<button type="button" className="product-calculator-trigger">Calculadora AmarangoElectro</button>}</Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="amarango-dialog-overlay"/><Dialog.Content className="amarango-reason-dialog product-installment-calculator"><small>AMARANGOELECTRO</small><Dialog.Title>Calculadora de cuotas</Dialog.Title><Dialog.Description>{product.name}. Elegí una opción para ver su importe y total.</Dialog.Description><InstallmentCalculatorDetails plans={plans} count={count} onCount={setCount} cash={cash} loading={financing.loading}/><div className="amarango-reason-actions"><Dialog.Close>Volver al producto</Dialog.Close></div></Dialog.Content></Dialog.Portal></Dialog.Root>;
}
