import type { Metadata } from "next";
import { siteUrl } from "@/lib/config";
import "./globals.css";
export const metadata: Metadata = { metadataBase: new URL(siteUrl()), title: "A2A-x402 Oracle — paid MCP counsel for Agent-to-Agent how-tos", description: "Paid demand intelligence for A2A commerce on x402. Humans subscribe. Agents pay USDC on Base." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><head><link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;1,500&family=IBM+Plex+Mono&family=IBM+Plex+Sans&display=swap" rel="stylesheet" /></head><body>{children}</body></html>);
}
