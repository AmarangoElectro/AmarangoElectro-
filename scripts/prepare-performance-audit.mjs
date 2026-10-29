// Genera un ensayo local aislado. No despliega ni escribe en Supabase.
// Uso: node scripts/prepare-performance-audit.mjs /ruta/temporal/fuera-del-repo
import {readFileSync,writeFileSync,mkdirSync,cpSync} from 'node:fs';
import {resolve,dirname,join,relative,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {runInNewContext} from 'node:vm';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
if(!process.argv[2])throw new Error('Indicar una carpeta temporal fuera del repositorio.');
const output=resolve(process.argv[2]);
const rel=relative(root,output);
if(!rel||(!rel.startsWith('..')&&!isAbsolute(rel))){
  throw new Error('La carpeta de ensayo debe quedar fuera del repositorio.');
}
const pub=join(output,'public');
mkdirSync(output,{recursive:true});
cpSync(join(root,'public'),pub,{recursive:true});
mkdirSync(join(output,'.openai'),{recursive:true});
writeFileSync(join(output,'.openai','hosting.json'),JSON.stringify({static:{directory:'public'}}));

const base='76acde2f21ef12da86329bb1c56e20eced61b0b1';
const source=readFileSync(join(root,'public','index.html'),'utf8');
const before=execFileSync('git',['show',`${base}:public/index.html`],{cwd:root,encoding:'utf8',maxBuffer:4e6});
const probe=readFileSync(join(root,'scripts','performance-probe.js'),'utf8');
function template(file,name){
  const text=readFileSync(join(root,file),'utf8');
  const expression=text.match(new RegExp('const '+name+' = (`[\\s\\S]*?`);'))?.[1];
  if(!expression)throw new Error('No se encontró '+name);
  return runInNewContext(expression,Object.create(null),{timeout:1000});
}
const head=template('src/worker.mjs','ADMIN_UI_STYLE')+
  template('src/worker-professional.mjs','PRO_UX_HEAD');
const body=template('src/worker.mjs','ADMIN_UI_SCRIPT')+
  template('src/worker-professional.mjs','PRO_UX_BODY');
const run=Date.now();
for(const [label,original] of [['before',before],['after',source]]){
  const prefix=`ae_audit_${run}_${label}_`;
  const isolation=`(function(){
    const storage=localStorage,prefix=${JSON.stringify(prefix)};
    Object.defineProperty(window,'localStorage',{value:{
      getItem:k=>storage.getItem(prefix+k),
      setItem:(k,v)=>storage.setItem(prefix+k,v),
      removeItem:k=>storage.removeItem(prefix+k)
    }});
    const open=indexedDB.open.bind(indexedDB);
    indexedDB.open=(name,version)=>open(prefix+name,version);
  })();`;
  let html=original.replace('<head>','<head><script>'+isolation+'\n'+probe+'</script>');
  html=html.replace('</head>',head+'</head>');
  const end=html.lastIndexOf('</body>');
  html=html.slice(0,end)+body+html.slice(end);
  const marker='// La tienda es la pestaña de inicio (pública): inicializarla al cargar';
  html=html.replace(marker,`var auditRenderOriginal=tiendaRender;
    tiendaRender=function(){var t=performance.now();
      try{return auditRenderOriginal.apply(this,arguments);}
      finally{window.__audit.renders.push({start:Math.round(t),ms:Math.round((performance.now()-t)*10)/10});}
    };\n`+marker);
  // El preview inserta su script al encontrar </body>. Escapar el cierre
  // del HTML del PDF evita que se inserte dentro de una cadena JavaScript.
  html=html.replace("html+='</body></html>';","html+='<\\/body><\\/html>';");
  writeFileSync(join(pub,label+'.html'),html);
}
writeFileSync(join(pub,'audit.html'),`<!doctype html><html lang="es"><head>
  <meta charset="utf-8"><title>QA de rendimiento AmarangoElectro</title></head>
  <body style="margin:0;font:13px system-ui"><div style="display:flex;gap:12px">
  <iframe id="store" title="Tienda de prueba" style="width:412px;height:915px;flex-shrink:0;border:1px solid #999"></iframe>
  <pre id="result" style="white-space:pre-wrap;overflow:auto;height:950px;max-width:850px">Midiendo…</pre></div>
  <script>addEventListener('message',e=>{if(e.origin===location.origin&&e.data.aeAudit)
    document.getElementById('result').textContent=JSON.stringify(e.data.aeAudit,null,2)});
  const label=new URLSearchParams(location.search).get('version')==='after'?'after':'before';
  document.getElementById('store').src='/'+label+'.html';</script></body></html>`);
console.log('Ensayo preparado en '+output);
console.log('Iniciar con: sites-preview start '+output);
console.log('En la URL devuelta abrir /audit.html?version=before o ?version=after; recargar para medir reaperturas.');
