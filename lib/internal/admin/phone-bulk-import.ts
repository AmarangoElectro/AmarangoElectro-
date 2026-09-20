import type { CommercePolicy } from "../finance/calculator-engine";
import { quoteSaleFromCost } from "../finance/calculator-engine";

export type PhoneBulkMode = "sale_ars" | "cost_usd";
export type MissingPhoneDecision = "keep" | "out_of_stock" | "trash";

export interface LegacyPhoneRecord {
  id?: string;
  name: string;
  salePrice: number;
  originalUsd?: number | null;
  fxRate?: number | null;
  colors?: readonly string[];
  imageUrl?: string | null;
  visible?: boolean;
  features?: string | null;
  category?: string | null;
  outOfStock?: boolean;
}

export interface ParsedPhoneLine {
  lineNumber: number;
  sourceLine: string;
  name: string | null;
  sourceAmount: number | null;
  colors: readonly string[];
  status: "ready" | "rejected";
  issues: readonly string[];
}

const COLOR_WORDS = new Set([
  "silver","blue","orange","black","white","yellow","green","red","purple","lavander","lavender","gold","gray","grey","pink","desert","natural","titanium","graphite","sage","mint","celeste","negro","blanco","azul","rojo","verde","dorado","plata","gris","rosa","violeta","lila","naranja",
]);

function stripOldWhatsappPrice(line: string): string {
  return line.replace(/\*?~[^~]*~\*?/g, " ").replace(/\s{2,}/g, " ").trim();
}

function hasPrice(line: string): boolean {
  return /\$\s*\d|[-–]\s*\$?\s*\d|\d{3,}|(?:usd|u\$s|us\$)\s*\d|\d\s*(?:usd|u\$s|us\$)/i.test(line);
}

function isContinuation(line: string): boolean {
  if (/^[-–$(]/.test(line) || /^\d/.test(line)) return true;
  if (!/\d/.test(line) && /^[a-zA-Záéíóúñ][a-zA-Záéíóúñ \-\/,]*$/.test(line) && line.length < 40) {
    const words = line.toLowerCase().split(/[-\/,\s]+/).filter(Boolean);
    return words.length > 0 && words.every((word) => COLOR_WORDS.has(word));
  }
  return false;
}

function hasName(line: string): boolean {
  if (isContinuation(line)) return false;
  const clean = line.replace(/\([^)]*\)/g, "").replace(/\$?\s*\d[\d.,]*/g, "").replace(/[^a-zA-Z0-9 ]/g, "").trim();
  return clean.length >= 3;
}

function isHeader(line: string): boolean {
  return !hasPrice(line) && /(sellado|gtia|garant|oficial|meses|^lista|precios|hay stock|consult)/i.test(line);
}

export function preprocessLegacyPhoneText(text: string): readonly { lineNumber: number; text: string }[] {
  const raw = text.split(/\r?\n/).map((line, index) => ({ lineNumber: index + 1, text: line.trim() })).filter((entry) => entry.text);
  const out: { lineNumber: number; text: string }[] = [];
  for (let index = 0; index < raw.length; index += 1) {
    const current = raw[index];
    if (isHeader(current.text)) continue;
    if (!hasName(current.text)) continue;
    let merged = current.text;
    let cursor = index + 1;
    while (cursor < raw.length && isContinuation(raw[cursor].text) && !hasName(raw[cursor].text)) {
      merged += ` ${raw[cursor].text}`;
      if (hasPrice(raw[cursor].text) && /\)/.test(raw[cursor].text)) { cursor += 1; break; }
      cursor += 1;
    }
    index = cursor - 1;
    out.push({ lineNumber: current.lineNumber, text: merged });
  }
  return out;
}

function parseNumber(token: string): number | null {
  const value = Number(token.replace(/\./g, "").replace(/,/g, "."));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function extractAmount(line: string): number | null {
  const usd = line.match(/(?:usd|u\$s|us\$|d[oó]lares?)\s*\$?\s*([\d][\d.,]*)/i) || line.match(/([\d][\d.,]*)\s*(?:usd|u\$s|us\$|d[oó]lares?)/i);
  if (usd) return parseNumber(usd[1]);
  const marked = line.match(/💲\s*\$?\s*([\d][\d.,]*)/) || line.match(/\$\s*([\d][\d.,]*)/) || line.match(/([\d][\d.,]*)\s*\$/);
  if (marked) return parseNumber(marked[1]);
  const candidates = (line.match(/[\d][\d.]*/g) ?? []).map(parseNumber).filter((value): value is number => value !== null);
  return candidates.length ? Math.max(...candidates) : null;
}

function extractColors(line: string): string[] {
  const match = line.match(/\(([^)]*)\)/);
  if (!match) return [];
  return match[1].split(/[-,\/]/).map((value) => value.trim()).filter((value) => /[a-zA-Záéíóúñ]{2,}/.test(value));
}

function cleanName(line: string): string {
  return line
    .replace(/\([^)]*\)/g, "")
    .replace(/(?:usd|u\$s|us\$|d[oó]lares?)\s*\$?\s*[\d][\d.,]*/ig, "")
    .replace(/[\d][\d.,]*\s*(?:usd|u\$s|us\$|d[oó]lares?)/ig, "")
    .replace(/\$\s*[\d][\d.,]*/g, "")
    .replace(/[\d][\d.,]*\s*\$/g, "")
    .replace(/[*_•▪️📱🍎]/g, "")
    .replace(/^\s*(?:〽️|〽|🔱|✳️|✳|◾|[-–—>»·\uFE0F])+/, "")
    .replace(/🇦🇷|🇺🇸|✅|✨|🔥|⭐️|⭐|❗|❕/g, "")
    .replace(/\s+(oferta|promo|nacional|liquidaci[oó]n|[uú]ltim[ao]s?|hay stock|sim f[ií]sica|\d+\s*ram)\b.*$/i, "")
    .replace(/[\s\-–—,]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function parseLegacyPhoneList(text: string, mode: PhoneBulkMode): readonly ParsedPhoneLine[] {
  return preprocessLegacyPhoneText(text).map(({ lineNumber, text: sourceLine }) => {
    const clean = stripOldWhatsappPrice(sourceLine);
    const amount = extractAmount(clean);
    const minimum = mode === "cost_usd" ? 20 : 1000;
    const name = cleanName(clean);
    const issues: string[] = [];
    if (!amount || amount < minimum) issues.push("price_not_found_or_below_mode_minimum");
    if (!name || name.length < 2) issues.push("name_not_found");
    return { lineNumber, sourceLine, name: name || null, sourceAmount: amount, colors: extractColors(clean), status: issues.length ? "rejected" : "ready", issues };
  });
}

export function canonicalPhoneKey(name: string): string {
  let source = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const brands: readonly [RegExp,string][] = [
    [/\b(moto|motorola)\b/,"motorola"],[/\b(iph|iphone|apple)\b/,"iphone"],[/\b(sams|samsung|sam)\b/,"samsung"],[/\b(xiao|xiaomi|redmi|poco|mi)\b/,"xiaomi"],[/\b(hon|honor)\b/,"honor"],[/\b(huaw|huawei)\b/,"huawei"],[/\b(realme)\b/,"realme"],[/\b(oppo)\b/,"oppo"],[/\b(vivo)\b/,"vivo"],[/\b(nokia)\b/,"nokia"],[/\b(tcl)\b/,"tcl"],[/\b(zte)\b/,"zte"],[/\b(lg)\b/,"lg"],[/\b(alcatel)\b/,"alcatel"],[/\b(infinix)\b/,"infinix"],[/\b(tecno)\b/,"tecno"],
  ];
  let brand = "";
  for (const [pattern, canonical] of brands) if (pattern.test(source)) { brand = canonical; break; }
  let memory = "";
  const tb = source.match(/(\d+)\s*tb\b/);
  if (tb) memory = String(Number(tb[1]) * 1024);
  else memory = (source.match(/\b(\d{2,4})\s*gb\b/) || source.match(/\b(16|32|64|128|256|512|1024)\b/))?.[1] ?? "";
  const ram = (source.match(/\b(\d{1,2})\s*(?:\+|\/)\s*\d{2,4}\b/) || source.match(/\b(\d{1,2})\s*gb\s*ram\b/))?.[1] ?? "";
  source = source
    .replace(/\b(moto|motorola|iph|iphone|apple|sams|samsung|sam|xiao|xiaomi|redmi|poco|mi|hon|honor|huaw|huawei|realme|oppo|vivo|nokia|tcl|zte|lg|alcatel|infinix|tecno)\b/g," ")
    .replace(/\b\d+\s*tb\b/g," ").replace(/\b\d{2,4}\s*gb\b/g," ").replace(/\b\d{1,2}\s*(?:\+|\/)\s*\d{2,4}\b/g," ").replace(/\b\d{1,2}\s*gb\s*ram\b/g," ")
    .replace(/\b(ram|dual|sim|global|nacional|libre|nuevo|nueva|sellado|4g|5g|lte|gb|tb)\b/g," ").replace(/[^a-z0-9]/g," ").replace(/\s+/g," ").trim();
  if (memory) source = source.replace(new RegExp(`\\b${memory}\\b`), "").replace(/\s+/g," ").trim();
  const model = source.replace(/\s+/g, "");
  return [brand, model, memory, ram].filter(Boolean).join("-") || name.toLowerCase().replace(/\s+/g," ").trim();
}

export interface PhoneImportPreview {
  updates: readonly { previous: LegacyPhoneRecord; next: LegacyPhoneRecord }[];
  creates: readonly LegacyPhoneRecord[];
  missing: readonly LegacyPhoneRecord[];
  rejected: readonly ParsedPhoneLine[];
  missingDecisionRequired: boolean;
  writeAllowed: false;
}

export function buildLegacyPhoneImportPreview(
  parsed: readonly ParsedPhoneLine[], existing: readonly LegacyPhoneRecord[], mode: PhoneBulkMode, fxRate: number | null, policy: CommercePolicy,
): PhoneImportPreview {
  if (mode === "cost_usd" && (!fxRate || fxRate <= 0)) throw new Error("fx_rate_required");
  const existingByKey = new Map(existing.map((phone) => [canonicalPhoneKey(phone.name), phone]));
  const seen = new Set<string>();
  const updates: { previous: LegacyPhoneRecord; next: LegacyPhoneRecord }[] = [];
  const creates: LegacyPhoneRecord[] = [];
  const rejected: ParsedPhoneLine[] = [];
  for (const line of parsed) {
    if (line.status !== "ready" || !line.name || !line.sourceAmount) { rejected.push(line); continue; }
    const key = canonicalPhoneKey(line.name); seen.add(key);
    const previous = existingByKey.get(key);
    const salePrice = mode === "sale_ars" ? Math.round(line.sourceAmount) : quoteSaleFromCost(Math.round(line.sourceAmount * (fxRate ?? 0)), policy).salePrice;
    const base: LegacyPhoneRecord = {
      name: line.name, salePrice, originalUsd: mode === "cost_usd" ? line.sourceAmount : null, fxRate: mode === "cost_usd" ? fxRate : null, colors: line.colors, outOfStock:false,
      imageUrl: previous?.imageUrl ?? null, visible: previous?.visible ?? false, features: previous?.features ?? null, category: previous?.category ?? "Celulares",
      ...(previous?.id ? { id: previous.id } : {}),
    };
    if (previous) updates.push({ previous, next: base });
    else creates.push({ ...base, visible:false });
  }
  const missing = existing.filter((phone) => !seen.has(canonicalPhoneKey(phone.name)));
  return { updates, creates, missing, rejected, missingDecisionRequired: missing.length > 0, writeAllowed:false };
}

export function previewPhoneFxUpdate(existing: readonly LegacyPhoneRecord[], fxRate: number, policy: CommercePolicy) {
  if (!(fxRate > 0)) throw new Error("invalid_fx_rate");
  const updates = existing.filter((phone) => (phone.originalUsd ?? 0) > 0).map((phone) => ({
    previous: phone,
    next: { ...phone, fxRate, salePrice: quoteSaleFromCost(Math.round((phone.originalUsd ?? 0) * fxRate), policy).salePrice },
  }));
  return { updates, writeAllowed:false as const };
}
