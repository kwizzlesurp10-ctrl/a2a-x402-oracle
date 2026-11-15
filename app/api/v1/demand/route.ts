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
  const allowed =
    String(body.sku || "oracle_demand_cycle") === "oracle_probe_call"
      ? "oracle_probe_call"
      : "oracle_demand_cycle";
  const sku = skuById(allowed)!;
  const gate = await gateRequest(req, sku.id);
  const blocked = responseForGate(gate);
  if (blocked) return blocked;

  const payload = await paidWisdom(sku, body, gate.ok ? gate.mode : "free");

  if (gate.ok && gate.mode === "paid") {
    const finalized = await finalizePaidRequest(gate.verify);
    return jsonWithOptionalPayment(
      finalized.ok
        ? { ...payload, receipt: { ...payload.receipt, paid: true, mode: "settled" } }
        : payload,
      finalized,
    );
  }

  return jsonWithOptionalPayment(payload, null);
}