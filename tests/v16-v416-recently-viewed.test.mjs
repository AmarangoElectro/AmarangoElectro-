import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const root = new URL("../", import.meta.url);
const source = (path) => readFile(new URL(path, root), "utf8");

async function runStore(script) {
  const { stdout } = await execFileAsync(
    process.execPath,
    ["--experimental-strip-types", "--input-type=module", "-e", script],
    { cwd: root },
  );
  return JSON.parse(stdout);
}

test("V4.16 uses the exact versioned local schema and keeps six unique IDs", async () => {
  const result = await runStore(`
    import { parseRecentlyViewedSnapshot, recentlyViewedKey, recentlyViewedLimit, recentlyViewedVersion } from './lib/commerce/recently-viewed-store.ts';
    const ids = parseRecentlyViewedSnapshot(JSON.stringify({version:1,ids:['a','b','a','c','d','e','f','g']}));
    process.stdout.write(JSON.stringify({ids,recentlyViewedKey,recentlyViewedLimit,recentlyViewedVersion}));
  `);
  assert.equal(result.recentlyViewedKey, "amarango:v16:recently-viewed");
  assert.equal(result.recentlyViewedVersion, 1);
  assert.equal(result.recentlyViewedLimit, 6);
  assert.deepEqual(result.ids, ["a", "b", "c", "d", "e", "f"]);
});

test("V4.16 MRU persistence moves a repeated product first without storing product data", async () => {
  const result = await runStore(`
    const memory = new Map();
    globalThis.window = {localStorage:{getItem:(key)=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value),removeItem:(key)=>memory.delete(key)},dispatchEvent(){},addEventListener(){},removeEventListener(){}};
    const store = await import('./lib/commerce/recently-viewed-store.ts');
    for (const id of ['a','b','c','d','e','f','g','c']) store.rememberRecentlyViewed(id);
    process.stdout.write(JSON.stringify({stored:JSON.parse(memory.get(store.recentlyViewedKey)),keys:Object.keys(JSON.parse(memory.get(store.recentlyViewedKey)))}));
  `);
  assert.deepEqual(result.stored, { version: 1, ids: ["c", "g", "f", "e", "d", "b"] });
  assert.deepEqual(result.keys, ["version", "ids"]);
});

test("V4.16 repairs Step 7H arrays and corrupt or blocked storage fails safely", async () => {
  const result = await runStore(`
    const memory = new Map([['amarango:v16:recently-viewed',JSON.stringify(['a','b','a'])]]);
    globalThis.window = {localStorage:{getItem:(key)=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value),removeItem:(key)=>memory.delete(key)},dispatchEvent(){},addEventListener(){},removeEventListener(){}};
    const store = await import('./lib/commerce/recently-viewed-store.ts');
    const legacy = JSON.parse(store.getRecentlyViewedSnapshot());
    memory.set(store.recentlyViewedKey, '{broken');
    const corrupt = JSON.parse(store.getRecentlyViewedSnapshot());
    globalThis.window.localStorage = {getItem(){throw new Error('blocked')},setItem(){throw new Error('blocked')},removeItem(){throw new Error('blocked')}};
    const blocked = JSON.parse(store.getRecentlyViewedSnapshot());
    process.stdout.write(JSON.stringify({legacy,corrupt,blocked}));
  `);
  assert.deepEqual(result.legacy, { version: 1, ids: ["a", "b"] });
  assert.deepEqual(result.corrupt, { version: 1, ids: [] });
  assert.deepEqual(result.blocked, { version: 1, ids: [] });
});

test("V4.16 projection is public, availability-safe and fail-closed for duplicate identity", async () => {
  const result = await runStore(`
    import { projectRecentlyViewedProducts } from './lib/commerce/recently-viewed-store.ts';
    const product=(id,patch={})=>({id,slug:id,name:id,brand:'Marca',model:null,category:'x',subcategory:null,image:null,price:null,financing:[],availability:'available',stock:{status:'in_stock',quantity:null,label:null},features:[],specifications:{},description:null,warranty:null,visible:true,source:'mock',...patch});
    const products=[product('ok'),product('unknown',{availability:'unknown',stock:{status:'unknown',quantity:null,label:null}}),product('hidden',{visible:false}),product('unavailable',{availability:'unavailable'}),product('out',{stock:{status:'out_of_stock',quantity:0,label:null}}),product('duplicate'),product('duplicate')];
    const projected=projectRecentlyViewedProducts(['missing','hidden','unavailable','out','duplicate','unknown','ok'],products);
    process.stdout.write(JSON.stringify({ids:projected.ids,products:projected.products.map((item)=>item.id)}));
  `);
  assert.deepEqual(result.ids, ["unknown", "ok"]);
  assert.deepEqual(result.products, ["unknown", "ok"]);
});

test("V4.16 PDP emits the local product-viewed event only from a visible document", async () => {
  const recorder = await source("app/components/recently-viewed-recorder.tsx");
  const store = await source("lib/commerce/recently-viewed-store.ts");
  assert.match(store, /amarango:product-viewed/);
  assert.match(recorder, /document\.visibilityState !== "visible"/);
  assert.match(recorder, /new CustomEvent\(productViewedEvent/);
  assert.match(recorder, /visibilitychange/);
  assert.match(recorder, /rememberRecentlyViewed\(productId\)/);
});

test("V4.16 is limited to public storefront routes and responsive native scrolling", async () => {
  const [home, category, product, rail, css, admin, advisor] = await Promise.all([
    source("app/page.tsx"),
    source("app/categoria/[slug]/page.tsx"),
    source("app/producto/[slug]/page.tsx"),
    source("app/components/recently-viewed-rail.tsx"),
    source("app/globals.css"),
    source("app/components/admin-consolidated-workspace.tsx"),
    source("app/components/advisor-workspace.tsx"),
  ]);
  assert.match(home, /RecentlyViewedRail/);
  assert.match(category, /catalog\.listProducts\(\{ visibleOnly: true \}\)/);
  assert.match(product, /catalog\.listProducts\(\{ visibleOnly: true \}\)/);
  assert.match(rail, /projectRecentlyViewedProducts/);
  assert.match(rail, /loading="lazy"/);
  assert.match(css, /scroll-snap-type: x mandatory/);
  assert.match(css, /contain: layout paint/);
  assert.doesNotMatch([admin, advisor].join("\n"), /RecentlyViewed/);
  assert.doesNotMatch([home, category, product, rail].join("\n"), /SUPABASE|service_role|sessionStorage|cost|provider/i);
});
