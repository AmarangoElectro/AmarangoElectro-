import {TrendingUp} from "lucide-react";
export function SubscriptionIntro({owner=false}:{owner?:boolean}){
 return <header className="subscription-intro subscription-commercial-intro"><div className="subscription-commercial-copy"><small>SUSCRIPTORES</small><h1>Elegí cómo potenciar<br/>tu negocio</h1><p>{owner?"Mostrá el valor de cada herramienta y destacá promociones por nivel.":"Empezá gratis y sumá las herramientas que tu negocio necesita para crecer."}</p></div><div className="subscription-growth-art" aria-hidden="true"><div className="growth-art-panel growth-art-back"/><div className="growth-art-panel growth-art-front"><span/><span/><span/><span/></div><TrendingUp strokeWidth={2.2}/></div></header>
}
