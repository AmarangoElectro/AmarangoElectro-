"use client";
import {useEffect,useRef,useState,type CSSProperties} from "react";
const heights=[5,8,13,8,17,23,14,9,20,26,15,8,13,21,27,17,11,22,16,9,13,6];
/** Decorative motion only: no audio is played. Pause offscreen or in a background tab. */
export function AudioWave({className=""}:{className?:string}){
 const ref=useRef<HTMLSpanElement>(null),[playing,setPlaying]=useState(false);
 useEffect(()=>{
  let inView=false;
  const update=()=>setPlaying(inView&&document.visibilityState==="visible");
  const observer=typeof IntersectionObserver!=="undefined"?new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;update()},{threshold:0.1}):null;
  if(ref.current&&observer)observer.observe(ref.current);else{inView=true;update()}
  document.addEventListener("visibilitychange",update);
  return()=>{observer?.disconnect();document.removeEventListener("visibilitychange",update)};
 },[]);
 return <span ref={ref} className={`audio-wave ${className}`} data-playing={playing} aria-hidden="true">{heights.map((height,i)=><i key={i} style={{"--wave-height":`${height}px`,"--wave-delay":`${-i*0.13}s`} as CSSProperties}/>)}</span>
}
