import { createHash } from "node:crypto";
import { access, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const evidenceRoot = process.env.AE_V41531_EVIDENCE_ROOT || "/workspace/scratch/afced85eedc5";

const sourceSpecs = Object.freeze([
  { alias:"CRM_LEGACY_REAL", env:"AE_CRM_LEGACY_HTML", fallback:resolve(evidenceRoot,"sources/index(8).html") },
  { alias:"STORE_LEGACY_REAL", env:"AE_STORE_LEGACY_HTML", fallback:resolve(evidenceRoot,"audit-sources/legacy-main/AmarangoElectro--main/public/index.html") },
  { alias:"CALCULADORA_LEGACY", env:"AE_CALCULADORA_HTML", fallback:resolve(evidenceRoot,"sources/calculadora.html") },
  { alias:"TIENDA_NUEVA_LEGACY", env:"AE_TIENDA_NUEVA_HTML", fallback:resolve(evidenceRoot,"sources/tienda-nueva.html") },
]);

const rules = Object.freeze([
  [/chat|mensaje|reaccion|emoji|typing|presencia|audioChat|archivoChat/i,"CRM.CHAT.INTERNAL"],
  [/notif|notification|permisoNotif|vencimiento.*notific/i,"CRM.NOTIFY.COLLECTIONS.DUE"],
  [/tarea|pendiente.*badge|recordatorio/i,"CRM.TASKS.BADGE"],
  [/calend|evento|eventosHoy/i,"CRM.CALENDAR.OPERATIONAL"],
  [/pagoInv|inversor|inversion|capital|reparto|ganancia/i,"FINANCE.INVESTOR.PAYABLES"],
  [/pagoRev|revendedor|comision/i,"FINANCE.RESELLER.PAYABLES"],
  [/backup|snapshot|restaur|importar|exportar|descargar.*json|papelera/i,"RECOVERY.CRM.FULL_BACKUP"],
  [/amara|ayuda|guia|asistente|tour/i,"HELP.OPERATIONAL.ASSISTANT"],
  [/cliente|dni|domicilio|telefono|contacto/i,"CRM.CLIENT360.CORE"],
  [/cobran|mora|atras|saldo|pago|cuota/i,"CRM.COLLECTIONS.CORE"],
  [/venta|pedido|operacion|comprobante/i,"CRM.SALES.CORE"],
  [/caja|gasto|ingreso|egreso|movimiento/i,"FINANCE.CASH.LEDGER"],
  [/entrega|despacho|envio/i,"CRM.DELIVERIES.CORE"],
  [/asesor|equipo|usuario|responsable|sesion|login|logout|auth|rol/i,"CRM.TEAM.ROLES"],
  [/reporte|estad|ranking|resumen|balance|dashboard/i,"CRM.REPORTING.OPERATIONAL"],
  [/producto|catalog|celular|stock|visible|categoria|precio|foto|imagen|proveedor|mayorista|destacado|oferta/i,"CATALOG.LEGACY.OPERATIONS"],
  [/calcul|markup|costo|contado|dolar|usd|cotiz/i,"PRICING.LEGACY.CALCULATOR"],
  [/placa|flyer|canvas/i,"PHOTO.PLATES.FLYERS"],
  [/whatsapp|compart|copiar|share|instagram|qr/i,"COMMERCIAL.SHARE.HELPERS"],
  [/buscar|filtro|orden|normaliz|slug|texto|format|escape|parse/i,"RUNTIME.SEARCH.FORMAT"],
  [/sync|supabase|nube|offline|online|pwa|serviceWorker|actualiz|version/i,"PLATFORM.SYNC.OFFLINE"],
  [/modal|menu|tab|panel|vista|render|abrir|cerrar|toggle|mostrar|ocultar|scroll|anim|toast|badge|theme|tema|sonido|color/i,"RUNTIME.UI.NAVIGATION"],
  [/guardar|cargar|leer|obtener|crear|editar|eliminar|borrar|agregar|quitar|set|get|save|load|remove|add|update|delete/i,"RUNTIME.DATA.OPERATIONS"],
]);

function lineAt(text,index){let line=1;for(let i=0;i<index;i+=1)if(text.charCodeAt(i)===10)line+=1;return line;}
function classify(name){for(const [pattern,id] of rules)if(pattern.test(name))return id;return "RUNTIME.SUPPORT.HELPERS";}
async function exists(path){try{await access(path);return true;}catch{return false;}}

export async function scanLegacyCapabilities(){
  const sources=[];const functions=[];
  for(const spec of sourceSpecs){
    const path=process.env[spec.env]?resolve(process.env[spec.env]):spec.fallback;
    if(!await exists(path))throw new Error(`Missing mandatory audit source ${spec.alias}: ${path}`);
    const text=await readFile(path,"utf8");
    const matches=[...text.matchAll(/(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g)];
    sources.push({alias:spec.alias,sha256:createHash("sha256").update(text).digest("hex"),bytes:Buffer.byteLength(text),namedFunctionCount:matches.length});
    for(const match of matches)functions.push({source:spec.alias,name:match[1],line:lineAt(text,match.index??0),capabilityId:classify(match[1])});
  }
  const unmapped=functions.filter((item)=>!item.capabilityId);
  const ids=[...new Set(functions.map((item)=>item.capabilityId))].sort();
  const capabilityCounts=Object.fromEntries(ids.map((id)=>[id,functions.filter((item)=>item.capabilityId===id).length]));
  return Object.freeze({schemaVersion:"V4.15.3.1",generatedFromSanitizedMetadataOnly:true,sources,totalNamedFunctions:functions.length,functions,capabilityCounts,unmapped});
}

if(import.meta.url===`file://${process.argv[1]}`){
  const report=await scanLegacyCapabilities();
  const out=resolve(root,"fixtures/v41531-legacy-capability-manifest.json");
  await writeFile(out,`${JSON.stringify(report,null,2)}\n`);
  process.stdout.write(`${JSON.stringify({output:out,totalNamedFunctions:report.totalNamedFunctions,sources:report.sources,capabilityCounts:report.capabilityCounts,unmapped:report.unmapped.length},null,2)}\n`);
  if(report.unmapped.length)process.exitCode=1;
}
