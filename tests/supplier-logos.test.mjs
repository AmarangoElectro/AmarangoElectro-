import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {Script,createContext,runInContext} from 'node:vm';
const html=readFileSync('public/index.html','utf8'),script=readFileSync('public/supplier-logos.js','utf8');
const colors=html.slice(html.indexOf('function colorMayorista('),html.indexOf('// Lee el stock aunque venga'));
const block=html.slice(html.indexOf('    if(tiendaEsAdmin && !vistaPreviaCliente && mayoristaUnico){'),html.indexOf('    if(tiendaEsAdmin && !vistaPreviaCliente && p.esCelu){'));
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function fixture(ready=true){const ctx=createContext({escapeHtml,tiendaEsAdmin:true,vistaPreviaCliente:false,card:'',mayoristaUnico:'ATTAIN'});if(ready)runInContext(script,ctx);runInContext(colors,ctx);return ctx;}
function render(ctx,name){ctx.card='';ctx.mayoristaUnico=name;ctx.colorMayoristaCard=ctx.colorMayorista(name);runInContext(block,ctx);return ctx.card;}
test('all eleven supplier logos are local originals with stable brand colors and explicit aliases',()=>{
 const c=fixture(),names=['Electro Impacto','Women','Stagliano','One SI','Mega Electro','New Red','Distribuidora Bruni','Red Lenic','Electrosmart','SofJDistribuidora','ATTAIN'];
 const ids=new Set();for(const name of names){const id=c.aeMayoristaLogoIdentity(name);ids.add(id.key);assert.ok(existsSync('public'+id.image));assert.match(render(c,name),new RegExp(id.image));assert.equal(c.colorMayorista(name).txt,id.light);}
 assert.equal(ids.size,11);assert.equal(c.aeMayoristaLogoIdentity('Sofj').key,'sof-j');assert.equal(c.aeMayoristaLogoIdentity('Mega').key,'mega-electro');assert.equal(c.aeMayoristaLogoIdentity('Stagliano').light,'#0369a1');assert.equal(c.aeMayoristaLogoIdentity('ATTAIN').light,'#0f766e');
 assert.equal(c.aeMayoristaLogoIdentity('ATTAIN impostor'),null);
});
test('actual existing card block keeps logos and names exclusively in admin outside customer preview',()=>{
 const c=fixture();assert.match(render(c,'ATTAIN'),/ae-supplier-logo/);assert.match(c.card,/>ATTAIN<\/span>/);
 for(const state of [{tiendaEsAdmin:false,vistaPreviaCliente:false},{tiendaEsAdmin:true,vistaPreviaCliente:true}]){Object.assign(c,state);assert.equal(render(c,'ATTAIN'),'');}
});
test('unknown/malicious supplier labels remain escaped and missing optional script preserves the old fallback',()=>{
 const c=fixture(),name='<img src=x onerror="alert(1)">';const output=render(c,name);assert.doesNotMatch(output,/<img/);assert.match(output,/&lt;img/);assert.equal(c.aeMayoristaLogoIdentity(name),null);
 const noScript=fixture(false);assert.match(render(noScript,'ATTAIN'),/🏪 ATTAIN/);assert.doesNotMatch(noScript.card,/undefined/);
});
test('logo module has no data writes, DOM mutations, event handlers or remote calls; assets load before the inline app',()=>{
 new Script(script);assert.doesNotMatch(script,/fetch\(|localStorage|supabase|addEventListener|document\.|onclick|onerror/i);
 const position=html.indexOf('<script src="/supplier-logos.js?v=20261023">');assert.ok(position>0&&position<html.indexOf('function tiendaCardsHtml('));assert.match(html,/supplier-logos.css\?v=20261023/);
 const c=fixture();assert.match(c.aeMayoristaEtiquetaHtml('SofJ'),/loading="lazy"/);assert.match(c.aeMayoristaEtiquetaHtml('SofJ'),/alt=""/);
});
