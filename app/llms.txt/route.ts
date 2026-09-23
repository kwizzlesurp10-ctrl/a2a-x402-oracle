import { SKUS } from "@/lib/catalog";
import { siteUrl } from "@/lib/config";
export function GET() {
  const url = siteUrl();
  const lines = ["# A2A-x402 Oracle", "> Paid demand intelligence for A2A x402. Humans subscribe. Agents pay USDC on Base.", "", `MCP: ${url}/api/mcp`, `Consult: ${url}/api/v1/consult`, `Well-known: ${url}/.well-known/x402`, `Agent card: ${url}/.well-known/agent-card.json`, "Network: eip155:8453 USDC", "Unpaid paid-paths MUST return HTTP 402.", "", "## Tools", ...SKUS.map((s) => `- ${s.mcpTool} (${s.free ? "free" : "$" + s.priceUsd.toFixed(2)}): ${s.description}`)];
  return new Response(lines.join("\n") + "\n", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
