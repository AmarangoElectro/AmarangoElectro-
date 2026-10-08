import {PLANS,planARS,type PlanId,type PlanPrice,type StoreData} from "./plans";

export type Diagnosis = {
 need:"sales"|"order"|"financing"|"support";
 tools:("store"|"installments"|"crm"|"brand"|"administration")[];
 monthly_sales:"starting"|"up_to_30"|"up_to_100"|"over_100";
 installments:"yes"|"want"|"no";
 budget:number|null;
 value:"simplicity"|"automation"|"control"|"support";
};
export type Recommendation={plan:PlanId;reason:string;budgetNote:string};
export function planValue(price?:PlanPrice,now=Date.now()){
 const promotionActive=!price?.promo_expires_at||Date.parse(price.promo_expires_at)>now;
 const current=promotionActive&&price?.promo_price!=null?price.promo_price:price?.monthly_price??null;
 const previous=promotionActive?(price?.previous_price??(price?.promo_price!=null?price.monthly_price:null)):null;
 const tools=price?.tool_values??[];
 const referenceTotal=tools.length&&tools.every(t=>t.reference_price!=null)?Math.round(tools.reduce((sum,t)=>sum+Number(t.reference_price),0)*100)/100:null;
 return {promotionActive,current,previous:previous!=null&&current!=null&&previous>current?previous:null,referenceTotal,tools};
}
export function recommend(d:Diagnosis,prices:PlanPrice[]=[]):Recommendation{
 let plan:PlanId="tienda",reason="Te recomendamos Tienda gratis para empezar con catálogo, contado, logo, colores y fotos propias, sin inversión inicial.";
 if(d.budget===0){reason="Te recomendamos Tienda gratis porque hoy querés empezar sin inversión. Podés sumar herramientas cuando tu negocio lo necesite."}
 else if(d.need==="support"||d.value==="support"){
  plan="premium";reason="Te recomendamos Premium 1 a 1 porque buscás acompañamiento cercano para configurar tu tienda, definir tu estrategia y adaptar las herramientas a tu negocio.";
 }else if(d.need==="order"||d.tools.includes("crm")||d.tools.includes("administration")||d.monthly_sales==="up_to_100"||d.monthly_sales==="over_100"||d.value==="control"){
  plan="gestion";reason="Te recomendamos Gestión porque necesitás organizar clientes y ventas y centralizar el seguimiento de tu negocio.";
 }else if(d.need==="financing"||d.installments!=="no"||d.tools.includes("installments")||d.value==="automation"){
  plan="cuotas";reason="Te recomendamos Cuotas para sumar financiación, calculadora y lectura de flyers con material adaptado a tu marca.";
 }
 const offer=prices.find(p=>p.id===plan),value=planValue(offer).current,price=planARS(value,offer);
 const budgetNote=plan==="tienda"?"Podés cambiar tu elección cuando lo necesites.":value==null?"El precio está a definir. Amarango confirmará el valor y el alcance antes de habilitar el nivel.":price==null?"El precio se expresa en dólares. El equivalente en pesos queda pendiente de la cotización de Propietarios.":d.budget!=null&&price>d.budget?"Este nivel supera el presupuesto que indicás. Podés empezar gratis o comparar otras opciones.":"La recomendación no genera un cobro ni cambia tu nivel.";
 return {plan,reason,budgetNote};
}
export type GrowthSuggestion={key:"financing"|"management"|"support"|"volume";plan:PlanId;message:string};
export function growthSuggestion(data:StoreData):GrowthSuggestion|null{
 const s=data.store;if(!s||s.status!=="active")return null;
 const d=s.diagnosis,interests=s.growth_interests??[],dismissed=s.growth_dismissed??[];
 const candidates:GrowthSuggestion[]=[];
 if(interests.includes("support")||d?.need==="support"||d?.value==="support")candidates.push({key:"support",plan:"premium",message:"Si necesitás estrategia, implementación o soporte cercano, Premium 1 a 1 puede acompañarte."});
 if((data.usage?.customers??0)>=30||(data.usage?.monthly_sales??0)>=30)candidates.push({key:"volume",plan:"gestion",message:"Tu negocio está creciendo. Gestión podría ahorrarte tiempo al organizar clientes y ventas."});
 if(interests.includes("management")||d?.need==="order"||d?.tools.some(t=>t==="crm"||t==="administration"))candidates.push({key:"management",plan:"gestion",message:"Para centralizar clientes y ventas, podés conocer las herramientas de Gestión."});
 if(interests.includes("financing")||d?.need==="financing"||(d&&d.installments!=="no")||d?.tools.includes("installments"))candidates.push({key:"financing",plan:"cuotas",message:"Si querés vender en cuotas, conocé la calculadora y las herramientas de financiación."});
 const order=PLANS.find(p=>p.id===s.plan)!.order;
 return candidates.find(c=>!dismissed.includes(c.key)&&PLANS.find(p=>p.id===c.plan)!.order>order&&c.plan!==s.requested_plan)??null;
}
