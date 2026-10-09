'use client';
import {useState} from 'react';
import {useLiveCommissions} from '@/lib/advisor-compensation/use-live-commissions';
import {liveAdvisorMonth} from '@/lib/advisor-compensation/live-model';
import {AdvisorCompensationAdminPanel} from './advisor-compensation-admin-panel';
const money=(v:number|null|undefined)=>typeof v!=='number'||!Number.isFinite(v)?'A confirmar':`$${v.toLocaleString('es-AR',{maximumFractionDigits:2})}`;
export function LiveCommissionControl(){
 const live=useLiveCommissions(),[cap,setCap]=useState(''),[enabled,setEnabled]=useState(true);
 const data=live.status==='ok'?live.data:null;
 const ids=[...new Set(data?.operations.map(op=>op.advisorId)??[])];
 const proposed=Number(cap),valid=cap.trim()&&Number.isFinite(proposed)&&proposed>=0&&proposed<=100000000;
 return <section className="store-panel">
  <h2>Comisiones de asesores</h2>
  <p>La escala nueva está en vista previa. Las operaciones muestran la comisión y los pagos registrados al confirmar cada venta.</p>
  <p>Contado: 10% hasta $199.999; 7% desde $200.000. Financiado: $7.500 hasta $49.999; $12.000 hasta $99.999; $20.000 hasta $199.999; $28.000 hasta $299.999; desde $300.000, 10% con tope a definir.</p>
  <button className="product-calculator-trigger" onClick={()=>void live.refresh()}>Actualizar comisiones</button>
  {data?.role==='owner'&&<details>
   <summary>Vista previa del tope financiado · Propietarios</summary>
   <p>El guardado compartido está pendiente de habilitación. Esta prueba no modifica ventas ni liquidaciones.</p>
   <label><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/>Aplicar tope</label>
   {enabled&&<label>Tope en pesos<input type="number" min="0" max="100000000" value={cap} onChange={e=>setCap(e.target.value)} placeholder="A definir"/></label>}
   <p>Vista previa: {enabled?(valid?money(proposed):'A definir'):'Sin tope'}.</p>
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
