import type { Product } from "./types";
import { presentableProductFacts } from "../photo-intelligence/product-facts";

export interface ComparisonRow {
  id: string;
  label: string;
  values: string[];
  items?: string[][];
  differs: boolean;
}
const money=new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0});
const unknown="A confirmar";
const known=(value:string|null|undefined)=>Boolean(value?.trim()&&!/^(?:a confirmar|desconocido|unknown|no disponible)$/i.test(value.trim()));
function text(value:string|null|undefined){return known(value)?value!.trim():unknown;}
function facts(product:Pick<Product,"specifications">&Partial<Pick<Product,"name"|"features">>){
  return presentableProductFacts({name:product.name??"",features:product.features??[],specifications:product.specifications});
}
export function commonSpecificationKeys(products:readonly (Pick<Product,"specifications">&Partial<Pick<Product,"name"|"features">>)[]){
  if(products.length<2)return [];
  const specs=products.map(product=>facts(product).specifications);
  const priority=["Almacenamiento","RAM","Pantalla","Resolución","Procesador","Cámara","Batería","Capacidad","Potencia","Velocidad","Funciones","Conectividad","Temperatura","Temporizador"];
  return Object.keys(specs[0]).filter(key=>key!=="Colores"&&specs.every(s=>Boolean(s[key]?.trim()))).sort((a,b)=>{
    const ai=priority.indexOf(a),bi=priority.indexOf(b);
    return (ai<0?100:ai)-(bi<0?100:bi)||a.localeCompare(b,"es");
  }).slice(0,5);
}
function createRow(id:string,label:string,values:string[]):ComparisonRow{
  return {id,label,values,differs:new Set(values.map(value=>value.trim().toLocaleLowerCase("es-AR"))).size>1};
}
export function buildComparisonRows(products:readonly Product[]):ComparisonRow[]{
  if(products.length<2)return [];
  const documented=products.map(product=>({...product,...facts(product)}));
  const baseRows=[
    createRow("brand","Marca",products.map(product=>text(product.brand))),
    createRow("model","Modelo",products.map(product=>text(product.model))),
    createRow("price","Contado",products.map(product=>product.price&&Number.isFinite(product.price.amount)&&product.price.amount>0?money.format(product.price.amount):unknown)),
    createRow("availability","Disponibilidad",products.map(product=>text(product.stock.label))),
    createRow("warranty","Garantía",products.map(product=>text(product.warranty))),
    createRow("colors","Colores",documented.map(product=>text(product.specifications.Colores))),
  ].filter(row=>row.values.some(value=>value!==unknown));
  const keys=commonSpecificationKeys(documented);
  const specificationRows=keys.map(key=>createRow(`spec:${key}`,key,documented.map(product=>product.specifications[key])));
  const items=documented.map(product=>Object.entries(product.specifications).filter(([key])=>key!=="Colores"&&!keys.includes(key)).slice(0,5).map(([key,value])=>`${key}: ${value}`));
  const ownRows:ComparisonRow[]=items.some(list=>list.length)?[{...createRow("features","Características de cada producto",items.map(list=>list.join("\n"))),items}]:[];
  const counts=[...new Set(products.flatMap(product=>product.financing.filter(plan=>Number.isFinite(plan.installmentAmount?.amount)&&plan.installmentAmount!.amount>0).map(plan=>plan.installments)))].sort((a,b)=>a-b);
  const financingRows=counts.map(count=>createRow(`financing:${count}`,`${count} cuotas`,products.map(product=>{
    const plan=product.financing.find(option=>option.installments===count&&Number.isFinite(option.installmentAmount?.amount)&&option.installmentAmount!.amount>0);
    return plan?.installmentAmount?`${count} × ${money.format(plan.installmentAmount.amount)}`:unknown;
  })));
  return [...baseRows,...financingRows,...specificationRows,...ownRows];
}
