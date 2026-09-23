import { NextResponse } from "next/server";
import { SKUS } from "@/lib/catalog";
import { siteUrl, USDC_BASE, facilitatorUrl, network, payTo } from "@/lib/config";
export function GET() {
  return NextResponse.json({ openapi: "3.1.0", info: { title: "A2A-x402 Oracle", version: "1.0.0" }, servers: [{ url: siteUrl() }], paths: Object.fromEntries(SKUS.map((s) => [s.httpPath, { [s.free ? "get" : "post"]: { operationId: s.id, summary: s.name, "x-payment-info": s.free ? { free: true } : { protocol: "x402", network: network(), asset: USDC_BASE, amount: s.atomic, amountUsd: s.priceUsd, payTo: payTo(), facilitator: facilitatorUrl() } } }])) });
}
