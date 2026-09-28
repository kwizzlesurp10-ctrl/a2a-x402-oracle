import { NextRequest, NextResponse } from "next/server";
import { skuById } from "@/lib/catalog";
import { paidWisdom } from "@/lib/oracle-brain";
import { corsPreflight, gateRequest, unpaidResponse } from "@/lib/x402";
export function OPTIONS() { return corsPreflight(); }
export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { body = {}; }
  const sku = skuById(String(body.sku || "oracle_ask")) || skuById("oracle_ask")!;
  const gate = await gateRequest(req, sku.id);
  if (!gate.ok) return unpaidResponse(gate.sku);
  const payload = await paidWisdom(sku, body, gate.mode);
  const response = NextResponse.json(payload);
  if (gate.mode === "header") {
    response.headers.set("PAYMENT-RESPONSE", Buffer.from(JSON.stringify({ status: "settled", receipt: payload.receipt })).toString("base64"));
  }
  return response;
}
