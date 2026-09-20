import type {
  BulkPriceParseOptions,
  ParsedCurrency,
  ParsedPriceKind,
  ParsedPriceLine,
} from "./types";

const USD_MARKER = /(?:usd\b|u\$s|us\$)/i;
const ARS_MARKER = /(?:\bars\b|ars\$)/i;

function cleanAmount(raw: string): number | null {
  const compact = raw.replace(/\s/g, "").replace(/[^\d.,]/g, "");
  if (!compact) return null;

  // Price lists are integer-oriented. Dots/commas are treated as thousands
  // separators unless the final group is clearly decimal; decimals are rejected
  // to avoid silently changing a supplier value.
  const decimalLike = compact.match(/[.,](\d{1,2})$/);
  if (decimalLike) return null;
  const digits = compact.replace(/[.,]/g, "");
  if (!/^\d+$/.test(digits)) return null;
  const amount = Number(digits);
  return Number.isSafeInteger(amount) && amount > 0 ? amount : null;
}

function splitNameAndPrice(line: string): { name: string; priceText: string } | null {
  const pipe = line.lastIndexOf("|");
  if (pipe >= 0) {
    const name = line.slice(0, pipe).trim();
    const priceText = line.slice(pipe + 1).trim();
    return name && priceText ? { name, priceText } : null;
  }

  const explicitUsd = line.match(/(?:u\$s|us\$|usd\b)\s*[:$]?\s*([\d.,]+)|([\d.,]+)\s*(?:u\$s|us\$|usd\b)/i);
  if (explicitUsd) {
    const token = explicitUsd[0];
    const index = explicitUsd.index ?? line.lastIndexOf(token);
    const name = `${line.slice(0, index)} ${line.slice(index + token.length)}`.replace(/[-–—:\s]+$/g, "").trim();
    return name ? { name, priceText: token } : null;
  }

  const trailing = line.match(/(?:ars\$|\bars\b|\$)?\s*([\d][\d.,]*)\s*$/i);
  if (!trailing || trailing.index === undefined) return null;
  const name = line.slice(0, trailing.index).replace(/[-–—:\s]+$/g, "").trim();
  return name ? { name, priceText: trailing[0].trim() } : null;
}

function modeDefaults(mode: BulkPriceParseOptions["mode"]): {
  currency: ParsedCurrency | null;
  priceKind: ParsedPriceKind | null;
} {
  if (mode === "sale_ars") return { currency: "ARS", priceKind: "sale" };
  if (mode === "cost_ars") return { currency: "ARS", priceKind: "cost" };
  if (mode === "cost_usd") return { currency: "USD", priceKind: "cost" };
  return { currency: null, priceKind: null };
}

export function parseBulkPriceText(text: string, options: BulkPriceParseOptions): ParsedPriceLine[] {
  const defaults = modeDefaults(options.mode);
  const parsed: ParsedPriceLine[] = [];
  text.split(/\r?\n/).forEach((sourceLine, index) => {
    const lineNumber = index + 1;
    const trimmed = sourceLine.trim();
    if (!trimmed) return;

    const parts = splitNameAndPrice(trimmed);
    if (!parts) {
      parsed.push({ lineNumber, sourceLine, name: null, rawAmount: null, currency: null, priceKind: null, status: "rejected", issues: ["price_or_name_not_found"] });
      return;
    }

    const issues: string[] = [];
    const rawAmount = cleanAmount(parts.priceText);
    if (!rawAmount) issues.push("invalid_or_decimal_amount");

    const hasUsd = USD_MARKER.test(parts.priceText);
    const hasArs = ARS_MARKER.test(parts.priceText);
    const hasBareDollar = /\$/.test(parts.priceText) && !hasUsd && !hasArs;

    let currency = defaults.currency;
    let priceKind = defaults.priceKind;

    if (options.mode === "mixed") {
      priceKind = "cost";
      if (hasUsd) currency = "USD";
      else if (hasArs) currency = "ARS";
      else if (hasBareDollar) issues.push("ambiguous_dollar_currency");
      else issues.push("currency_not_explicit_in_mixed_mode");
    } else {
      if (hasUsd && defaults.currency !== "USD") issues.push("currency_mismatch_usd_marker");
      if (hasArs && defaults.currency !== "ARS") issues.push("currency_mismatch_ars_marker");
      if (options.mode === "cost_usd" && hasBareDollar) issues.push("bare_dollar_accepted_by_selected_usd_mode");
    }

    if (parts.name.length < 3) issues.push("name_too_short");
    if (currency === "USD" && rawAmount !== null && rawAmount > 100_000) issues.push("usd_amount_suspiciously_high");

    const hardIssues = issues.filter((issue) => !["bare_dollar_accepted_by_selected_usd_mode"].includes(issue));
    const parsedCore = Boolean(parts.name && rawAmount && priceKind);
    parsed.push({
      lineNumber,
      sourceLine,
      name: parts.name,
      rawAmount,
      currency,
      priceKind,
      status: !parsedCore ? "rejected" : (!currency || hardIssues.length ? "review" : "ready"),
      issues,
    });
  });
  return parsed;
}
