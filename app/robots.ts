import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config";
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: ["/", "/llms.txt", "/agents.txt", "/openapi.json", "/.well-known/"] }], sitemap: `${siteUrl()}/sitemap.xml`, host: siteUrl() };
}
