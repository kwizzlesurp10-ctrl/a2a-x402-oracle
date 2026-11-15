import { NextRequest } from "next/server";
import { skuById } from "@/lib/catalog";
import { paidWisdom } from "@/lib/oracle-brain";
import { corsPreflight, finalizePaidRequest, gateRequest } from "@/lib/x402";
import { jsonWithOptionalPayment, responseForGate } from "@/lib/x402-route";

export function OPTIONS() {
  return corsPreflight();
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const sku = skuById(String(body.sku || "oracle_ask")) || skuById("oracle_ask")!;
  const gate = await gateRequest(req, sku.id);
  const blocked = responseForGate(gate);
  if (blocked) return blocked;

  const mode = gate.ok ? gate.mode : "free";
  const payload = await paidWisdom(sku, body, mode);

  if (gate.ok && gate.mode === "paid") {
    const finalized = await finalizePaidRequest(gate.verify);
    if (!finalized.ok) return jsonWithOptionalPayment(payload, finalized);
    return jsonWithOptionalPayment(
      { ...payload, receipt: { ...payload.receipt, paid: true, mode: "settled" } },
      finalized,
    );
  }

  return jsonWithOptionalPayment(payload, null);
}