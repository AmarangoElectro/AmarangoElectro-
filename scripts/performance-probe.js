// QA local únicamente. No incluir en public ni en el Worker.
(function(){
 const m={started:Date.now(),renders:[],fetches:[],errors:[],shifts:[],cls:0,longTasks:0,blockedWrites:0};
 window.__audit=m;
 const original=window.fetch;
 window.fetch=function(input,init){
  const method=String((init&&init.method)||(input&&input.method)||'GET').toUpperCase();
  const url=String(input&&input.url||input);
  if(!['GET','HEAD','OPTIONS'].includes(method)){m.blockedWrites++;return Promise.reject(new Error('QA de solo lectura'));}
  const rec={url:url.replace(/apikey=[^&]+/g,'apikey=REDACTED'),start:performance.now(),method};m.fetches.push(rec);
  return original.apply(this,arguments).then(r=>{rec.end=performance.now();rec.status=r.status;r.clone().arrayBuffer().then(b=>{rec.bytes=b.byteLength;}).catch(()=>{});return r;},e=>{rec.end=performance.now();rec.error=String(e);throw e;});
 };
 addEventListener('error',e=>{if(e.target.tagName==='IMG')m.errors.push(e.target.src);else if(e.message)m.errors.push(e.message);},true);
 addEventListener('load',e=>{if(e.target.matches&&e.target.matches('#tienda-grid .prod-foto')&&e.target.naturalWidth){m.firstPhotoLoaded??=performance.now();const r=e.target.getBoundingClientRect();if(r.top<innerHeight&&r.bottom>0)m.firstVisiblePhoto??=performance.now();}},true);
 try{new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput){m.cls+=e.value;m.shifts.push({time:e.startTime,value:e.value,sources:e.sources.map(s=>({id:s.node?.id,tag:s.node?.tagName,cls:s.node?.className}))});}}).observe({type:'layout-shift',buffered:true});}catch(e){}
 try{new PerformanceObserver(list=>{m.longTasks+=list.getEntries().length;}).observe({type:'longtask',buffered:true});}catch(e){}
 setInterval(()=>{
 const sp=document.getElementById('splash-screen');if(sp&&(sp.classList.contains('oculto')||sp.style.display==='none'))m.open??=performance.now();
 const grid=document.getElementById('tienda-grid');if(grid?.querySelector('.prod-foto'))m.catalogPaint??=performance.now();
 if(window._tiendaSincronizacionInicialLista)m.verified??=performance.now();
 const imgs=Array.from(document.querySelectorAll('#tienda-grid .prod-foto'));
 if(imgs.some(x=>x.complete&&x.naturalWidth))m.firstPhotoLoaded??=performance.now();
 if(imgs.some(x=>{const r=x.getBoundingClientRect();return x.complete&&x.naturalWidth&&r.top<innerHeight&&r.bottom>0}))m.firstVisiblePhoto??=performance.now();
 const res=performance.getEntriesByType('resource');
 const out={...m,now:Math.round(performance.now()),cacheBytes:(localStorage.getItem('ae_tienda_catalogo')||'').length,cacheVersion:localStorage.getItem('ae_tienda_incremental_version'),catalogProducts:window.tiendaProductos?.length,images:imgs.length,loaded:imgs.filter(x=>x.complete&&x.naturalWidth).length,resources:res.map(x=>({name:x.name,start:Math.round(x.startTime),end:Math.round(x.responseEnd),bytes:x.transferSize,body:x.encodedBodySize})),nav:performance.getEntriesByType('navigation').map(x=>({ttfb:x.responseStart,dcl:x.domContentLoadedEventEnd,load:x.loadEventEnd})),paints:performance.getEntriesByType('paint').map(x=>({name:x.name,time:x.startTime}))};
 parent.postMessage({aeAudit:out},location.origin);
 },100);
})();
