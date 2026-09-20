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

test("Step 7M exposes exactly the approved 11-category architecture while preserving V16 compatibility routes", async () => {
  const result = await runTs(`
    import { categories, navigationCategories, compatibilityCategories, primaryCategories, moreCategories, fallbackCategory, getActiveSubcategories, getPlannedSubcategories, getCompatibilitySubcategories, getBannerSlots } from './lib/catalog/categories.ts';
    const bySlug=Object.fromEntries(categories.map(x=>[x.slug,x]));
    const gaming=bySlug.gaming;
    process.stdout.write(JSON.stringify({all:categories.map(x=>x.slug),navigation:navigationCategories.map(x=>x.slug),compatibility:compatibilityCategories.map(x=>x.slug),primary:primaryCategories.map(x=>x.slug),more:moreCategories.map(x=>x.slug),fallback:fallbackCategory?.slug,electro:getActiveSubcategories(bySlug.electrodomesticos).map(x=>x.slug),hogar:getActiveSubcategories(bySlug.hogar).map(x=>x.slug),gamingActive:getActiveSubcategories(gaming).map(x=>x.slug),gamingPlanned:getPlannedSubcategories(gaming).map(x=>x.slug),gamingCompatibility:getCompatibilitySubcategories(gaming).map(x=>x.slug),banners:getBannerSlots()}));
  `);
  assert.deepEqual(result.navigation,["electrodomesticos","herramientas","tecnologia-accesorios","hogar","descanso","cuidado-personal-salud","bebes-juguetes","auto-motos-energia","camping-aire-libre-mascotas","gaming","otros"]);
  assert.deepEqual(result.compatibility,["celulares","smart-tv","audio"]);
  for (const slug of result.compatibility) assert.ok(result.all.includes(slug), `compatibility route ${slug} must remain addressable`);
  assert.deepEqual(result.electro,["refrigeracion","climatizacion","coccion","lavado","pequenos-electrodomesticos","limpieza"]);
  assert.deepEqual(result.hogar,["hogar-y-deco","bazar-y-mesa","blanqueria"]);
  assert.deepEqual(result.gamingActive,["playstation"]);
  assert.deepEqual(result.gamingPlanned,["xbox","nintendo","accesorios-gamer"]);
  assert.deepEqual(result.gamingCompatibility,["juegos","joysticks"]);
  assert.equal(result.fallback,"otros");
  assert.ok(result.banners.every(slot=>!result.compatibility.includes(slot.categorySlug)), "compatibility routes are not counted as Step 7M banner universes");
  assert.ok(result.banners.length>result.navigation.length, "important active subcategories must own banner slots");
});

test("Step 7M taxonomy recognizes requested sectors and does not send known products to Otros", async () => {
  const result = await runTs(`
    import { resolveTaxonomyLabel, getFallbackTaxonomyMatch, taxonomyGovernance } from './lib/catalog/taxonomy.ts';
    const labels=['heladera no frost','lavarropas automatico','colchones king','cargador usb c','juguetes infantiles','accesorio para auto','carpa camping','alimento mascotas','taladro percutor','PlayStation 5 juego'];
    process.stdout.write(JSON.stringify({matches:labels.map(label=>({label,match:resolveTaxonomyLabel(label)})),fallback:getFallbackTaxonomyMatch(),gov:taxonomyGovernance}));
  `);
  const slugs=result.matches.map(x=>x.match?.category?.slug);
  assert.deepEqual(slugs,["electrodomesticos","electrodomesticos","descanso","tecnologia-accesorios","bebes-juguetes","auto-motos-energia","camping-aire-libre-mascotas","camping-aire-libre-mascotas","herramientas","gaming"]);
  assert.ok(result.matches.every(x=>x.match?.category?.slug!=="otros"));
  assert.equal(result.fallback.category.slug,"otros");
  assert.equal(result.gov.noAutomaticProductionReclassification,true);
});

test("Step 7M Admin filters scale hierarchically for 1200+ products and banner assets remain replaceable", async () => {
  const result = await runTs(`
    import { filterAdminCatalog, getAdminCatalogWindow, adminCatalogScaleContract } from './lib/internal/admin/catalog-scale.ts';
    import { getAdminCategoryOverview, adminCategoryManagementContract } from './lib/internal/admin/category-management.ts';
    const products=Array.from({length:1500},(_,i)=>({id:String(i),name:'Producto '+i,category:i%3===0?'Electrodomésticos':'Hogar',subcategory:i%6===0?'Refrigeración':'Bazar y mesa',supplier:i%2?'A':'B',salePrice:1000+i,visible:true,stockState:'in_stock',priceAge:'green'}));
    const filtered=filterAdminCatalog(products,{category:'Electrodomésticos',subcategory:'Refrigeración'});
    process.stdout.write(JSON.stringify({total:products.length,filtered:filtered.length,window:getAdminCatalogWindow(filtered,36).length,scale:adminCatalogScaleContract,overview:getAdminCategoryOverview(),admin:adminCategoryManagementContract}));
  `);
  assert.equal(result.total,1500);
  assert.equal(result.window,36);
  assert.ok(result.filtered>0);
  assert.equal(result.scale.neverRenderEntireLargeCatalogAtOnce,true);
  assert.ok(result.overview.awaitingBannerSlots>0);
  assert.equal(result.admin.bannerAssetReplacementWithoutCodeChange,true);
  assert.equal(result.admin.previewBeforeBulkReclassification,true);
  assert.equal(result.overview.categoryCount,11);
  assert.equal(result.overview.compatibilityRouteCount,3);
  assert.equal(result.overview.plannedSubcategoryCount,3);
});

test("Step 7M navigation uses banners and quick access without activating production writes", async () => {
  const home=await source('app/page.tsx');
  const retail=await source('lib/catalog/retail-categories.ts');
  const category=await source('app/categoria/[slug]/page.tsx');
  const banner=await source('app/components/subcategory-banner-card.tsx');
  const admin=await source('components/internal/admin/admin-category-manager.tsx');
  assert.match(home,/RetailCategoryShowcase/);
  assert.match(retail,/22 entradas comerciales/);
  assert.match(category,/subcategory-banner-grid/);
  assert.match(category,/activeSector/);
  assert.match(banner,/Entrar al sector/);
  assert.match(admin,/Arquitectura preparada para catálogo grande/);
  for (const text of [home,retail,category,banner,admin]) assert.doesNotMatch(text,/fetch\s*\(|createClient|\.insert\s*\(|\.upsert\s*\(|\.update\s*\(|\.rpc\s*\(/i);
});
