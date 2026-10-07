"use client";
import { useEffect,useState } from "react";
type Subscription = {email:string;active:boolean;consented_at:string|null;updated_at:string};
export function Newsletter({admin=false}:{admin?:boolean}) {
  const [rows,setRows]=useState<Subscription[]>([]),[email,setEmail]=useState(""),[consent,setConsent]=useState(false),[active,setActive]=useState(false),[message,setMessage]=useState(""),[busy,setBusy]=useState(false),[signedIn,setSignedIn]=useState(true);
  useEffect(()=>{let alive=true;fetch(`/api/v16/newsletter${admin?"?admin=1":""}`,{cache:"no-store"}).then(async r=>{if(!alive)return;if(r.status===401){setSignedIn(false);return}const body=await r.json();if(body.status!=="ok"){setMessage("No pudimos cargar las suscripciones.");return}setRows(body.data);setEmail(body.email??"");setActive(Boolean(body.data[0]?.active));}).catch(()=>{if(alive)setMessage("No pudimos cargar las suscripciones.")});return()=>{alive=false}},[admin]);
  async function save(next:boolean){setBusy(true);setMessage("");try{const r=await fetch("/api/v16/newsletter",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({consent:next})});if(!r.ok)throw new Error();setActive(next);setConsent(false);setMessage(next?"Tu suscripción a novedades está activa.":"Dejaste de recibir novedades.");}catch{setMessage("No se guardó el cambio. Volvé a intentarlo.")}finally{setBusy(false)}}
  return <section className="newsletter"><h2>{admin?"Suscriptores a novedades":"Ofertas y novedades de Amarango"}</h2>
    {admin?<><p>{rows.filter(row=>row.active).length} suscripciones activas en esta vista</p>{rows.length?<ul>{rows.map(row=><li key={row.email}><strong>{row.email}</strong><span>{row.active?"Activa":"De baja"} · {new Date(row.updated_at).toLocaleDateString("es-AR")}</span></li>)}</ul>:<p>Todavía no hay altas registradas.</p>}</>:
    !signedIn?<a href="/signin-with-chatgpt?return_to=%2F%23novedades" target="_top">Entrar para suscribirme</a>:
    active?<><p>Recibirás novedades en {email}.</p><button disabled={busy} onClick={()=>save(false)}>Dar de baja mi suscripción</button></>:
    <><p>Usaremos el correo de tu cuenta: {email||"cargando…"}.</p><label><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/> Quiero recibir ofertas y novedades. Puedo darme de baja acá cuando quiera.</label><button disabled={!consent||busy||!email} onClick={()=>save(true)}>{busy?"Guardando…":"Suscribirme"}</button></>}
    {message&&<p role="status">{message}</p>}
  </section>;
}
