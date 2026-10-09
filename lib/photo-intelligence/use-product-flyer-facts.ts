"use client";
import {useEffect,useState} from "react";
import type {Product} from "@/lib/catalog/types";
import {factsForProduct,presentableProductFacts,type FlyerFacts} from "./product-facts";
import {technicalSpecifications} from "./flyer-text";

// One OCR job at a time. Cache only in this page's memory, scoped to the image URL.
const cache=new Map<string,Promise<FlyerFacts>>();
let queue:Promise<unknown>=Promise.resolve();
function read(src:string){
  const existing=cache.get(src);if(existing)return existing;
  const job=queue.catch(()=>{}).then(async()=>{const {readFlyer}=await import("./browser-flyer");return readFlyer(src,()=>{})});
  queue=job;cache.set(src,job);
  if(cache.size>80)cache.delete(cache.keys().next().value!);
  job.catch(()=>cache.delete(src));return job;
}
export function useProductFlyerFacts(products:readonly Product[],enabled=true){
  const [facts,setFacts]=useState<Record<string,{src:string;facts:FlyerFacts}>>({});
  const [reading,setReading]=useState(false);
  const signature=JSON.stringify(enabled?products.map(p=>[p.id,p.supplierImage?.src??p.image?.src,p.features.length,Object.keys(technicalSpecifications(p.specifications)).length]):[]);
  useEffect(()=>{
    if(!enabled)return;
    let active=true;
    const targets=products.filter(p=>(p.supplierImage??p.image)&&(p.features.length<4||Object.keys(technicalSpecifications(p.specifications)).length<4));
    if(!targets.length){setReading(false);return}
    setReading(true);
    Promise.allSettled(targets.map(async p=>{
      const src=p.supplierImage?.src??p.image!.src;
      const result=await read(src);
      if(active)setFacts(old=>({...old,[p.id]:{src,facts:result}}));
    })).then(()=>{if(active)setReading(false)});
    return()=>{active=false};
  },[signature]);
  return {reading,products:products.map(p=>{
    const saved=facts[p.id],src=p.supplierImage?.src??p.image?.src;
    return {...p,...(saved&&saved.src===src?factsForProduct(p,saved.facts):presentableProductFacts(p))};
  })};
}
