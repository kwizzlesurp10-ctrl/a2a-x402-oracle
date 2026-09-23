export const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA9D2bD";

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://a2a-x402-oracle.vercel.app").replace(/\/$/, "");
}

export function payTo(): string {
  const addr = process.env.X402_PAY_TO || "0xAB745e5F576667037696e78ba7dA28E193E4423D";
  if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) throw new Error("X402_PAY_TO must be a 20-byte hex address");
  return addr;
}

export function network(): string {
  return process.env.X402_NETWORK || "eip155:8453";
}

export function facilitatorUrl(): string {
  return process.env.X402_FACILITATOR_URL || "https://api.cdp.coinbase.com/platform/v2/x402";
}

export function maxPriceUsd(): number {
  const n = Number(process.env.MAX_PRICE_USD || "25");
  return Number.isFinite(n) && n > 0 ? Math.min(n, 100) : 25;
}

export const PRODUCT = {
  name: "A2A-x402 Oracle",
  short: "Oracle-402",
  slug: "x402oracle",
  version: "1.0.0",
  tagline: "402 is the answer. The Oracle is how you ask.",
  description: "Paid demand intelligence for Agent-to-Agent commerce that settles on x402. Humans subscribe. Agents pay USDC per consult or demand cycle.",
  keywords: ["x402", "A2A", "MCP", "HTTP 402", "USDC Base", "Bazaar", "paid MCP", "agent card", "demand oracle"],
} as const;
