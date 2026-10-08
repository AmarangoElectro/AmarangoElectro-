import { extractFlyerFacts, technicalSpecifications } from "./flyer-text";
export type FlyerFacts=ReturnType<typeof extractFlyerFacts>;
export type FactProduct={name:string;features:readonly string[];specifications:Record<string,string>};

/** A supplier flyer for another storage variant must not override this product. */
export function factsForProduct(product:FactProduct,facts:FlyerFacts):FlyerFacts {
  const specifications=technicalSpecifications(facts.specifications);
  const known=technicalSpecifications(product.specifications);
  const named=[...product.name.matchAll(/\b\d+\s*(?:GB|TB)\b/gi)].filter(match=>!/^\s*(?:de\s*)?RAM\b/i.test(product.name.slice(match.index!+match[0].length)));
  const explicit=known.Almacenamiento??known.Memoria;
  const storage=(explicit&&/^\d+\s*(?:GB|TB)$/i.test(explicit)?explicit:named.at(-1)?.[0])?.replace(/\s/g,"").toUpperCase();
  const photoStorage=specifications.Almacenamiento?.replace(/\s/g,"").toUpperCase();
  if(storage&&photoStorage&&storage!==photoStorage){
    delete specifications.Almacenamiento;
    facts={...facts,features:facts.features.filter(line=>!/(almacenamiento|memoria interna)/i.test(line)&&!line.replace(/\s/g, "").toUpperCase().includes(photoStorage))};
  }
  const features=storage?facts.features.filter(line=>{
    if(/ram|ampliable|hasta|micro ?sd/i.test(line))return true;
    const memories=line.match(/\b\d+\s*(?:GB|TB)\b/gi)??[];
    return memories.every(value=>value.replace(/\s/g, "").toUpperCase()===storage);
  }):facts.features;
  return {features:[...new Set([...product.features,...features])].slice(0,12),specifications:{...specifications,...technicalSpecifications(product.specifications)}};
}
