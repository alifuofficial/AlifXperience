import { MetadataRoute } from "next";

async function getSiteUrl() {
  const fallback = "https://alifxperience.com";
  try {
    const fs = require("fs/promises");
    const path = require("path");
    const raw = await fs.readFile(path.join(process.cwd(), "data", "settings.json"), "utf-8");
    const settings = JSON.parse(raw);
    return settings.siteUrl ? settings.siteUrl.replace(/\/$/, "") : fallback;
  } catch {
    return fallback;
  }
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = await getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
