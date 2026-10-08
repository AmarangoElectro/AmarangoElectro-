"use client";
import {useState} from "react";
import {ArrowRight} from "lucide-react";
import {PLANS,type PlanId,type PlanPrice} from "@/lib/subscriptions/plans";
import {recommend,type Diagnosis} from "@/lib/subscriptions/guidance";

const steps=[
 {key:"need",title:"¿Qué necesita hoy tu negocio?",hint:"Elegí tu prioridad.",options:[["sales","↗","Más ventas"],["order","▦","Orden"],["financing","%","Financiación"],["support","🤝","Acompañamiento"]]},
 {key:"tools",title:"¿Qué herramientas te faltan?",hint:"Podés elegir varias.",options:[["store","🛍","Tienda"],["installments","%","Cuotas"],["crm","👥","CRM"],["brand","◈","Marca propia"],["administration","▦","Administración"]]},
 {key:"monthly_sales",title:"¿Cuántas ventas manejás por mes?",hint:"Una estimación alcanza.",options:[["starting","🌱","Estoy empezando · hasta 10"],["up_to_30","↗","Entre 11 y 30"],["up_to_100","▦","Entre 31 y 100"],["over_100","⚡","Más de 100"]]},
 {key:"installments",title:"¿Vendés o querés vender en cuotas?",hint:"Te orientamos según tu forma de vender.",options:[["yes","✓","Ya vendo en cuotas"],["want","↗","Quiero empezar"],["no","$","Por ahora, contado"]]},
 {key:"budget",title:"¿Cuánto invertirías por mes en herramientas?",hint:"Es orientativo. Tu respuesta no genera un cobro.",options:[["free","🌱","Por ahora, gratis"],["amount","$","Tengo un presupuesto"],["unsure","?","Necesito orientación"]]},
 {key:"value",title:"¿Qué valorás más?",hint:"Elegí lo que más te ayudaría hoy.",options:[["simplicity","✓","Simplicidad"],["automation","⚡","Automatización"],["control","▦","Control"],["support","🤝","Soporte 1 a 1"]]},
] as const;

export function BusinessDiagnosis({initial,prices,onComplete,onChoose,onCompare,disabled=false}:{initial?:Diagnosis|null;prices:PlanPrice[];onComplete:(d:Diagnosis)=>Promise<boolean>;onChoose:(p:PlanId)=>void;onCompare:()=>void;disabled?:boolean}){
 const [phase,setPhase]=useState<"intro"|"questions"|"result">(initial?"result":"intro"),[step,setStep]=useState(0),[answers,setAnswers]=useState<Partial<Diagnosis>>(initial??{}),[budgetMode,setBudgetMode]=useState(initial?.budget===0?"free":initial?.budget!=null?"amount":initial?"unsure":""),[saving,setSaving]=useState(false);
 const item=steps[step],isBudget=item.key==="budget",isTools=item.key==="tools";
 const complete=isBudget?budgetMode!==""&&(budgetMode!=="amount"||typeof answers.budget==="number"&&answers.budget>0&&answers.budget<=10000000):isTools?(answers.tools?.length??0)>0:!!answers[item.key];
 function select(value:string){
  if(isBudget){setBudgetMode(value);setAnswers({...answers,budget:value==="free"?0:null});return}
  if(isTools){const tool=value as Diagnosis["tools"][number],chosen=answers.tools??[];setAnswers({...answers,tools:chosen.includes(tool)?chosen.filter(t=>t!==tool):[...chosen,tool]});return}
  setAnswers({...answers,[item.key]:value});
 }
 const compare=<a className="diagnosis-compare" href="#subscriber-plan-comparison" onClick={onCompare}>Comparar todos los niveles →</a>;
 const result=phase==="result"?recommend(answers as Diagnosis,prices):null;
 return <section className="store-panel business-diagnosis" aria-label="Diagnóstico de tu negocio">
  {phase==="intro"?<><small>CRECÉ A TU RITMO</small><h2>Encontrá tu próximo paso</h2><p>Seis preguntas breves para recomendarte las herramientas que hoy te sirven.</p><div className="store-toolbar"><button className="primary diagnosis-start" disabled={disabled} onClick={()=>setPhase("questions")}><span>Quiero conocer mi mejor opción<small>Orientarme en 6 pasos</small></span><ArrowRight size={22} aria-hidden="true"/></button>{compare}</div></>:
   result?<><small>RECOMENDADO PARA TU NEGOCIO</small><h2>{PLANS.find(p=>p.id===result.plan)?.name}</h2><p>{result.reason}</p><p className="muted">{result.budgetNote}</p><div className="store-toolbar"><a href="#subscriber-plan-comparison" onClick={()=>{onChoose(result.plan);onCompare()}}>Conocer {result.plan==="premium"?"Premium 1 a 1":PLANS.find(p=>p.id===result.plan)?.name} →</a>{compare}<button disabled={disabled} onClick={()=>{setStep(0);setPhase("questions")}}>Revisar respuestas</button></div><p className="muted">Vos elegís. Cada cambio requiere tu decisión y autorización de Propietarios.</p></>:
   <><div className="diagnosis-progress"><span>Paso {step+1} de {steps.length}</span><progress aria-label="Progreso del diagnóstico" value={step+1} max={steps.length}/></div><h2 id="diagnosis-question" tabIndex={-1}>{item.title}</h2><p className="muted">{item.hint}</p><div className="diagnosis-options" role="group" aria-labelledby="diagnosis-question">{item.options.map(([value,icon,label])=>{const chosen=isBudget?budgetMode===value:isTools?answers.tools?.includes(value as Diagnosis["tools"][number]):answers[item.key]===value;return <button type="button" key={value} aria-pressed={!!chosen} disabled={disabled||saving} onClick={()=>select(value)}><span aria-hidden="true">{icon}</span>{label}</button>})}</div>{isBudget&&budgetMode==="amount"&&<label className="diagnosis-budget">Presupuesto mensual aproximado ($ ARS)<input autoFocus type="number" min="0.01" max="10000000" step="0.01" placeholder="Escribí tu presupuesto" value={answers.budget??""} onChange={e=>setAnswers({...answers,budget:e.target.value===""?null:Number(e.target.value)})}/></label>}<div className="store-toolbar"><button disabled={disabled||saving||step===0} onClick={()=>setStep(step-1)}>Anterior</button><button className="primary" disabled={disabled||saving||!complete} onClick={async()=>{if(step<steps.length-1){setStep(step+1);document.getElementById("diagnosis-question")?.focus();return}setSaving(true);try{if(await onComplete(answers as Diagnosis))setPhase("result")}finally{setSaving(false)}}}>{saving?"Guardando…":step===steps.length-1?"Ver mi recomendación":"Continuar"}</button>{compare}</div></>}
 </section>
}
