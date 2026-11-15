import { declareDiscoveryExtension } from "@x402/extensions/bazaar";
import type { Sku } from "./catalog";

export function skuBazaarExtensions(sku: Sku): Record<string, unknown> {
  const input =
    sku.httpPath === "/api/v1/demand"
      ? { sku: sku.id, url: "https://example.com", question: "Probe target URL" }
      : { sku: sku.id, question: "How do I wire x402 on Base?", url: "https://example.com" };

  return declareDiscoveryExtension({
    bodyType: "json",
    input,
    inputSchema: {
      type: "object",
      properties: {
        sku: { type: "string", description: "Oracle skill / SKU id" },
        question: { type: "string", description: "Counsel or diagnosis question" },
        url: { type: "string", description: "Target URL for probe or review skills" },
      },
      required: ["sku"],
    },
    output: {
      example: {
        oracle: "x402oracle",
        sku: sku.id,
        verdict: "proceed",
        wisdom: sku.description,
        implementation_prompt: `POST with sku=${sku.id} and x402 payment headers`,
        risk: "Unsettled requests receive HTTP 402 only.",
        receipt: { network: "eip155:8453", amountUsd: sku.priceUsd, paid: true },
      },
    },
  }) as Record<string, unknown>;
}

export function skuMcpBazaarExtensions(sku: Sku): Record<string, unknown> {
  return declareDiscoveryExtension({
    toolName: sku.mcpTool,
    description: sku.description,
    inputSchema: {
      type: "object",
      properties: {
        question: { type: "string" },
        url: { type: "string" },
      },
    },
    output: {
      example: {
        oracle: "x402oracle",
        sku: sku.id,
        receipt: { paid: true },
      },
    },
  }) as Record<string, unknown>;
}