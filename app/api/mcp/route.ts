import { NextRequest, NextResponse } from "next/server";
import { SKUS, skuById } from "@/lib/catalog";
import { healthPayload, paidWisdom } from "@/lib/oracle-brain";
import { corsPreflight, gateRequest, paymentRequiredBody } from "@/lib/x402";
export const dynamic = "force-dynamic";
export function OPTIONS() { return corsPreflight(); }
type Rpc = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };
function ok(id: Rpc["id"], result: unknown) { return NextResponse.json({ jsonrpc: "2.0", id: id ?? null, result }); }
function err(id: Rpc["id"], code: number, message: string, data?: unknown) { return NextResponse.json({ jsonrpc: "2.0", id: id ?? null, error: { code, message, data } }); }
export async function GET() { return NextResponse.json({ protocol: "mcp", transport: "streamable-http", name: "x402-oracle", tools: SKUS.map((s) => s.mcpTool) }); }
export async function POST(req: NextRequest) {
  let rpc: Rpc = {};
  try { rpc = await req.json(); } catch { return err(null, -32700, "Parse error"); }
  const method = rpc.method || "";
  if (method === "initialize") return ok(rpc.id, { protocolVersion: "2025-03-26", serverInfo: { name: "x402-oracle", version: "1.0.0" }, capabilities: { tools: {} } });
  if (method === "ping" || method === "notifications/initialized") return ok(rpc.id, {});
  if (method === "tools/list") return ok(rpc.id, { tools: SKUS.map((s) => ({ name: s.mcpTool, description: s.description, inputSchema: { type: "object", properties: { question: { type: "string" }, url: { type: "string" } } }, annotations: { paid: !s.free, priceUsd: s.priceUsd } })) });
  if (method === "tools/call") {
    const name = String((rpc.params as { name?: string })?.name || "");
    const args = ((rpc.params as { arguments?: Record<string, unknown> })?.arguments || {}) as Record<string, unknown>;
    const sku = skuById(name);
    if (!sku) return err(rpc.id, -32601, `Unknown tool ${name}`);
    if (sku.free) return ok(rpc.id, { content: [{ type: "text", text: JSON.stringify(healthPayload()) }] });
    const gate = gateRequest(req, sku.id);
    if (!gate.ok) return NextResponse.json({ jsonrpc: "2.0", id: rpc.id ?? null, error: { code: 402, message: "Payment required", data: paymentRequiredBody(gate.sku) } }, { status: 402 });
    return ok(rpc.id, { content: [{ type: "text", text: JSON.stringify(paidWisdom(sku, { ...args, sku: sku.id }, gate.mode)) }] });
  }
  return err(rpc.id, -32601, `Method not found: ${method}`);
}
