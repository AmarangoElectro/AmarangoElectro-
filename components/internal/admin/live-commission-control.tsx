'use client';
import {useEffect,useState} from 'react';
import {useLiveCommissions} from '@/lib/advisor-compensation/use-live-commissions';
import {liveAdvisorMonth} from '@/lib/advisor-compensation/live-model';
import {AdvisorCompensationAdminPanel} from './advisor-compensation-admin-panel';
const money=(v:number|null|undefined)=>typeof v!=='number'||!Number.isFinite(v)?'A confirmar':`$${v.toLocaleString('es-AR',{maximumFractionDigits:2})}`;
export function LiveCommissionControl(){
 const live=useLiveCommissions(),[cap,setCap]=useState(''),[enabled,setEnabled]=useState(false);
 const [dirty,setDirty]=useState(false),[revision,setRevision]=useState<number|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const data=live.status==='ok'?live.data:null;
 useEffect(()=>{if(data&&!dirty){setCap(data.cap===null?'':String(data.cap));setEnabled(data.cap!==null);setRevision(data.revision)}},[data?.revision,data?.cap,dirty]);
 const ids=[...new Set(data?.operations.map(op=>op.advisorId)??[])];
 const proposed=Number(cap),valid=cap.trim()&&Number.isFinite(proposed)&&proposed>=0&&proposed<=100000000;
 async function save(){
  if(!data?.policyActive||busy||revision===null||(enabled&&!valid))return;
  setBusy(true);setMessage('');
  try{
   const response=await fetch('/api/v16/commissions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cap:enabled?proposed:null,revision}),signal:AbortSignal.timeout(15000)});
   const result=await response.json();
   if(response.ok&&result.status==='ok'){setDirty(false);setMessage('Tope guardado. Se aplica a nuevas cotizaciones.');await live.refresh()}
   else if(response.status===409){setDirty(false);setMessage('El tope cambió durante la edición. Se recargó el valor vigente; revisalo antes de guardar.');await live.refresh()}
   else setMessage('No pudimos guardar el tope. Tu cambio no fue confirmado.');
  }catch{setMessage('No pudimos confirmar el guardado. Actualizá el valor vigente antes de volver a intentar.')}
  finally{setBusy(false)}
 }
 return <section className="store-panel">
  <h2>Comisiones de asesores</h2>
  <p>{data?.policyActive?'Escala activa para nuevas cotizaciones. Las ventas y cotizaciones anteriores conservan su comisión registrada.':'La escala nueva está en vista previa, pendiente de activación. Las operaciones conservan su comisión registrada.'}</p>
  <p>Contado: 10% hasta $199.999; 7% desde $200.000. Financiado: $7.500 hasta $49.999; $12.000 hasta $99.999; $20.000 hasta $199.999; $28.000 hasta $299.999; desde $300.000, 10%{data?.cap===null?' sin tope':` con tope ${money(data?.cap)}`}.</p>
  <button className="product-calculator-trigger" onClick={()=>void live.refresh()}>Actualizar comisiones</button>
  {data?.role==='owner'&&<details>
   <summary>Tope financiado · Propietarios</summary>
   <p>{data.policyActive?'El cambio se comparte con todos los asesores. Afecta sólo cotizaciones nuevas; las anteriores mantienen el importe autorizado.':'Podés probar el valor. El guardado compartido y la liquidación de esta escala están pendientes de activación.'}</p>
   <label><input type="checkbox" checked={enabled} disabled={busy} onChange={e=>{setEnabled(e.target.checked);setDirty(true);setMessage('')}}/>Aplicar tope</label>
   {enabled&&<label>Tope en pesos<input type="number" min="0" max="100000000" value={cap} disabled={busy} onChange={e=>{setCap(e.target.value);setDirty(true);setMessage('')}} placeholder="A definir"/></label>}
   <p>{data.policyActive?'Nuevo valor':'Vista previa'}: {enabled?(valid?money(proposed):'A definir'):'Sin tope'}.</p>
   <button type="button" className="product-calculator-trigger" disabled={!data.policyActive||busy||!dirty||revision===null||(enabled&&!valid)} onClick={()=>void save()}>{!data.policyActive?'Guardado pendiente de activación':busy?'Guardando…':'Guardar tope'}</button>
   {message&&<p role="status">{message}</p>}
  </details>}
  <AdvisorCompensationAdminPanel result={data?{status:'ok',data:ids.map(id=>liveAdvisorMonth(data,id))}:{status:'not_connected'}}/>
  {data&&<div className="commission-admin-operations">{data.operations.map(op=><article key={op.saleId}>
   <h3>{op.advisorName} · {op.productLabel}</h3>
   <dl className="commission-detail">
    <div><dt>Venta relacionada</dt><dd>{op.saleId}</dd></div>
    <div><dt>Precio contado</dt><dd>{money(op.finalCashPriceArs)}</dd></div>
    <div><dt>Costo real</dt><dd>{money(op.costArs)}</dd></div>
    <div><dt>Margen después de comisión</dt><dd>{money(op.marginArs)}</dd></div>
    <div><dt>Comisión registrada</dt><dd>{money(op.commissionTotalArs)}</dd></div>
    <div><dt>Pagado</dt><dd>{money(op.commissionCollectedArs)}</dd></div>
    <div><dt>Pendiente</dt><dd>{money(Math.max(0,(op.validation==='EXCLUDED'?0:op.commissionTotalArs)-op.commissionCollectedArs))}</dd></div>
    <div><dt>Estado</dt><dd>{op.validationReason}</dd></div>
   </dl>
   <small>Política de la venta: {op.policyVersion}</small>
  </article>)}</div>}
  {data&&<p className="muted">Cobrado incluye sólo pagos de comisión identificados con venta y asesor, sin reversa. Se actualiza cada 30 segundos y al volver a la app.</p>}
 </section>;
}
