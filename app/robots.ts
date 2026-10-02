import type { MetadataRoute } from "next"
import { absoluteUrl } from "@/lib/seo/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/account", "/checkout", "/sign-in", "/sign-up", "/showcase-render/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl(),
  }
}
