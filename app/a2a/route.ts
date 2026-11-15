import { NextRequest, NextResponse } from "next/server";
import { skuById } from "@/lib/catalog";
import { paidWisdom } from "@/lib/oracle-brain";
import { agentCard, corsPreflight, finalizePaidRequest, gateRequest, unpaidResponse, sellerMisconfiguredResponse, settleFailedResponse } from "@/lib/x402";

export function OPTIONS() {
  return corsPreflight();
}

export function GET() {
  return NextResponse.json(agentCard());
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const sku = skuById(String(body.skill || body.method || "oracle_ask")) || skuById("oracle_ask")!;
  if (sku.free) {
    return NextResponse.json({ jsonrpc: "2.0", result: await paidWisdom(sku, body, "free") });
  }

  const gate = await gateRequest(req, sku.id);
  if (!gate.ok) {
    if (gate.status === 503) return sellerMisconfiguredResponse(gate.sku, gate.message);
    return unpaidResponse(gate.sku, gate.body);
  }

  const message = await paidWisdom(sku, body, "paid");

  if (gate.mode === "paid") {
    const finalized = await finalizePaidRequest(gate.verify);
    if (!finalized.ok) {
      return settleFailedResponse(finalized.sku, finalized.body);
    }
    return NextResponse.json({
      jsonrpc: "2.0",
      result: {
        task: { state: "completed", skill: sku.id },
        message: { ...message, receipt: { ...message.receipt, paid: true, mode: "settled" } },
        payment: { status: "settled", transaction: finalized.settleResponse.transaction },
      },
    });
  }

  return NextResponse.json({
    jsonrpc: "2.0",
    result: { task: { state: "completed", skill: sku.id }, message },
  });
}