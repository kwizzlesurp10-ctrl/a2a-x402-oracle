import { SKUS } from "@/lib/catalog";
import { siteUrl } from "@/lib/config";
export function GET() {
  const url = siteUrl();
  const body = ["# A2A-x402 Oracle", "> Paid A2A x402 demand intelligence. Agents pay USDC on Base.", `MCP: ${url}/api/mcp`, `Consult: ${url}/api/v1/consult`, `Well-known: ${url}/.well-known/x402`, "Network: eip155:8453 USDC", "Unpaid paid-paths MUST 402.", ...SKUS.map((s) => `- ${s.mcpTool} ${s.free ? "free" : "$" + s.priceUsd}`)].join("\n");
  return new Response(body + "\n", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
