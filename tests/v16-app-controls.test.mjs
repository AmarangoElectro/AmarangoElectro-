import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
const root=new URL('../',import.meta.url),resolvePackage=createRequire(import.meta.url);
async function load(path){const built=await build({entryPoints:[new URL(path,root).pathname],bundle:true,write:false,format:'esm',platform:'node',jsx:'automatic',plugins:[{name:'external-react',setup(b){b.onResolve({filter:/^(?:react(?:\/|$)|react-dom(?:\/|$)|radix-ui$|lucide-react$)/},args=>({path:args.path==='radix-ui'?import.meta.resolve(args.path):pathToFileURL(resolvePackage.resolve(args.path)).href,external:true}));}}]});return import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'))}

test('option labels preserve empty values, backend codes, numeric values and disabled groups',async()=>{
  const React=await import('react');const {appSelectOptions}=await load('components/ui/app-select-options.ts');
  const el=React.createElement;
  const options=appSelectOptions([el('option',{value:''},'Todas'),el('option',{value:'META_ADS'},'Publicidad en Meta'),el('option',{},256),el('optgroup',{label:'Pausados',disabled:true},el('option',{value:'paused'},'Pausada'))]);
  assert.deepEqual(options.map(x=>[x.value,x.label,x.disabled]),[['','Todas',false],['META_ADS','Publicidad en Meta',false],['256','256',false],['paused','Pausada',true]]);
});

test('real React/Radix controls preserve forms, keyboard selection, validation, reset and cancel semantics',{skip:!process.env.V16_UI_TEST_RUNTIME},async()=>{
  const requireRuntime=createRequire(process.env.V16_UI_TEST_RUNTIME+'/package.json');
  const {JSDOM}=requireRuntime('jsdom');const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://qa.example.invalid',pretendToBeVisual:true});
  for(const key of ['window','document','navigator','HTMLElement','HTMLSelectElement','HTMLInputElement','HTMLFormElement','HTMLButtonElement','HTMLTextAreaElement','Element','SVGElement','NodeFilter','Event','EventTarget','Node','CustomEvent','DocumentFragment','MutationObserver','KeyboardEvent','MouseEvent'])Object.defineProperty(globalThis,key,{value:dom.window[key],configurable:true,writable:true});
  globalThis.getComputedStyle=dom.window.getComputedStyle.bind(dom.window);
  globalThis.requestAnimationFrame=dom.window.requestAnimationFrame.bind(dom.window);globalThis.cancelAnimationFrame=dom.window.cancelAnimationFrame.bind(dom.window);
  globalThis.ResizeObserver=class{observe(){}unobserve(){}disconnect(){}};
  dom.window.HTMLElement.prototype.scrollIntoView=function(){};
  dom.window.HTMLElement.prototype.hasPointerCapture=function(){return false};
  dom.window.HTMLElement.prototype.setPointerCapture=function(){};
  dom.window.HTMLElement.prototype.releasePointerCapture=function(){};
  globalThis.IS_REACT_ACT_ENVIRONMENT=true;
  const React=await import('react'),{createRoot}=await import('react-dom/client');
  const {AppSelect}=await load('components/ui/app-select.tsx'),{useReasonDialog}=await load('components/ui/use-reason-dialog.tsx');
  const el=React.createElement,{act}=React;const app=createRoot(document.getElementById('root'));let chosen='',dialogResult='pending';
  const key=(target,key)=>target.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true}));
  const click=target=>target.dispatchEvent(new MouseEvent('click',{bubbles:true}));
  async function choose(trigger,label){await act(async()=>{key(trigger,'ArrowDown')});const option=[...document.querySelectorAll('[role="option"]')].find(x=>x.textContent.trim()===label);assert.ok(option,`App option ${label}`);await act(async()=>{key(option,'Enter')});}
  function Controlled(){const [value,setValue]=React.useState('');return el('form',{id:'business-form'},el('label',{},'Cliente',el(AppSelect,{name:'customer',required:true,value,onChange:e=>{chosen=e.target.value;setValue(e.target.value)}},el('option',{value:''},'Elegir cliente'),el('option',{value:'real-client-id'},'Cliente real'))));}
  await act(async()=>{app.render(el(Controlled))});
  const form=document.getElementById('business-form');let trigger=form.querySelector('[role="combobox"]');
  await choose(trigger,'Cliente real');assert.equal(chosen,'real-client-id');assert.equal(new dom.window.FormData(form).get('customer'),'real-client-id');assert.match(trigger.textContent,/Cliente real/);
  await choose(trigger,'Elegir cliente');assert.equal(chosen,'');assert.equal(new dom.window.FormData(form).get('customer'),'');
  await act(async()=>{assert.equal(form.checkValidity(),false)});assert.equal(trigger.getAttribute('aria-invalid'),'true');assert.ok(document.querySelector('[role="listbox"]'));
  await act(async()=>{app.render(el('form',{id:'reset-form'},el(AppSelect,{name:'plan',defaultValue:'gestion'},el('option',{value:'cuotas'},'Cuotas'),el('option',{value:'gestion'},'Gestión')),el(AppSelect,{name:'blocked',disabled:true},el('option',{value:'x'},'Bloqueado'))))});
  const resetForm=document.getElementById('reset-form');trigger=resetForm.querySelector('[role="combobox"]');
  await choose(trigger,'Cuotas');assert.equal(new dom.window.FormData(resetForm).get('plan'),'cuotas');
  await act(async()=>{resetForm.reset()});assert.equal(new dom.window.FormData(resetForm).get('plan'),'gestion');assert.match(trigger.textContent,/Gestión/);assert.equal(new dom.window.FormData(resetForm).has('blocked'),false);
  function ReasonHarness(){const {requestReason,reasonDialog}=useReasonDialog();return el(React.Fragment,{},el('button',{onClick:async()=>{dialogResult=await requestReason({title:'Cancelar entrega',description:'Confirmá la cancelación.',confirmLabel:'Cancelar entrega'})}},'Abrir'),reasonDialog);}
  await act(async()=>{app.render(el(ReasonHarness))});await act(async()=>{click(document.querySelector('button'))});
  assert.ok(document.querySelector('[role="dialog"]'));await act(async()=>{click([...document.querySelectorAll('button')].find(x=>x.textContent==='Volver'))});assert.equal(dialogResult,null);
  await act(async()=>{click(document.querySelector('button'))});await act(async()=>{document.querySelector('[role="dialog"] form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))});assert.equal(dialogResult,'');
  await act(async()=>{click(document.querySelector('button'))});await act(async()=>{app.unmount()});assert.equal(dialogResult,null);
  dom.window.close();
});
