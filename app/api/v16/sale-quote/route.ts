import { getChatGPTUser } from "@/app/chatgpt-auth";
import { buildV16AuthorizedQuoteDraft } from "@/lib/operations/authorized-sale-quote-engine";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "https://zctaukyrhsmpjkcddcqq.supabase.co";
const QUOTE_TTL_MS = 15 * 60 * 1000;

type RpcError = { message?: string; code?: string };

function json(status: number, body: Record<string, unknown>) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return false;
  return request.headers.get("sec-fetch-site") !== "cross-site";
}

async function callRpc(secret: string, rpc: string, body: Record<string, unknown>) {
  return fetch(`${SUPABASE_URL}/rest/v1/rpc/${rpc}`, {
    method: "POST",
    headers: {
      apikey: secret,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
}

async function readFailure(response: Response) {
  try {
    const payload = await response.json() as RpcError;
    return payload.message ?? payload.code ?? "";
  } catch {
    return "";
  }
}

function firstRow(payload: unknown): Record<string, unknown> | null {
  if (!Array.isArray(payload) || !payload.length) return null;
  const row = payload[0];
  return row && typeof row === "object" && !Array.isArray(row) ? row as Record<string, unknown> : null;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json(403, { status: "unauthorized" });
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return json(415, { status: "error", message: "application/json required" });
  }

  const user = await getChatGPTUser();
  if (!user) return json(401, { status: "unauthenticated" });

  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) return json(503, { status: "not_connected" });

  let payload: { productId?: unknown; paymentMode?: unknown; installments?: unknown };
  try {
    payload = await request.json() as typeof payload;
  } catch {
    return json(400, { status: "error", message: "Invalid JSON" });
  }

  const productId = String(payload.productId ?? "").trim();
  const paymentMode = String(payload.paymentMode ?? "").toUpperCase();
  const installments = Number(payload.installments);

  if (!productId) return json(400, { status: "error", message: "productId required" });
  if (paymentMode !== "CASH" && paymentMode !== "FINANCED") {
    return json(400, { status: "error", message: "invalid paymentMode" });
  }
  if (![1, 2, 3, 4, 6].includes(installments)) {
    return json(400, { status: "error", message: "invalid installments" });
  }

  // Resolve active financing mode through the authenticated operational bridge.
  let modeResponse: Response;
  try {
    modeResponse = await callRpc(secret, "v16_chatgpt_operational_bridge", {
      p_email: user.email,
      p_rpc: "v16_get_active_financing_mode",
      p_args: {},
      p_aal: "aal1",
    });
  } catch {
    return json(503, { status: "not_connected" });
  }
  if (!modeResponse.ok) {
    const message = await readFailure(modeResponse);
    if (message.includes("identity_not_mapped")) return json(401, { status: "unauthenticated" });
    return json(modeResponse.status >= 500 ? 502 : 400, { status: "error", message: "Financing mode unavailable" });
  }

  const modePayload = await modeResponse.json() as unknown;
  const modeRow = firstRow(modePayload);
  const activeMode = modeRow?.active_financing_mode;
  if (activeMode !== "CLASSIC" && activeMode !== "PROTECTED") {
    return json(503, { status: "not_connected" });
  }

  // Resolve private price/cost facts server-side. This RPC is never exposed through the browser bridge.
  let sourceResponse: Response;
  try {
    sourceResponse = await callRpc(secret, "v16_resolve_operational_product_quote_source", {
      p_product_id: productId,
    });
  } catch {
    return json(503, { status: "not_connected" });
  }
  if (!sourceResponse.ok) {
    const message = await readFailure(sourceResponse);
    if (message.includes("product_source") || message.includes("product_sale_price_unavailable") || message.includes("unsupported_product_id_namespace")) {
      return json(409, { status: "quote_unavailable" });
    }
    return json(sourceResponse.status >= 500 ? 502 : 400, { status: "error", message: "Product quote source unavailable" });
  }

  const sourceRow = firstRow(await sourceResponse.json() as unknown);
  if (!sourceRow) return json(409, { status: "quote_unavailable" });

  const currentSalePriceArs = Number(sourceRow.current_sale_price);
  const rawCost = sourceRow.cost_ars;
  const costArs = rawCost === null || rawCost === undefined ? null : Number(rawCost);
  if (!Number.isFinite(currentSalePriceArs) || currentSalePriceArs <= 0 || (costArs !== null && (!Number.isFinite(costArs) || costArs <= 0))) {
    return json(409, { status: "quote_unavailable" });
  }

  let quote;
  try {
    quote = buildV16AuthorizedQuoteDraft({
      productId,
      productName: String(sourceRow.product_name ?? "Producto"),
      productModel: sourceRow.product_model === null || sourceRow.product_model === undefined ? null : String(sourceRow.product_model),
      currentSalePriceArs,
      costArs,
    }, activeMode, {
      paymentMode,
      installments: installments as 1 | 2 | 3 | 4 | 6,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("PROTECTED_REQUIRES_SERVER_CERTIFIED_COST")) {
      return json(409, { status: "quote_unavailable", reason: "protected_cost_unavailable" });
    }
    return json(400, { status: "error", message: "Selected financing option is not available" });
  }

  const expiresAt = new Date(Date.now() + QUOTE_TTL_MS).toISOString();
  const commercialSnapshot = {
    financingMode: quote.financingMode,
    cashPrice: quote.cashPrice,
    initialPayment: quote.initialPayment,
    installments: quote.installments,
    installmentAmount: quote.installmentAmount,
    financedTotal: quote.financedTotal,
    paymentAmounts: quote.paymentAmounts,
    commission: quote.commission,
    commissionPolicyVersion: quote.commissionPolicyVersion,
    pricingPolicyVersion: quote.pricingPolicyVersion,
  };

  let issueResponse: Response;
  try {
    issueResponse = await callRpc(secret, "v16_chatgpt_issue_authorized_sale_quote", {
      p_email: user.email,
      p_canonical_product_id: quote.canonicalProductId,
      p_product_name: quote.productName,
      p_product_model: quote.productModel,
      p_payment_mode: quote.paymentMode,
      p_financing_mode: quote.financingMode,
      p_cash_price: quote.cashPrice,
      p_initial_payment: quote.initialPayment,
      p_installments: quote.installments,
      p_installment_amount: quote.installmentAmount,
      p_financed_total: quote.financedTotal,
      p_payment_amounts: quote.paymentAmounts,
      p_commission_policy_version: quote.commissionPolicyVersion,
      p_pricing_policy_version: quote.pricingPolicyVersion,
      p_commercial_snapshot: commercialSnapshot,
      p_expires_at: expiresAt,
    });
  } catch {
    return json(503, { status: "not_connected" });
  }

  if (!issueResponse.ok) {
    const message = await readFailure(issueResponse);
    if (message.includes("identity_not_mapped")) return json(401, { status: "unauthenticated" });
    return json(issueResponse.status >= 500 ? 502 : 400, { status: "error", message: "Authorized quote could not be issued" });
  }

  const quoteIdPayload = await issueResponse.json() as unknown;
  const authorizedQuoteId = typeof quoteIdPayload === "string"
    ? quoteIdPayload
    : Array.isArray(quoteIdPayload) && typeof quoteIdPayload[0] === "string"
      ? quoteIdPayload[0]
      : null;
  if (!authorizedQuoteId) return json(502, { status: "error", message: "Authorized quote returned an invalid id" });

  // Deliberately sanitized: no cost, supplier, margin or internal source row.
  return json(200, {
    status: "ok",
    data: {
      authorizedQuoteId,
      expiresAt,
      productId: quote.canonicalProductId,
      productName: quote.productName,
      productModel: quote.productModel,
      paymentMode: quote.paymentMode,
      financingMode: quote.financingMode,
      cashPrice: quote.cashPrice,
      initialPayment: quote.initialPayment,
      installments: quote.installments,
      installmentAmount: quote.installmentAmount,
      financedTotal: quote.financedTotal,
      paymentAmounts: quote.paymentAmounts,
      pricingPolicyVersion: quote.pricingPolicyVersion,
    },
  });
}
