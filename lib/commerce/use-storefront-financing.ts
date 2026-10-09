"use client";
import {useEffect,useState} from "react";
import type {Product,FinancingOption} from "@/lib/catalog/types";
import {loadStorefrontFinancing} from "./storefront-financing";

export function useStorefrontFinancing(products:readonly Product[],enabled=true) {
  const [data,setData]=useState<Record<string,FinancingOption[]>>({});
  const [loading,setLoading]=useState(false);
  const signature=products.map(product=>`${product.id}:${product.price?.amount??""}`).join("|");
  useEffect(()=>{
    if(!enabled || !products.length)return;
    let disposed=false;setLoading(true);setData({});
    Promise.all(products.map(async product=>[product.id,await loadStorefrontFinancing(product)] as const)).then(entries=>{if(!disposed)setData(Object.fromEntries(entries))}).finally(()=>{if(!disposed)setLoading(false)});
    return()=>{disposed=true};
    // The identity/price signature deliberately ignores unrelated card state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[signature,enabled]);
  return {data,loading};
}
