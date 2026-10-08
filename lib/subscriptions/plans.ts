export const PLAN_IDS = ["tienda", "cuotas", "gestion"] as const;
export type PlanId = typeof PLAN_IDS[number];
export const PLANS = [
  {id:"tienda" as const,name:"Tienda",order:1,limit:50,headline:"Empezá a mostrar y vender",features:["Catálogo y precios de contado","Nombre, logo y colores propios","Fotos y características editables","Enlace de tu tienda y contacto por WhatsApp"]},
  {id:"cuotas" as const,name:"Cuotas",order:2,limit:250,headline:"Sumá herramientas comerciales",features:["Todo lo de Tienda","Calculadora con reglas de tu negocio","Lectura de características del flyer","Flyers con tu marca, individual o por selección"]},
  {id:"gestion" as const,name:"Gestión",order:3,limit:1000,headline:"Ordená clientes y ventas",features:["Todo lo de Cuotas","CRM de tu propio negocio","Registro de ventas de contado","Historial y resumen comercial"]},
];
export function canUse(plan:PlanId,feature:"calculator"|"flyers"|"crm") { return feature==="crm" ? plan==="gestion" : plan==="cuotas"||plan==="gestion"; }
export const money = (value:number) => new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:2}).format(value);
export function installmentQuote(cash:number, installments:number, surcharge:number) {
  const total=Math.round(cash*(1+surcharge/100)*100)/100;
  const each=Math.round(total/installments*100)/100;
  const last=Math.round((total-each*(installments-1))*100)/100;
  return {total,each,last};
}
export type Store = {id:string;owner_site_user_id?:string;owner_email?:string;slug:string;name:string;plan:PlanId;requested_plan:PlanId;status:"pending"|"active"|"paused";primary_color:string;accent_color:string;logo_asset_id:string|null;whatsapp:string;published:boolean;financing:Record<string,number>;created_at:string};
export type StoreProduct = {id:string;store_id:string;name:string;cash_price:number;visible:boolean;asset_id:string|null;source_asset_id:string|null;features:string[];specifications:Record<string,string>};
export type StoreCustomer = {id:string;name:string;phone:string;notes:string};
export type StoreSale = {id:string;customer_id:string;product_id:string;snapshot:{customer:string;product:string};total:number;created_at:string};
export type PlanPrice = {id:PlanId;monthly_price:number|null;setup_price:number|null};
export type StoreData = {store:Store|null;products:StoreProduct[];customers:StoreCustomer[];sales:StoreSale[];plans:PlanPrice[]};
export const assetUrl=(storeId:string,assetId:string)=>`/api/v16/store-asset/${storeId}/${assetId}`;
