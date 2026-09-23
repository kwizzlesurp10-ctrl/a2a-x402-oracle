import type { Metadata } from "next";
import { PRODUCT, siteUrl } from "@/lib/config";
import "./globals.css";
const url = siteUrl();
export const metadata: Metadata = {
  metadataBase: new URL(url),
  title: { default: "A2A-x402 Oracle — paid MCP counsel for Agent-to-Agent how-tos", template: "%s · A2A-x402 Oracle" },
  description: "Paid demand intelligence for A2A commerce on x402. Humans subscribe. Agents pay USDC on Base for MCP consults and demand cycles.",
  keywords: [...PRODUCT.keywords],
  openGraph: { type: "website", url, title: "A2A-x402 Oracle", description: "402 is the answer. The Oracle is how you ask. Paid MCP + A2A demand intelligence, USDC on Base.", siteName: "A2A-x402 Oracle" },
  twitter: { card: "summary_large_image", site: "@keithstworld", creator: "@keithstworld", title: "A2A-x402 Oracle", description: "Paid demand intelligence for Agent-to-Agent x402 calls. Live 402 or it does not rank." },
  robots: { index: true, follow: true },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;1,9..144,500&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
