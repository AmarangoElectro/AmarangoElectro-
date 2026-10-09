const normalize = (text:string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const technicalWords = /chip|pantalla|ram|memoria|almacenamiento|procesador|c[aá]mara|bater[ií]a|potencia|capacidad|temperatura|rpm|litros|\d\s*(?:kg|w|mah|mp|gb|tb|hz|bar|psi|pulgadas|°c)\b|bluetooth|wi.?fi|usb|hdmi|inverter|timer|temporizador|grill|convecci[oó]n|medidas|dimensiones|\d+\s*(?:x|×)\s*\d+.*\bcm\b|voltaje|presi[oó]n|velocidad|funciones|carga|seguridad|amoled|oled|fhd|hd\+|full hd|uhd|4k|\d+(?:[.,]\d+)?\s*["″”]|snapdragon|helio|dimensity|exynos|octa.?core|resoluci[oó]n|sistema operativo|android|dolby|bajo consumo/i;
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
    if(!specifications.Procesador){const match=line.match(/\b((?:Snapdragon|Helio|Dimensity|Exynos)\s+[\w+ -]{1,35}|Octa[- ]Core|A\d{1,2}(?:\s+(?:Pro|Bionic))?)/i);if(match)specifications.Procesador=match[1].trim()}
    if(/\b(?:AMOLED|OLED|Super Retina XDR|Retina)\b/i.test(line))specifications["Tecnología de pantalla"]=line.match(/\b(?:Super AMOLED|AMOLED|OLED|Super Retina XDR|Retina)\b/i)![0];
    if(/\b(?:grill|convecci[oó]n|inverter|bajo consumo)\b/i.test(line)&&!specifications.Funciones)specifications.Funciones=(line.match(/\b(?:grill|convecci[oó]n|inverter|bajo consumo)\b/gi)??[]).join(" · ");
    if(!specifications.Resolución){const match=line.match(/\b(?:Full HD|FHD\+?|HD\+?|UHD|4K|8K)(?=\s|$|[·,;])/i);if(match)specifications.Resolución=match[0]}
    {const found=line.match(/\b(?:Bluetooth(?:\s+\d+(?:\.\d+)?)?|Wi-?Fi|USB(?:-C)?|HDMI)\b/gi);if(found)specifications.Conectividad=[...new Set([...(specifications.Conectividad?.split(" · ")??[]),...found])].join(" · ")}
  }
  const clean=cleanFlyerSpecifications(specifications);
  return {features:Object.entries(clean).map(([key,value])=>`${key}: ${value}`),specifications:clean};
}
export function parseSpecificationLines(text:string) {
  const result:Record<string,string>={};
  for(const line of text.split("\n")){const index=line.indexOf(":");if(index>0&&line.slice(index+1).trim())result[canonicalSpecificationKey(line.slice(0,index))]=line.slice(index+1).trim()}
  return result;
}

/** Only complete, recognizable values are suitable for customer-facing facts. */
export function cleanFlyerSpecifications(input:Record<string,string>) {
  const output:Record<string,string>={};
  for(const [rawKey,rawValue] of Object.entries(input)){
    const key=canonicalSpecificationKey(rawKey),value=rawValue.trim().replace(/\s+/g," ");
    if(!value||value.length>110||marketingWords.test(value)||/[A-Z]{2,}MP\b/i.test(value))continue;
    const unit=fields.find(([field])=>(!["RAM","Almacenamiento"].includes(key)&&field===key)||(key==="Cámara frontal"&&field==="Cámara")||(key==="Carga"&&field==="Potencia"));
    if(unit){
      const match=value.match(unit[1]);
      if(!match)continue;
      // Do not attach a whole OCR paragraph to a short numerical value.
      if(key==="Pantalla"){
        const technology=value.match(/\b(?:Super AMOLED|AMOLED|OLED|Super Retina XDR|Retina|Full HD|FHD\+?|HD\+?|UHD|4K|8K|ProMotion)\b/gi)??[];
        output[key]=[match[1],...new Set(technology)].join(" · ");
      }else output[key]=match[1];
      continue;
    }
    if(key==="RAM"||key==="Almacenamiento"||key==="Memoria"){
      const match=value.match(/^\d+\s*(?:GB|TB)$/i);if(match)output[key==="Memoria"?"Almacenamiento":key]=match[0];continue;
    }
    if(key==="Procesador"){
      const match=value.match(/^(?:Octa[- ]Core|A\d{1,2}(?:\s+(?:Pro|Bionic))?|(?:Snapdragon\s+(?:\d{3}[A-Za-z+]*|\d(?:\s*[+s])?\s+Gen\s+\d|X\s+(?:Elite|Plus))|Helio\s+[A-Za-z]?\d+[A-Za-z]*|Dimensity\s+\d+[A-Za-z]*(?:\s+(?:Ultra|Plus))?|Exynos\s+\d+))$/i);
      if(match)output[key]=match[0];continue;
    }
    if(key==="Resolución"){
      const match=value.match(/^(?:Full HD|FHD\+?|HD\+?|UHD|4K|8K|\d+\s*[x×]\s*\d+)$/i);if(match)output[key]=match[0];continue;
    }
    if(key==="Tecnología de pantalla"){
      const match=value.match(/^(?:Super AMOLED|AMOLED|OLED|Super Retina XDR|Retina)$/i);if(match)output[key]=match[0];continue;
    }
    if(key==="Conectividad"){
      const matches=value.match(/\b(?:Bluetooth(?:\s+\d+(?:\.\d+)?)?|Wi-?Fi|USB(?:-C)?|HDMI)\b/gi);
      if(matches)output[key]=[...new Set(matches)].join(" · ");continue;
    }
    if(key==="Funciones"){
      const matches=value.match(/\b(?:grill|convecci[oó]n|inverter|bajo consumo)\b/gi);
      if(matches)output[key]=[...new Set(matches)].join(" · ");continue;
    }
    if(key==="Sistema operativo"&&/^(?:Android|Google TV|Android TV|WebOS|Tizen|iOS)(?:\s+\d+(?:\.\d+)*)?$/i.test(value))output[key]=value;
    if(key==="Colores"&&/^[\p{L} ,/-]{2,65}$/u.test(value)&&!technicalWords.test(value))output[key]=value;
  }
  return output;
}
