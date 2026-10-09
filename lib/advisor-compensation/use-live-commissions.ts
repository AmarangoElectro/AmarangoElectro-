'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import type {CommissionWorkspace} from './live-model';

/** Read existing facts only; abort overlapping reads and discard obsolete responses. */
export function useLiveCommissions(){
 const [data,setData]=useState<CommissionWorkspace|null>(null);
 const [status,setStatus]=useState('loading');
 const mounted=useRef(false),current=useRef<AbortController|null>(null);
 const refresh=useCallback(async()=>{
  current.current?.abort();
  const controller=new AbortController();current.current=controller;
  try{
   const response=await fetch('/api/v16/commissions',{cache:'no-store',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(15000)])});
   const body=await response.json();
   if(!mounted.current||current.current!==controller)return;
   if(response.ok&&body.status==='ok'){setData(body.data);setStatus('ok')}
   else{setData(null);setStatus(body.status??'not_connected')}
  }catch{
   if(mounted.current&&current.current===controller&&!controller.signal.aborted){setData(null);setStatus('not_connected')}
  }
 },[]);
 useEffect(()=>{
  mounted.current=true;void refresh();
  const id=setInterval(()=>{if(!document.hidden)void refresh()},30000);
  const focus=()=>void refresh();window.addEventListener('focus',focus);
  return()=>{mounted.current=false;current.current?.abort();clearInterval(id);window.removeEventListener('focus',focus)};
 },[refresh]);
 return {data,status,refresh};
}
