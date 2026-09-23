import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config";
export default function sitemap(): MetadataRoute.Sitemap {
  const url = siteUrl();
  return [
    { url, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${url}/llms.txt`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${url}/.well-known/x402`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${url}/.well-known/agent-card.json`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  ];
}
