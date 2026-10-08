"use client";
import {Box,CreditCard,Paintbrush,Image as ImageIcon,ScanText,Users,BarChart3,Headphones,Settings2,TrendingUp,Layers,Gift,Tag,Crown,Star} from "lucide-react";
import {PLANS,planMoney,planARS,type PlanId,type PlanPrice,type ToolValue} from "@/lib/subscriptions/plans";
import {planValue} from "@/lib/subscriptions/guidance";

const summaries:Record<PlanId,{title:string;subtitle:string;tools:string[];inherits?:string}>={
 tienda:{title:"Tienda gratis",subtitle:"Ideal para empezar sin costo.",tools:["Catálogo","Contado","Logo y colores","Fotos manuales"]},
 cuotas:{title:"Cuotas",subtitle:"Herramientas comerciales para vender más.",inherits:"Incluye Tienda gratis",tools:["Calculadora de cuotas","Lectura de flyers","Fotos con tu marca","Financiación"]},
 gestion:{title:"Gestión",subtitle:"Controlá tu negocio con más orden.",inherits:"Incluye Cuotas",tools:["CRM propio","Clientes","Historial de ventas","Resumen comercial"]},
 premium:{title:"Premium 1 a 1",subtitle:"Acompañamiento personalizado para crecer.",inherits:"Incluye Gestión",tools:["Soporte 1 a 1","Configuración personalizada","Estrategia comercial","Seguimiento cercano"]},
};
function toolIcon(name:string){
 if(/logo|color|marca/i.test(name))return Paintbrush;
 if(/foto|imagen/i.test(name))return ImageIcon;
 if(/flyer|lectura/i.test(name))return ScanText;
 if(/cliente/i.test(name))return Users;
 if(/historial|crm|resumen|seguimiento/i.test(name))return BarChart3;
 if(/soporte|acompañamiento/i.test(name))return Headphones;
 if(/estrategia/i.test(name))return TrendingUp;
 if(/configura|administración/i.test(name))return Settings2;
 if(/cuota|financia|contado/i.test(name))return CreditCard;
 if(/catálogo|tienda/i.test(name))return Box;
 return Layers;
}
export function PlanCards({prices=[],selected,onChoose,disabled=false}:{prices?:PlanPrice[];selected?:PlanId;onChoose?:(id:PlanId)=>void;disabled?:boolean}){
 return <><p className="plan-currency-note">Valores de referencia en USD y equivalente en pesos según la cotización de Propietarios. Solicitá el nivel y coordiná el cierre en privado. La app no cobra.</p><div className="subscription-plans">{PLANS.map(p=>{
  const price=prices.find(x=>x.id===p.id),v=planValue(price),copy=summaries[p.id],free=p.id==="tienda";
  const rows:ToolValue[]=!free&&v.tools.length?v.tools:copy.tools.map(name=>({name,reference_price:null,promo_price:null}));
  const FooterIcon=free?Gift:p.id==="cuotas"?Tag:p.id==="gestion"?Crown:Star;
  const promo=v.promotionActive&&price?.promo_price!=null;
  return <article key={p.id} className={`${selected===p.id?"selected ":""}${p.id==="premium"?"premium-plan":""}`}>
   <header className="plan-heading"><span className="plan-number" aria-label={`Nivel ${p.order}`}>{p.order}</span><div><h3>{copy.title}</h3><p>{copy.subtitle}</p></div>{selected===p.id&&<span className="plan-selected-label">Elegido</span>}</header>
   {copy.inherits&&<p className="plan-inherits">{copy.inherits}</p>}
   <div className="plan-tools-grid">{rows.map((t,i)=>{
    const Icon=toolIcon(t.name),discount=v.promotionActive&&t.promo_price!=null&&t.reference_price!=null&&t.promo_price<t.reference_price;
    return <div className={`plan-tool-value ${i%3===0?"orange-icon":""}`} key={i}><Icon aria-hidden="true" size={20}/><span className="plan-tool-name">{t.name}</span><span className={`plan-tool-price ${free||discount?"highlight-value":""}`}>{free?<b>Gratis</b>:discount?<><del>{planMoney(t.reference_price!,price)}</del><b>{planMoney(t.promo_price!,price)}</b></>:t.reference_price==null?<span>A definir</span>:<b>{planMoney(t.reference_price,price)}</b>}{!free&&price?.price_currency==="USD"&&(discount?t.promo_price:t.reference_price)!=null&&<small className="plan-tool-peso">{planARS(discount?t.promo_price:t.reference_price,price)==null?"Pesos: a definir":`ARS ${new Intl.NumberFormat("es-AR",{maximumFractionDigits:2}).format(planARS(discount?t.promo_price:t.reference_price,price)!)}`}</small>}</span></div>
   })}</div>
   <div className={`plan-level-value ${free?"free-level-value":""}`}><FooterIcon aria-hidden="true" size={26}/><div><strong>{free?"Empezá hoy sin inversión inicial.":v.promotionActive&&price?.promo_text?price.promo_text:p.id==="premium"?"Acompañamiento personalizado":promo?"Promoción del nivel":"Valor del nivel"}</strong>{!free&&<p>{promo?"Hoy":"Nivel completo"}: <b>{v.current==null?"A definir":`${planMoney(v.current,price)}/mes`}</b></p>}{!free&&price?.price_currency==="USD"&&<small className="plan-peso-equivalent">{planARS(v.current,price)==null?"Equivalente en pesos: a definir":`Equivalente: ARS ${new Intl.NumberFormat("es-AR",{maximumFractionDigits:2}).format(planARS(v.current,price)!)}/mes`}</small>}</div>{!free&&v.previous!=null&&<del className="plan-previous-price">{planMoney(v.previous,price)}/mes</del>}</div>
   {!free&&<div className="plan-value-footnote"><span>{p.id==="premium"?"Valor estimado del servicio":"Valor de las herramientas"}: <b>{v.referenceTotal==null?"A definir":planMoney(v.referenceTotal,price)}</b></span>{price?.setup_price!=null&&<span>{p.id==="premium"?"Implementación":"Alta"}: {planMoney(price.setup_price,price)}</span>}{v.promotionActive&&price?.promo_expires_at&&<span>Vigencia hasta {new Date(price.promo_expires_at).toLocaleString("es-AR",{timeZone:"America/Argentina/Buenos_Aires"})} (hora argentina).</span>}</div>}
   <div className="plan-bottom"><details className="plan-inclusions"><summary>Ver qué incluye</summary><ul>{p.features.map(f=><li key={f}>{f}</li>)}</ul>{free?<p>Sin cuota mensual ni costo de alta.</p>:null}{p.upcoming.length>0&&<p className="muted">Próximas etapas: {p.upcoming.join(" · ")}.</p>}{p.id==="premium"?<p className="muted">Servicio humano: alcance, dedicación y tiempos acordados con Amarango. Mayor personalización, mayor inversión.</p>:<p className="muted">Hasta {p.limit} productos.</p>}</details>{onChoose&&<button disabled={disabled||selected===p.id} onClick={()=>onChoose(p.id)}>{selected===p.id?"Nivel seleccionado":free?"Empezar gratis":p.id==="premium"?"Solicitar acompañamiento":`Solicitar ${p.name}`}</button>}</div>
  </article>
 })}</div></>
}
export async function changeStore(action:string,payload:unknown){
 const response=await fetch("/api/v16/stores",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,payload})});const data=await response.json();if(!response.ok)throw Object.assign(new Error(errorMessage(data.error)),{code:data.error});return data;
}
export function errorMessage(error:string){return ({forbidden:"Tu cuenta no tiene permiso para este cambio.",inactive:"La tienda necesita habilitación de Amarango.",locked:"Esta herramienta requiere otro nivel.",limit:"Llegaste al límite de productos del nivel.",slug_taken:"Ese enlace ya está usado. Elegí otro.",exists:"Tu cuenta ya tiene una tienda.",not_found:"No encontramos ese registro en tu tienda.",unauthenticated:"Ingresá con tu cuenta de ChatGPT para continuar.",price_changed:"El precio o la cotización cambió. Revisá el resumen actualizado antes de solicitar.",invalid:"Revisá los campos antes de guardar."} as Record<string,string>)[error]??"No se pudo guardar. Tus datos siguen en el formulario."}
