import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");
async function runTs(script) {
  const { stdout } = await execFileAsync(process.execPath, ["--experimental-strip-types", "--experimental-loader", "./tests/ts-extension-loader.mjs", "--input-type=module", "-e", script], { cwd:new URL("../", import.meta.url) });
  return JSON.parse(stdout);
}

test("Step 7L uses the current Amarango markup and 2/4/6 policy in an Admin-only versioned calculator", async () => {
  const result = await runTs(`
    import { AMARANGO_CURRENT_POLICY, AMARANGO_POLICY_VERSION, amarangoPolicyGovernance } from './lib/internal/finance/amarango-policy.ts';
    import { quoteAmarangoCalculator, estimateCostFromSale } from './lib/internal/finance/amarango-calculator.ts';
    const costs=[50000,100000,250000,350000,400000].map(cost=>quoteAmarangoCalculator({mode:'cost_ars',amount:cost,installmentPlans:[2,4,6]}));
    process.stdout.write(JSON.stringify({version:AMARANGO_POLICY_VERSION,gov:amarangoPolicyGovernance,tiers:AMARANGO_CURRENT_POLICY.pricingTiers,plans:AMARANGO_CURRENT_POLICY.installmentPlans.filter(x=>x.active),costs,reverse:estimateCostFromSale(90000)}));
  `);
  assert.equal(result.version, "2026-07-19");
  assert.equal(result.gov.adminOnly, true);
  assert.deepEqual(result.tiers.map(x=>x.markupPercent), [80,60,50,40,30]);
  assert.deepEqual(result.plans.map(x=>[x.installments,x.surchargePercent]), [[2,15],[4,55],[6,78]]);
  assert.deepEqual(result.costs.map(x=>x.markupPercent), [80,60,50,40,30]);
  assert.equal(result.costs[0].salePrice, 90000);
  assert.equal(result.costs[0].installments[0].installmentAmount, 52000);
  assert.equal(result.reverse.cost, 50000);
});

test("Step 7L System Placas preserves Cost/Venta/USD paste behavior and keeps private cost out of share text", async () => {
  const result = await runTs(`
    import { buildPlate } from './lib/internal/finance/plates-engine.ts';
    const cost=buildPlate({text:'Samsung Galaxy A17 128GB\\n$50.000\\nPantalla 6.7',mode:'cost',installmentPlans:[2,4,6]});
    const usd=buildPlate({text:'Motorola G15 256GB\\n150usd',mode:'usd',fxRate:1500,installmentPlans:[2,4,6],discountPercent:10});
    process.stdout.write(JSON.stringify({cost,usd}));
  `);
  assert.equal(result.cost.publicSalePrice, 90000);
  assert.equal(result.cost.privateAdmin.costArs, 50000);
  assert.match(result.cost.shareText, /2 cuotas fijas/);
  assert.doesNotMatch(result.cost.shareText, /50\.000|COSTO|markup/i);
  assert.equal(result.usd.privateAdmin.costUsd, 150);
  assert.equal(result.usd.privateAdmin.fxRate, 1500);
  assert.equal(result.usd.privateAdmin.costArs, 225000);
  assert.equal(result.usd.publicSalePrice, 304000);
});

test("Step 7L Admin cards and catalog workspace are designed for 1200+ products without rendering all cards", async () => {
  const result = await runTs(`
    import { adminCatalogScaleContract, filterAdminCatalog, getAdminCatalogWindow, nextAdminCatalogWindow } from './lib/internal/admin/catalog-scale.ts';
    import { buildAdminProductCardModel, adminProductCardContract } from './lib/internal/admin/product-card-model.ts';
    const products=Array.from({length:1247},(_,i)=>({id:String(i),name:'Producto '+i,category:i%2?'Celulares':'TV',supplier:i%3?'Stagliano':'Mega Electro',salePrice:100000+i,visible:i%5!==0,stockState:i%11===0?'out_of_stock':'in_stock',priceAge:i%7===0?'red':'green'}));
    const filtered=filterAdminCatalog(products,{category:'Celulares',supplier:'Stagliano'});
    const first=getAdminCatalogWindow(filtered,36);
    const next=nextAdminCatalogWindow(first.length,filtered.length);
    const card=buildAdminProductCardModel({id:'a17',name:'Samsung A17',imageUrl:null,supplier:'Stagliano',category:'Celulares',costArs:208000,salePrice:312000,visible:true,stockState:'low_stock',priceUpdatedAt:Date.now(),featured:true});
    process.stdout.write(JSON.stringify({contract:adminCatalogScaleContract,cardContract:adminProductCardContract,total:products.length,filtered:filtered.length,first:first.length,next,card}));
  `);
  assert.equal(result.contract.minimumSupportedProducts, 1200);
  assert.ok(result.contract.designTargetProducts >= 2000);
  assert.equal(result.contract.neverRenderEntireLargeCatalogAtOnce, true);
  assert.equal(result.total, 1247);
  assert.equal(result.first, 36);
  assert.ok(result.next <= 72);
  assert.equal(result.cardContract.legacyCardInteractionParityRequired, true);
  assert.equal(result.cardContract.premiumVisualLanguageRequired, true);
  assert.ok(result.card.primaryActions.some(x=>x.label==="Editar"));
  assert.ok(result.card.secondaryActions.some(x=>x.label==="Foto"));
  assert.ok(result.card.badges.includes("Últimas unidades"));
});

test("Step 7L keeps Calculator, Plates and product cards close at hand while writes stay blocked", async () => {
  const result = await runTs(`
    import { adminQuickActions, searchAdminCommands } from './lib/internal/admin/admin-workspace.ts';
    import { adminCenterFoundation } from './lib/internal/admin/admin-center-contract.ts';
    process.stdout.write(JSON.stringify({daily:adminQuickActions.filter(x=>x.daily),calc:searchAdminCommands('calculadora amarango'),plates:searchAdminCommands('placas'),foundation:adminCenterFoundation}));
  `);
  assert.ok(result.daily.some(x=>x.featureId==="finance.calculator"));
  assert.ok(result.daily.some(x=>x.featureId==="finance.plates"));
  assert.ok(result.calc.some(x=>x.featureId==="finance.calculator"));
  assert.ok(result.plates.some(x=>x.featureId==="finance.plates"));
  assert.equal(result.foundation.adminProductCardsRequired, true);
  assert.equal(result.foundation.adminCatalogMinimumScale, 1200);
  assert.equal(result.foundation.productionWritesEnabled, false);
  assert.equal(result.foundation.supabaseWritesEnabled, false);

  const preview = await source('prototypes/Admin-Center-Preview-Step7L.html');
  for (const text of ['Tarjetas administrativas premium','Calculadora AmarangoElectro','Sistema Placas','1.200+ productos','PROTOTIPO OFFLINE','ESCRITURAS OFF']) assert.match(preview, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'));
  assert.doesNotMatch(preview,/fetch\s*\(|XMLHttpRequest|createClient|\.insert\s*\(|\.upsert\s*\(|\.update\s*\(|\.rpc\s*\(/i);

  for (const file of ['components/internal/admin/admin-product-card.tsx','components/internal/admin/admin-product-grid.tsx','components/internal/admin/amarango-calculator-panel.tsx','components/internal/admin/plates-panel.tsx']) {
    const text=await source(file);
    assert.doesNotMatch(text,/fetch\s*\(|createClient|\.insert\s*\(|\.upsert\s*\(|\.update\s*\(|\.rpc\s*\(/i);
  }
});
