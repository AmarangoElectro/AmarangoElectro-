const technicalWords = /pantalla|ram|memoria|almacenamiento|procesador|cámara|camara|batería|bateria|potencia|capacidad|temperatura|rpm|litros|\bkg\b|\bw\b|\bmah\b|\bmp\b|\bgb\b|\bl\b|bluetooth|wifi|wi-fi|usb|hdmi|inverter|timer|temporizador|grill|convección|conveccion|medidas|dimensiones|voltaje|presión|presion|velocidad|funciones|carga|seguridad/i;
const marketingWords = /amarango|envío|envio|cuotas|contado|precio|\$|whatsapp|instagram|facebook|garantía|garantia|stock|disponible|consultá|consulta|https|www\.|@/i;

/** Literal OCR evidence only: no model lookup or inferred specifications. */
export function extractFlyerFacts(text: string) {
  const lines = [...new Set(text.split(/\n/).map(line=>line.trim().replace(/\s+/g," ")).filter(line=>line.length>=4&&line.length<=220&&!marketingWords.test(line)))];
  const features = lines.filter(line=>technicalWords.test(line)).slice(0,12);
  const specifications: Record<string,string> = {};
  for (const line of features) {
    const colon = line.indexOf(":");
    if (colon>1&&colon<60) { specifications[line.slice(0,colon).trim()]=line.slice(colon+1).trim(); continue; }
    const fields: [string,RegExp][] = [["RAM",/\b(\d+(?:[.,]\d+)?\s*GB)\s*(?:DE\s*)?RAM\b/i],["Almacenamiento",/\b(\d+\s*GB)\s*(?:DE\s*)?(?:ALMACENAMIENTO|MEMORIA INTERNA)\b/i],["Potencia",/\b(\d+(?:[.,]\d+)?\s*W)\b/i],["Batería",/\b(\d+[.,]?\d*\s*mAh)\b/i],["Capacidad",/\b(\d+(?:[.,]\d+)?\s*(?:litros|L|kg))\b/i],["Cámara",/\b(\d+\s*MP)\b/i]];
    for (const [key,pattern] of fields) { const match=line.match(pattern); if(match&&!specifications[key])specifications[key]=match[1]; }
  }
  return {features,specifications};
}

export function parseSpecificationLines(text:string) {
  const result:Record<string,string>={};
  for(const line of text.split("\n")){const index=line.indexOf(":");if(index>0&&line.slice(index+1).trim())result[line.slice(0,index).trim()]=line.slice(index+1).trim()}
  return result;
}
