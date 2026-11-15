import { checkAndStoreNonce } from "./cache";
import { NextRequest, NextResponse } from "next/server";
import type { Network, PaymentPayload, PaymentRequirements, PaymentRequired, ResourceInfo, SettleResponse } from "@x402/core/types";
import {
  decodePaymentSignatureHeader,
  encodePaymentRequiredHeader,
  encodePaymentResponseHeader,
} from "@x402/core/http";
import { USDC_BASE, facilitatorUrl, maxPriceUsd, network, payTo, payToConfigured, siteUrl } from "./config";
import { SKUS, Sku, skuById } from "./catalog";
import { skuBazaarExtensions, skuMcpBazaarExtensions } from "./x402-bazaar";
import { getX402ResourceServer, hasCdpCredentials } from "./x402-seller";

export type { PaymentRequired };

export type PaidVerifyContext = {
  sku: Sku;
  paymentPayload: PaymentPayload;
  requirements: PaymentRequirements;
  declaredExtensions: Record<string, unknown>;
};

export type GateResult =
  | { ok: true; mode: "free" }
  | { ok: true; mode: "admin" }
  | { ok: true; mode: "paid"; verify: PaidVerifyContext }
  | { ok: false; sku: Sku; body: PaymentRequired; status: 402 }
  | { ok: false; sku: Sku; status: 503; message: string };

export type FinalizeResult =
  | { ok: true; settleResponse: SettleResponse; paymentResponseHeader: string }
  | { ok: false; sku: Sku; body: PaymentRequired; status: 402 };

function skuPriceLabel(sku: Sku): string {
  const usd = Math.min(sku.priceUsd, maxPriceUsd());
  return `$${usd.toFixed(usd < 1 ? 2 : 2)}`;
}

function resourceInfoForSku(sku: Sku): ResourceInfo {
  return {
    url: `${siteUrl()}${sku.httpPath}?sku=${sku.id}`,
    description: sku.description,
    mimeType: "application/json",
  };
}

function sellerReadyOr503(sku: Sku): { ok: true } | { ok: false; sku: Sku; status: 503; message: string } {
  if (!payToConfigured()) {
    return { ok: false, sku, status: 503, message: "X402_PAY_TO is not configured" };
  }
  if (!hasCdpCredentials()) {
    return { ok: false, sku, status: 503, message: "CDP facilitator credentials are not configured" };
  }
  return { ok: true };
}

export async function buildSkuPaymentRequirements(sku: Sku): Promise<PaymentRequirements[]> {
  const server = await getX402ResourceServer();
  return server.buildPaymentRequirementsFromOptions(
    [
      {
        scheme: "exact",
        payTo: payTo(),
        price: skuPriceLabel(sku),
        network: network() as Network,
        maxTimeoutSeconds: 60,
      },
    ],
    {},
  );
}

export async function paymentRequiredBody(sku: Sku, mcp = false): Promise<PaymentRequired> {
  const server = await getX402ResourceServer();
  const requirements = await buildSkuPaymentRequirements(sku);
  const declaredExtensions = mcp ? skuMcpBazaarExtensions(sku) : skuBazaarExtensions(sku);
  return server.createPaymentRequiredResponse(
    requirements,
    resourceInfoForSku(sku),
    "Payment required to invoke this Oracle skill",
    declaredExtensions,
  );
}

export function paymentRequiredHeadersFromBody(body: PaymentRequired): HeadersInit {
  return {
    "Content-Type": "application/json",
    "PAYMENT-REQUIRED": encodePaymentRequiredHeader(body),
    "Cache-Control": "no-store",
  };
}

export function paymentRequiredHeaders(sku: Sku, body: PaymentRequired): HeadersInit {
  return paymentRequiredHeadersFromBody(body);
}

export function wellKnownX402() {
  return {
    x402Version: 2,
    name: "A2A-x402 Oracle",
    description: "Paid demand intelligence for A2A x402. A live accepts[] is evidence.",
    network: network(),
    facilitator: facilitatorUrl(),
    payTo: payToConfigured() ? payTo() : null,
    asset: USDC_BASE,
    assetSymbol: "USDC",
    discoverable: true,
    services: SKUS.map((s) => ({
      id: s.id,
      method: s.free ? "GET" : "POST",
      path: s.httpPath,
      mcpTool: s.mcpTool,
      description: s.description,
      amount: s.atomic,
      amountUsd: s.priceUsd,
      discoverable: true,
      free: s.free,
      family: s.family,
      unitOfWork: s.unitOfWork,
    })),
  };
}

export function agentCard() {
  const url = siteUrl();
  return {
    name: "A2A-x402 Oracle",
    description:
      "Oracle-402. Ranks A2A x402 calls that already collect money. Humans subscribe. Agents pay USDC.",
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
          required: true,
        },
      ],
    },
    skills: SKUS.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      tags: ["x402", "a2a", "mcp", "oracle"],
      payment: s.free
        ? { protocol: "none", priceUsd: 0 }
        : { protocol: "x402", networks: [network()], asset: "USDC", priceUsd: s.priceUsd },
    })),
    payment: {
      protocol: "x402",
      networks: [network()],
      asset: "USDC",
      payTo: payToConfigured() ? payTo() : null,
      facilitator: facilitatorUrl(),
    },
  };
}

export function mcpManifest() {
  const url = siteUrl();
  return {
    name: "x402-oracle",
    version: "1.0.0",
    transport: "streamable-http",
    url: `${url}/api/mcp`,
    tools: SKUS.map((s) => ({ name: s.mcpTool, description: s.description, paid: !s.free, priceUsd: s.priceUsd })),
    payment: {
      protocol: "x402",
      network: network(),
      asset: USDC_BASE,
      payTo: payToConfigured() ? payTo() : null,
    },
  };
}

function extractPaymentHeader(req: NextRequest): string | null {
  const v =
    req.headers.get("PAYMENT-SIGNATURE") ||
    req.headers.get("X-PAYMENT") ||
    req.headers.get("payment-signature") ||
    req.headers.get("x-payment");
  return v?.trim() ? v.trim() : null;
}

function replayKeyFromPayload(paymentPayload: PaymentPayload): string | null {
  const payload = paymentPayload.payload as Record<string, unknown> | undefined;
  const inner = payload?.payload as Record<string, unknown> | undefined;
  const candidate =
    (typeof payload?.signature === "string" && payload.signature) ||
    (typeof inner?.signature === "string" && inner.signature) ||
    (typeof payload?.nonce === "string" && payload.nonce) ||
    null;
  return candidate;
}

export async function gateRequest(
  req: NextRequest,
  skuId: string,
  metaPayment?: string,
  mcp = false,
): Promise<GateResult> {
  const sku = skuById(skuId) || skuById("oracle_ask")!;
  if (sku.free) return { ok: true, mode: "free" };

  const admin = process.env.ADMIN_TOKEN;
  const presented = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (admin && presented && presented === admin) return { ok: true, mode: "admin" };

  const ready = sellerReadyOr503(sku);
  if (!ready.ok) return ready;

  const paymentHeader = metaPayment || extractPaymentHeader(req);
  if (!paymentHeader) {
    return { ok: false, sku, body: await paymentRequiredBody(sku, mcp), status: 402 };
  }

  let paymentPayload: PaymentPayload;
  try {
    paymentPayload = decodePaymentSignatureHeader(paymentHeader);
  } catch {
    return { ok: false, sku, body: await paymentRequiredBody(sku, mcp), status: 402 };
  }

  const replayKey = replayKeyFromPayload(paymentPayload);
  if (!replayKey || !checkAndStoreNonce(replayKey, 120)) {
    return { ok: false, sku, body: await paymentRequiredBody(sku, mcp), status: 402 };
  }

  const server = await getX402ResourceServer();
  const requirementsList = await buildSkuPaymentRequirements(sku);
  const requirements =
    server.findMatchingRequirements(requirementsList, paymentPayload) ?? requirementsList[0];
  const declaredExtensions = mcp ? skuMcpBazaarExtensions(sku) : skuBazaarExtensions(sku);

  try {
    const verifyResult = await server.verifyPayment(paymentPayload, requirements, declaredExtensions);
    if (!verifyResult.isValid) {
      return { ok: false, sku, body: await paymentRequiredBody(sku, mcp), status: 402 };
    }
  } catch {
    return { ok: false, sku, body: await paymentRequiredBody(sku, mcp), status: 402 };
  }

  return {
    ok: true,
    mode: "paid",
    verify: { sku, paymentPayload, requirements, declaredExtensions },
  };
}

export async function finalizePaidRequest(verify: PaidVerifyContext, mcp = false): Promise<FinalizeResult> {
  const server = await getX402ResourceServer();
  try {
    const settleResponse = await server.settlePayment(
      verify.paymentPayload,
      verify.requirements,
      verify.declaredExtensions,
    );
    if (!settleResponse.success) {
      return {
        ok: false,
        sku: verify.sku,
        body: await paymentRequiredBody(verify.sku, mcp),
        status: 402,
      };
    }
    return {
      ok: true,
      settleResponse,
      paymentResponseHeader: encodePaymentResponseHeader(settleResponse),
    };
  } catch {
    return {
      ok: false,
      sku: verify.sku,
      body: await paymentRequiredBody(verify.sku, mcp),
      status: 402,
    };
  }
}

export function unpaidResponse(sku: Sku, body: PaymentRequired, status = 402) {
  return NextResponse.json(body, { status, headers: paymentRequiredHeaders(sku, body) });
}

export function sellerMisconfiguredResponse(sku: Sku, message: string) {
  return NextResponse.json(
    { error: "Payment seller unavailable", code: "X402_SELLER_MISCONFIGURED", message, sku: sku.id },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}

export function settleFailedResponse(sku: Sku, body: PaymentRequired) {
  return NextResponse.json(
    { error: "Payment settlement failed", code: "X402_SETTLE_FAILED", paymentRequired: body },
    { status: 402, headers: paymentRequiredHeaders(sku, body) },
  );
}

export function applyPaymentResponseHeader(response: NextResponse, headerValue: string) {
  response.headers.set("PAYMENT-RESPONSE", headerValue);
}

export function corsPreflight() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, PAYMENT-SIGNATURE, X-PAYMENT, PAYMENT-REQUIRED, X-Agent-Id",
      "Access-Control-Expose-Headers": "PAYMENT-REQUIRED, PAYMENT-RESPONSE",
    },
  });
}