import { extractFlyerFacts, cleanFlyerSpecifications } from "./flyer-text";
export type FlyerFacts=ReturnType<typeof extractFlyerFacts>;
export type FactProduct={name:string;features:readonly string[];specifications:Record<string,string>};

/** A supplier flyer for another storage variant must not override this product. */
export function factsForProduct(product:FactProduct,facts:FlyerFacts):FlyerFacts {
  const existing=extractFlyerFacts(product.features.join("\n"));
  const specifications=cleanFlyerSpecifications({...existing.specifications,...facts.specifications});
  const known=cleanFlyerSpecifications(product.specifications);
  const named=[...product.name.matchAll(/\b\d+\s*(?:GB|TB)\b/gi)].filter(match=>!/^\s*(?:de\s*)?RAM\b/i.test(product.name.slice(match.index!+match[0].length)));
  const explicit=known.Almacenamiento??known.Memoria;
  const storage=(explicit&&/^\d+\s*(?:GB|TB)$/i.test(explicit)?explicit:named.at(-1)?.[0])?.replace(/\s/g,"").toUpperCase();
  const photoStorage=specifications.Almacenamiento?.replace(/\s/g,"").toUpperCase();
  if(storage&&photoStorage&&storage!==photoStorage){
    delete specifications.Almacenamiento;
    facts={...facts,features:facts.features.filter(line=>!/(almacenamiento|memoria interna)/i.test(line)&&!line.replace(/\s/g, "").toUpperCase().includes(photoStorage))};
  }
  const combined={...specifications,...known,...(storage?{Almacenamiento:explicit??named.at(-1)![0]}:{})};
  return {features:Object.entries(combined).filter(([key])=>key!=="Colores").map(([key,value])=>`${key}: ${value}`).slice(0,12),specifications:combined};
}

export function presentableProductFacts(product:FactProduct):FlyerFacts {return factsForProduct(product,{features:[],specifications:{}});}
