import { PRODUCT, siteUrl } from "./config";
import { SKUS, Sku } from "./catalog";
export const ORACLE_SYSTEM_PROMPT = "You are Oracle-402. Rank A2A x402 calls that collect money. Live 402 or it does not rank.";
export type OracleEnvelope = { oracle: string; sku: string; verdict: "proceed" | "patch" | "halt" | "preview"; wisdom: string; implementation_prompt: string; risk: string; citations: string[]; receipt: { network: string; amountUsd: number; mode: string; paid: boolean }; };
export function previewAnswer(question: string): OracleEnvelope {
  const q = question.trim().slice(0, 280) || "What is a live A2A x402 call?";
  return { oracle: PRODUCT.slug, sku: "preview", verdict: "preview", wisdom: `Preview only. Live call = HTTP 402 + accepts[]. 97 cards declared x402; 8 answered. Q: ${q}`, implementation_prompt: `curl -i -X POST ${siteUrl()}/api/v1/consult -H 'content-type: application/json' -d '{"sku":"oracle_ask"}'`, risk: "Preview is not observed demand.", citations: [`${siteUrl()}/.well-known/x402`], receipt: { network: "eip155:8453", amountUsd: 0, mode: "preview", paid: false } };
}
export function paidWisdom(sku: Sku, input: Record<string, unknown>, mode: string): OracleEnvelope {
  const question = String(input.question || input.url || "").slice(0, 2000);
  return { oracle: PRODUCT.slug, sku: sku.id, verdict: sku.id === "oracle_demand_cycle" ? "proceed" : "patch", wisdom: `Oracle-402 ${sku.id}. ${sku.unitOfWork}. ${question || "(no input)"}. Wire LLM_API_KEY for live counsel; 402 rail is production.`, implementation_prompt: `POST ${siteUrl()}${sku.httpPath} with sku=${sku.id}. Expect 402 unpaid.`, risk: "Deterministic fallback without LLM key.", citations: [`${siteUrl()}/llms.txt`], receipt: { network: "eip155:8453", amountUsd: sku.priceUsd, mode, paid: mode !== "free" } };
}
export function healthPayload() {
  return { status: "ok", service: PRODUCT.name, version: PRODUCT.version, mcp: `${siteUrl()}/api/mcp`, consult: `${siteUrl()}/api/v1/consult`, demand: `${siteUrl()}/api/v1/demand`, wellKnown: `${siteUrl()}/.well-known/x402`, agentCard: `${siteUrl()}/.well-known/agent-card.json`, llms: `${siteUrl()}/llms.txt`, openapi: `${siteUrl()}/openapi.json`, network: "eip155:8453", asset: "USDC", paid: SKUS.filter((s) => !s.free).map((s) => s.id), free: SKUS.filter((s) => s.free).map((s) => s.id) };
}
