import { checkAndStoreNonce } from "./cache";
import { NextRequest, NextResponse } from "next/server";
import { USDC_BASE, facilitatorUrl, maxPriceUsd, network, payTo, siteUrl } from "./config";
import { SKUS, Sku, skuById } from "./catalog";
export type PaymentRequired = {
  x402Version: 2;
  error?: string;
  resource: { url: string; description: string; mimeType: string };
  accepts: Array<{
    scheme: string;
    network: string;
    amount: string;
    asset: string;
    payTo: string;
    maxTimeoutSeconds: number;
    extra?: Record<string, unknown>;
  }>;
};
export function paymentRequiredBody(sku: Sku): PaymentRequired {
  const usd = Math.min(sku.priceUsd, maxPriceUsd());
  const atomic = String(Math.round(usd * 1_000_000));
  return {
    x402Version: 2,
    error: "Payment required to invoke this Oracle skill",
    resource: {
      url: `${siteUrl()}${sku.httpPath}?sku=${sku.id}`,
      description: sku.description,
      mimeType: "application/json"
    },
    accepts: [{
      scheme: "exact",
      network: network(),
      amount: atomic,
      asset: USDC_BASE,
      payTo: payTo(),
      maxTimeoutSeconds: 60,
      extra: { name: "A2A-x402 Oracle", serviceName: "x402 Oracle", sku: sku.id, amountUsd: usd, facilitator: facilitatorUrl(), assetSymbol: "USDC" }
    }]
  };
}
export function paymentRequiredHeaders(sku: Sku): HeadersInit {
  return { "Content-Type": "application/json", "PAYMENT-REQUIRED": Buffer.from(JSON.stringify(paymentRequiredBody(sku)), "utf8").toString("base64"), "Cache-Control": "no-store" };
}
export function wellKnownX402() {
  return { x402Version: 2, name: "A2A-x402 Oracle", description: "Paid demand intelligence for A2A x402. A live accepts[] is evidence.", network: network(), facilitator: facilitatorUrl(), payTo: payTo(), asset: USDC_BASE, assetSymbol: "USDC", discoverable: true, services: SKUS.map((s) => ({ id: s.id, method: s.free ? "GET" : "POST", path: s.httpPath, mcpTool: s.mcpTool, description: s.description, amount: s.atomic, amountUsd: s.priceUsd, discoverable: true, free: s.free, family: s.family, unitOfWork: s.unitOfWork })) };
}
export function agentCard() {
  const url = siteUrl();
  return {
    name: "A2A-x402 Oracle",
    description: "Oracle-402. Ranks A2A x402 calls that already collect money. Humans subscribe. Agents pay USDC.",
    url: `${url}/a2a`,
    version: "1.0.0",
    provider: { organization: "Local AI Integrations", url },
    documentationUrl: `${url}/llms.txt`,
    defaultInputModes: ["application/json"],
    defaultOutputModes: ["application/json"],
    capabilities: {
      extensions: [
        {
          uri: "https://github.com/google-agentic-commerce/a2a-x402/blob/main/spec/v0.2",
          description: "Supports payments using the x402 protocol for on-chain settlement.",
          required: true
        }
      ]
    },
    skills: SKUS.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      tags: ["x402", "a2a", "mcp", "oracle"],
      payment: s.free ? { protocol: "none", priceUsd: 0 } : { protocol: "x402", networks: [network()], asset: "USDC", priceUsd: s.priceUsd }
    })),
    payment: { protocol: "x402", networks: [network()], asset: "USDC", payTo: payTo(), facilitator: facilitatorUrl() }
  };
}
export function mcpManifest() {
  const url = siteUrl();
  return { name: "x402-oracle", version: "1.0.0", transport: "streamable-http", url: `${url}/api/mcp`, tools: SKUS.map((s) => ({ name: s.mcpTool, description: s.description, paid: !s.free, priceUsd: s.priceUsd })), payment: { protocol: "x402", network: network(), asset: USDC_BASE, payTo: payTo() } };
}
function extractPaymentHeader(req: NextRequest) {
  return req.headers.get("PAYMENT-SIGNATURE") || req.headers.get("X-PAYMENT") || req.headers.get("payment-signature") || req.headers.get("x-payment");
}


export async function gateRequest(req: NextRequest, skuId: string, metaPayment?: string) {
  const sku = skuById(skuId) || skuById("oracle_ask")!;
  if (sku.free) return { ok: true as const, mode: "free" as const };
  
  const admin = process.env.ADMIN_TOKEN;
  const presented = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (admin && presented && presented === admin) return { ok: true as const, mode: "admin" as const };
  
  const payment = metaPayment || extractPaymentHeader(req);
  if (!payment) return { ok: false as const, sku, body: paymentRequiredBody(sku) };

  let paymentPayload;
  try {
    paymentPayload = JSON.parse(Buffer.from(payment, "base64").toString("utf-8"));
  } catch (e) {
    return { ok: false as const, sku, body: paymentRequiredBody(sku) };
  }

  // Idempotency check: hash of signature
  const sig = paymentPayload?.payload?.signature;
  if (!sig || !checkAndStoreNonce(sig, 60)) {
    return { ok: false as const, sku, body: paymentRequiredBody(sku) };
  }

  if (process.env.X402_VERIFY_ENABLED === "true") {
    try {
      const requirements = paymentRequiredBody(sku).accepts[0];
      const res = await fetch(facilitatorUrl() + "/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentPayload, paymentRequirements: requirements })
      });
      if (!res.ok) return { ok: false as const, sku, body: paymentRequiredBody(sku) };
      const data = await res.json();
      if (!data.isValid) return { ok: false as const, sku, body: paymentRequiredBody(sku) };
    } catch (err) {
      return { ok: false as const, sku, body: paymentRequiredBody(sku) };
    }
  }

  return { ok: true as const, mode: "header" as const };
}
export function unpaidResponse(sku: Sku) {
  return NextResponse.json(paymentRequiredBody(sku), { status: 402, headers: paymentRequiredHeaders(sku) });
}
export function corsPreflight() {
  return new NextResponse(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization, PAYMENT-SIGNATURE, X-PAYMENT, X-Agent-Id" } });
}
