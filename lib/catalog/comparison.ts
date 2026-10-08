import type { Product } from "./types";
import { technicalSpecifications } from "../photo-intelligence/flyer-text";

export interface ComparisonRow {
  id: string;
  label: string;
  values: string[];
  differs: boolean;
}

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

function text(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized || "A confirmar";
}

function uniqueFeatures(product: Product) {
  const own=[...product.features,...Object.entries(technicalSpecifications(product.specifications)).map(([key,value])=>`${key}: ${value}`)];
  return [...new Set(own.map((feature) => feature.trim()).filter(Boolean))].slice(0,5).join("\n") || "Sin características legibles";
}

export function commonSpecificationKeys(products:readonly Pick<Product,"specifications">[]){
  if(products.length<2)return [];
  const specs=products.map(p=>technicalSpecifications(p.specifications));
  const priority=["Almacenamiento","RAM","Pantalla","Resolución","Procesador","Cámara","Batería","Capacidad","Potencia","Velocidad","Funciones","Conectividad","Temperatura","Temporizador"];
  return Object.keys(specs[0]).filter(key=>specs.every(s=>Boolean(s[key]?.trim()))).sort((a,b)=>{
    const ai=priority.indexOf(a),bi=priority.indexOf(b);
    return (ai<0?100:ai)-(bi<0?100:bi)||a.localeCompare(b,"es");
  }).slice(0,5);
}

function createRow(id: string, label: string, values: string[]): ComparisonRow {
  const normalized = values.map((value) => value.trim().toLocaleLowerCase("es-AR"));
  return { id, label, values, differs: new Set(normalized).size > 1 };
}

export function buildComparisonRows(products: readonly Product[]): ComparisonRow[] {
  if (products.length < 2) return [];

  const baseRows = [
    createRow("brand", "Marca", products.map((product) => text(product.brand))),
    createRow("model", "Modelo", products.map((product) => text(product.model))),
    createRow("price", "Contado", products.map((product) => product.price ? money.format(product.price.amount) : "A confirmar")),
    createRow("availability", "Disponibilidad", products.map((product) => text(product.stock.label))),
    createRow("warranty", "Garantía", products.map((product) => text(product.warranty))),
    ...(products.some(p=>p.features.length||Object.keys(technicalSpecifications(p.specifications)).length)?[createRow("features", "Características de cada producto", products.map(uniqueFeatures))]:[]),
  ];

  const specificationKeys = commonSpecificationKeys(products);
  const specificationRows = specificationKeys.map((key) =>
    createRow(`spec:${key}`, key, products.map((product) => text(technicalSpecifications(product.specifications)[key]))),
  );

  const installmentCounts = [...new Set([2,3,4,6,...products.flatMap(product=>product.financing.map(plan=>plan.installments))])].sort((a,b)=>a-b);
  const financingRows = installmentCounts.map(count=>createRow(`financing:${count}`,`${count} cuotas`,products.map(product=>{
    const plan = product.financing.find(option=>option.installments===count);
    return plan?.installmentAmount ? `${count} × ${money.format(plan.installmentAmount.amount)}` : text(plan?.label);
  })));
  return [...baseRows, ...financingRows, ...specificationRows];
}
