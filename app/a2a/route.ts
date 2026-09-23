import { NextRequest, NextResponse } from "next/server";
import { skuById } from "@/lib/catalog";
import { paidWisdom } from "@/lib/oracle-brain";
import { agentCard, corsPreflight, gateRequest, unpaidResponse } from "@/lib/x402";
export function OPTIONS() { return corsPreflight(); }
export function GET() { return NextResponse.json(agentCard()); }
export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { body = {}; }
  const sku = skuById(String(body.skill || body.method || "oracle_ask")) || skuById("oracle_ask")!;
  if (sku.free) return NextResponse.json({ jsonrpc: "2.0", result: paidWisdom(sku, body, "free") });
  const gate = gateRequest(req, sku.id);
  if (!gate.ok) return unpaidResponse(gate.sku);
  return NextResponse.json({ jsonrpc: "2.0", result: { task: { state: "completed", skill: sku.id }, message: paidWisdom(sku, body, gate.mode) } });
}
