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
  const baseRows=[
    createRow("price","Contado",products.map(product=>product.price&&Number.isFinite(product.price.amount)&&product.price.amount>0?money.format(product.price.amount):unknown)),
  ].filter(row=>row.values.some(value=>value!==unknown));
  const counts=[...new Set(products.flatMap(product=>product.financing.filter(plan=>Number.isInteger(plan.installments)&&plan.installments>0&&Number.isFinite(plan.installmentAmount?.amount)&&plan.installmentAmount!.amount>0).map(plan=>plan.installments)))].sort((a,b)=>a-b);
  const financingRows=counts.map(count=>createRow(`financing:${count}`,`${count} cuotas`,products.map(product=>{
    const plan=product.financing.find(option=>option.installments===count&&Number.isFinite(option.installmentAmount?.amount)&&option.installmentAmount!.amount>0);
    if(!plan?.installmentAmount)return unknown;
    const total=plan.totalAmount?.amount;
    const hasTotal=typeof total==="number"&&Number.isFinite(total)&&total>0;
    const last=hasTotal?Math.round((total-plan.installmentAmount.amount*(count-1))*100)/100:null;
    return `${count} × ${money.format(plan.installmentAmount.amount)}${last!==null&&last>0&&last!==plan.installmentAmount.amount?` · Última ${money.format(last)}`:""}${hasTotal?` · Total ${money.format(total)}`:""}`;
  })));
  return [...baseRows,...financingRows];
}
