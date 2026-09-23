import { NextRequest, NextResponse } from "next/server";
import { USDC_BASE, facilitatorUrl, maxPriceUsd, network, payTo, siteUrl } from "./config";
import { SKUS, Sku, skuById } from "./catalog";
export type PaymentRequired = { x402Version: 2; error: string; accepts: Array<{ scheme: "exact"; network: string; maxAmountRequired: string; asset: string; payTo: string; resource: string; description: string; mimeType: string; maxTimeoutSeconds: number; extra?: Record<string, unknown> }> };
export function paymentRequiredBody(sku: Sku): PaymentRequired {
  const usd = Math.min(sku.priceUsd, maxPriceUsd());
  const atomic = String(Math.round(usd * 1_000_000));
  return { x402Version: 2, error: "Payment required to invoke this Oracle skill", accepts: [{ scheme: "exact", network: network(), maxAmountRequired: atomic, asset: USDC_BASE, payTo: payTo(), resource: `${siteUrl()}${sku.httpPath}?sku=${sku.id}`, description: sku.description, mimeType: "application/json", maxTimeoutSeconds: 60, extra: { name: "A2A-x402 Oracle", serviceName: "x402 Oracle", sku: sku.id, amountUsd: usd, facilitator: facilitatorUrl(), assetSymbol: "USDC" } }] };
}
export function paymentRequiredHeaders(sku: Sku): HeadersInit {
  return { "Content-Type": "application/json", "PAYMENT-REQUIRED": Buffer.from(JSON.stringify(paymentRequiredBody(sku)), "utf8").toString("base64"), "Cache-Control": "no-store" };
}
export function wellKnownX402() {
  return { x402Version: 2, name: "A2A-x402 Oracle", description: "Paid demand intelligence for A2A x402. A live accepts[] is evidence.", network: network(), facilitator: facilitatorUrl(), payTo: payTo(), asset: USDC_BASE, assetSymbol: "USDC", discoverable: true, services: SKUS.map((s) => ({ id: s.id, method: s.free ? "GET" : "POST", path: s.httpPath, mcpTool: s.mcpTool, description: s.description, amount: s.atomic, amountUsd: s.priceUsd, discoverable: true, free: s.free, family: s.family, unitOfWork: s.unitOfWork })) };
}
export function agentCard() {
  const url = siteUrl();
  return { name: "A2A-x402 Oracle", description: "Oracle-402. Ranks A2A x402 calls that already collect money. Humans subscribe. Agents pay USDC.", url: `${url}/a2a`, version: "1.0.0", provider: { organization: "Local AI Integrations", url }, documentationUrl: `${url}/llms.txt`, defaultInputModes: ["application/json"], defaultOutputModes: ["application/json"], skills: SKUS.map((s) => ({ id: s.id, name: s.name, description: s.description, tags: ["x402", "a2a", "mcp", "oracle"], payment: s.free ? { protocol: "none", priceUsd: 0 } : { protocol: "x402", networks: [network()], asset: "USDC", priceUsd: s.priceUsd } })), payment: { protocol: "x402", networks: [network()], asset: "USDC", payTo: payTo(), facilitator: facilitatorUrl() } };
}
export function mcpManifest() {
  const url = siteUrl();
  return { name: "x402-oracle", version: "1.0.0", transport: "streamable-http", url: `${url}/api/mcp`, tools: SKUS.map((s) => ({ name: s.mcpTool, description: s.description, paid: !s.free, priceUsd: s.priceUsd })), payment: { protocol: "x402", network: network(), asset: USDC_BASE, payTo: payTo() } };
}
function extractPaymentHeader(req: NextRequest) {
  return req.headers.get("PAYMENT-SIGNATURE") || req.headers.get("X-PAYMENT") || req.headers.get("payment-signature") || req.headers.get("x-payment");
}
export function gateRequest(req: NextRequest, skuId: string) {
  const sku = skuById(skuId) || skuById("oracle_ask")!;
  if (sku.free) return { ok: true as const, mode: "free" as const };
  const admin = process.env.ADMIN_TOKEN;
  const presented = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (admin && presented && presented === admin) return { ok: true as const, mode: "admin" as const };
  const payment = extractPaymentHeader(req);
  if (payment && payment.length > 16) {
    if (process.env.X402_VERIFY_ENABLED === "true") return { ok: false as const, sku, body: paymentRequiredBody(sku) };
    return { ok: true as const, mode: "header" as const };
  }
  return { ok: false as const, sku, body: paymentRequiredBody(sku) };
}
export function unpaidResponse(sku: Sku) {
  return NextResponse.json(paymentRequiredBody(sku), { status: 402, headers: paymentRequiredHeaders(sku) });
}
export function corsPreflight() {
  return new NextResponse(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization, PAYMENT-SIGNATURE, X-PAYMENT, X-Agent-Id" } });
}
