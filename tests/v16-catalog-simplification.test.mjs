import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {deriveQuickFacetGroups, matchesFacets, dominantFacetNumber} from '../lib/catalog/smart-facets.ts';
import {displayProductName} from '../lib/catalog/display-name.ts';
const product = (id, name, category='celulares') => ({id,name,category,model:null,brand:'Samsung',specifications:{}});

test('all phone brands share real memory filters; 2 TB only appears with evidence',()=>{
 const rows=[product('a','Samsung 128 GB'),{...product('b','Motorola 256/8'),brand:'Motorola'},product('c','Samsung 1 TB'),product('d','Samsung sin memoria confirmada')];
 assert.deepEqual(deriveQuickFacetGroups(rows,'celulares')[0].options,['128 GB','256 GB','1 TB']);
 assert.deepEqual(rows.filter(p=>matchesFacets(p,'celulares',{storage:'256 GB'})).map(p=>p.id),['b']);
 assert.equal(rows.filter(p=>matchesFacets(p,'celulares',{})).length,4);
 assert.equal(dominantFacetNumber(rows[2],'celulares'),1024);
 const expanded=[...rows,product('e','Teléfono 2 TB')];
 assert.ok(deriveQuickFacetGroups(expanded,'celulares')[0].options.includes('2 TB'));
 assert.equal(dominantFacetNumber(expanded[4],'celulares'),2048);
});

test('laundry ranges preserve decimal capacities and separate boundaries and unknown data',()=>{
 const rows=['4','6.5','7','8','9','10','11','12','15'].map((n,i)=>product(String(i),`Lavarropas ${n} kg`,'electrodomesticos'));
 rows.push(product('unknown','Lavarropas sin capacidad','electrodomesticos'));
 assert.deepEqual(deriveQuickFacetGroups(rows,'lavado')[0].options,['Menos de 6 kg','6–7 kg','8–9 kg','10–11 kg','12 kg+']);
 assert.deepEqual(rows.filter(p=>matchesFacets(p,'lavado',{capacity:'6–7 kg'})).map(p=>p.id),['1','2']);
 assert.deepEqual(rows.filter(p=>matchesFacets(p,'lavado',{capacity:'8–9 kg'})).map(p=>p.id),['3','4']);
 assert.deepEqual(rows.filter(p=>matchesFacets(p,'lavado',{capacity:'12 kg+'})).map(p=>p.id),['7','8']);
 assert.deepEqual(deriveQuickFacetGroups([rows[1]],'lavado')[0].options,['6–7 kg']);
 assert.equal(rows.filter(p=>matchesFacets(p,'lavado',{})).length,10);
});

test('real fixtures yield only supported TV sizes, and numeric sorting leaves unknown sizes last',()=>{
 const source=JSON.parse(readFileSync(new URL('../fixtures/v16-catalog-expansion-63-20260921.json',import.meta.url)));
 const rows=source.products.filter(p=>p.category==='smart-tv').map(p=>({...p,model:null,specifications:{}}));
 const group=deriveQuickFacetGroups(rows,'smart-tv')[0];
 assert.ok(group.options.length>4);
 for(const value of group.options) assert.ok(rows.some(p=>matchesFacets(p,'smart-tv',{measure:value})));
 assert.ok(!group.options.includes('55″'));
 assert.ok(!group.options.includes('50″'));
 const sorted=[product('large','Smart TV 85 pulgadas','smart-tv'),product('unknown','Smart TV sin medida','smart-tv'),product('small','Smart TV 32 pulgadas','smart-tv')].sort((a,b)=>dominantFacetNumber(a,'smart-tv')-dominantFacetNumber(b,'smart-tv'));
 assert.deepEqual(sorted.map(p=>p.id),['small','large','unknown']);
});

test('display hierarchy preserves original names, model codes and acronyms',()=>{
 assert.equal(displayProductName('SAMSUNG GALAXY A17 128GB'),'Samsung Galaxy A17 128GB');
 assert.equal(displayProductName('Smart TV TCL 43 pulgadas'),'Smart TV TCL 43 pulgadas');
 assert.equal(displayProductName('TORRE JBL USB'),'Torre JBL USB');
});

// Guard the source-level boundary: this feature has no operational API or price writes.
test('catalog controls only project supplied data and category entry keeps all brands',()=>{
 const controls=readFileSync(new URL('../app/components/compact-catalog-controls.tsx',import.meta.url),'utf8');
 assert.doesNotMatch(controls,/fetch\(|localStorage|sessionStorage|supabase|costArs|commission/);
 const category=readFileSync(new URL('../app/categoria/[slug]/page.tsx',import.meta.url),'utf8');
 assert.match(category,/const products = categoryProducts/);
 assert.doesNotMatch(category,/<SubcategoryBannerCard|<DescansoBrandGallery|href=\{`\?marca/);
 const drawer=readFileSync(new URL('../app/components/brand-product-accordion.tsx',import.meta.url),'utf8');
 assert.match(drawer,/<strong>Ver todos<\/strong>/);
 assert.doesNotMatch(drawer,/Por marca|catalog-view-tabs|revealIfNeeded|scrollIntoView/);
 assert.match(drawer,/aria-expanded=\{allOpen\}/);
 assert.match(drawer,/hidden=\{!isOpen\}/);
 assert.match(controls,/internal-catalog-drawer/);
 assert.match(controls,/\{controls\}\{children\}/);
 assert.match(drawer,/premium && !artwork && hasDistinctBrandDrawerArtwork/);
 assert.match(drawer,/is-compact-drawer/);
});

test('semantic foregrounds maintain readable contrast on light and neutral dark surfaces',()=>{
 const light=readFileSync(new URL('../app/globals.css',import.meta.url),'utf8').split('* {')[0];
 const dark=readFileSync(new URL('../app/dark-surfaces.css',import.meta.url),'utf8').split('html[data-theme')[0];
 const css=readFileSync(new URL('../app/catalog-simplification.css',import.meta.url),'utf8');
 const luminance=hex=>{const rgb=hex.match(/\w\w/g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];};
 const token=(src,key)=>src.match(new RegExp(`--${key}: #(\\w{6})`))[1];
 for(const src of [light,dark]) for(const bg of ['background','card','soft']) for(const fg of ['foreground','muted-foreground']) {
   const a=luminance(token(src,fg)),b=luminance(token(src,bg));
   assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,`${fg} on ${bg}`);
 }
 assert.match(css,/\.product-spec-table dd \{ color: var\(--foreground\)/);
 assert.match(css,/\.product-decision-content \{ color: var\(--muted-foreground\)/);
});
