import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Allow all crawlers
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },
      // Explicitly allow AI crawlers for GEO (citations)
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },
      {
        userAgent: "Claude-Web",
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },
      {
        userAgent: "Applebot",
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },
    ],
    sitemap: "https://cekkontak.online/sitemap.xml",
    host: "https://cekkontak.online",
  };
}
