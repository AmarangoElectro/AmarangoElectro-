const normalize = (text:string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const technicalWords = /pantalla|ram|memoria|almacenamiento|procesador|c[aá]mara|bater[ií]a|potencia|capacidad|temperatura|rpm|litros|\d\s*(?:kg|w|mah|mp|gb|tb|hz|bar|psi|pulgadas|°c)\b|bluetooth|wi.?fi|usb|hdmi|inverter|timer|temporizador|grill|convecci[oó]n|medidas|dimensiones|\d+\s*(?:x|×)\s*\d+.*\bcm\b|voltaje|presi[oó]n|velocidad|funciones|carga|seguridad|amoled|oled|fhd|hd\+|full hd|uhd|4k|\d+(?:[.,]\d+)?\s*["″”]|snapdragon|helio|dimensity|exynos|octa.?core|resoluci[oó]n|sistema operativo|android|dolby|bajo consumo/i;
const marketingWords = /amarango|env[ií]o|cuotas|contado|precio|costo|mayorista|proveedor|markup|margen|comisi[oó]n|\$|whatsapp|instagram|facebook|garant[ií]a|stock|disponible|consult[aá]|https|www\.|@/i;
const aliases: [string,RegExp][] = [
  ["RAM",/^(?:memoria\s+)?ram$/], ["Almacenamiento",/^(?:almacenamiento|memoria interna|memoria de almacenamiento)$/],
  ["Pantalla",/^pantalla(?:\s+tactil)?$/], ["Resolución",/^resolucion(?:\s+de pantalla)?$/], ["Procesador",/^(?:procesador|cpu|chip)$/],
  ["Cámara",/^(?:camaras?|camara principal|camara trasera|camara triple)$/], ["Cámara frontal",/^camara frontal$/],
  ["Batería",/^bateria$/], ["Carga",/^carga(?:\s+rapida)?$/], ["Potencia",/^potencia(?:\s+de salida)?$/],
  ["Capacidad",/^capacidad(?:\s+de lavado|\s+neta)?$/], ["Velocidad",/^(?:velocidad|rpm|centrifugado)$/],
  ["Temperatura",/^temperatura(?:\s+ajustable)?$/], ["Temporizador",/^(?:temporizador|timer)$/], ["Funciones",/^funciones$/],
  ["Conectividad",/^(?:conectividad|conexion|conexiones)$/], ["Dimensiones",/^(?:medidas|dimensiones)$/],
  ["Sistema operativo",/^sistema operativo$/], ["Presión",/^presion$/], ["Voltaje",/^(?:voltaje|tension)$/],
];
export function canonicalSpecificationKey(key:string) {
  const clean=key.trim().replace(/:$/, "");
  return aliases.find(([,pattern])=>pattern.test(normalize(clean)))?.[0] ?? clean;
}
export function technicalSpecifications(specs:Record<string,string>) {
  return Object.fromEntries(Object.entries(specs).filter(([key,value])=>value?.trim()&&!/proveedor|mayorista|costo|markup|margen|comisi[oó]n/i.test(key)).map(([key,value])=>[canonicalSpecificationKey(key),value.trim()]));
}
const fields: [string,RegExp][] = [
  ["RAM",/\b(\d+(?:[.,]\d+)?\s*GB)\s*(?:DE\s*)?RAM\b/i],
  ["Almacenamiento",/\b(\d+\s*(?:GB|TB))\s*(?:DE\s*)?(?:ALMACENAMIENTO|MEMORIA INTERNA)\b/i],
  ["Batería",/\b(\d+(?:[.,]\d+)?\s*mAh)\b/i], ["Capacidad",/\b(\d+(?:[.,]\d+)?\s*(?:litros|L|kg))\b/i],
  ["Cámara",/\b(\d+\s*MP(?:\s*\+\s*\d+\s*MP)*)\b/i], ["Potencia",/\b(\d+(?:[.,]\d+)?\s*W)\b/i],
  ["Pantalla",/\b(\d+(?:[.,]\d+)?\s*(?:pulgadas|["″”]))/i], ["Velocidad",/\b(\d+\s*RPM)\b/i],
  ["Presión",/\b(\d+(?:[.,]\d+)?\s*(?:bar|PSI))\b/i], ["Voltaje",/\b(\d+\s*V)\b/i],
  ["Dimensiones",/\b(\d+(?:[.,]\d+)?\s*(?:x|×)\s*\d+(?:[.,]\d+)?(?:\s*(?:x|×)\s*\d+(?:[.,]\d+)?)?\s*cm)\b/i],
  ["Temperatura",/\b(\d+\s*°\s*C)/i], ["Temporizador",/\b(\d+\s*(?:minutos|min))\b/i],
];
function hasValue(line:string) {return /\d|bluetooth|wi.?fi|usb|hdmi|inverter|grill|convecci[oó]n|amoled|oled|full hd|uhd|snapdragon|helio|dimensity|exynos|octa.?core|android|dolby|bajo consumo/i.test(line)}

/** Literal OCR evidence only: no model lookup, price lookup or invented specifications. */
export function extractFlyerFacts(text: string) {
  const raw=text.split(/\n/).map(line=>line.trim().replace(/\s+/g," ").replace(/^[•●|]+\s*/,"")).filter(line=>line.length>=2&&line.length<=220);
  const lines:string[]=[];
  for(let i=0;i<raw.length;i++){
    let line=raw[i];
    if(/^\d+(?:[.,]\d+)?$/.test(line)&&/^(?:RPM|W|kg|L|mAh|MP|GB|TB|min|bar|PSI|V|°C)$/i.test(raw[i+1]??""))line+=` ${raw[++i]}`;
    const field=aliases.find(([,pattern])=>pattern.test(normalize(line.replace(/:$/,""))));
    if(field && raw[i+1] && !marketingWords.test(raw[i+1]) && hasValue(raw[i+1])) {
      line=`${field[0]}: ${raw[++i]}`;
      if(raw[i+1]&&/^(?:super )?(?:amoled|oled|fhd\+?|full hd|hd\+?|uhd|4k)\b/i.test(raw[i+1])&&!marketingWords.test(raw[i+1]))line+=` · ${raw[++i]}`;
    }
    // Corrupted numeric units (e.g. SOMP for 50MP) are not safe product evidence.
    if(!marketingWords.test(line)&&!/[A-Z]{2,}MP\b/i.test(line)&&technicalWords.test(line)&&hasValue(line))lines.push(line);
  }
  const features=[...new Set(lines)].slice(0,12),specifications:Record<string,string>={};
  for(const line of features){
    const colon=line.indexOf(":");
    if(colon>1&&colon<60&&line.slice(colon+1).trim()){
      const key=canonicalSpecificationKey(line.slice(0,colon)),value=line.slice(colon+1).trim();
      if(!specifications[key])specifications[key]=value;
      else if(key==="Pantalla"&&!specifications[key].includes(value))specifications[key]+=` · ${value}`;
    }
    for(const [field,pattern] of fields){
      const key=field==="Potencia"&&/carga/i.test(line)?"Carga":field==="Cámara"&&/frontal/i.test(line)?"Cámara frontal":field;
      const match=line.match(pattern);if(match&&!specifications[key])specifications[key]=match[1];
    }
    if(!specifications.Procesador){const match=line.match(/\b((?:Snapdragon|Helio|Dimensity|Exynos)\s+[\w+ -]{1,35}|Octa[- ]Core)/i);if(match)specifications.Procesador=match[1].trim()}
    if(!specifications.Resolución){const match=line.match(/\b(?:Full HD|FHD\+?|HD\+?|UHD|4K|8K)(?=\s|$|[·,;])/i);if(match)specifications.Resolución=match[0]}
    {const found=line.match(/\b(?:Bluetooth(?:\s+\d+(?:\.\d+)?)?|Wi-?Fi|USB(?:-C)?|HDMI)\b/gi);if(found)specifications.Conectividad=[...new Set([...(specifications.Conectividad?.split(" · ")??[]),...found])].join(" · ")}
  }
  return {features,specifications};
}
export function parseSpecificationLines(text:string) {
  const result:Record<string,string>={};
  for(const line of text.split("\n")){const index=line.indexOf(":");if(index>0&&line.slice(index+1).trim())result[canonicalSpecificationKey(line.slice(0,index))]=line.slice(index+1).trim()}
  return result;
}
