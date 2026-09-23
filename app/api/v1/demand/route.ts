import { NextRequest, NextResponse } from "next/server";
import { skuById } from "@/lib/catalog";
import { paidWisdom } from "@/lib/oracle-brain";
import { corsPreflight, gateRequest, unpaidResponse } from "@/lib/x402";
export function OPTIONS() { return corsPreflight(); }
export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { body = {}; }
  const allowed = String(body.sku || "oracle_demand_cycle") === "oracle_probe_call" ? "oracle_probe_call" : "oracle_demand_cycle";
  const sku = skuById(allowed)!;
  const gate = gateRequest(req, sku.id);
  if (!gate.ok) return unpaidResponse(gate.sku);
  return NextResponse.json(paidWisdom(sku, body, gate.mode));
}
