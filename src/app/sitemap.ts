import { prisma } from "@/lib/prisma";
import { MetadataRoute } from "next";

// Helper to read siteUrl from settings.json
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = await getSiteUrl();

  // Query live published posts from the database
  let postUrls: any[] = [];
  try {
    const posts = await prisma.post.findMany({
      where: { published: true },
      select: { slug: true, createdAt: true },
    });
    postUrls = posts.map((post) => ({
      url: `${baseUrl}/${post.slug}`,
      lastModified: new Date(post.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error("[Sitemap Generation] Failed to fetch posts:", error);
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/auth/signin`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/auth/signup`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.2,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.2,
    },
    ...postUrls,
  ];
}
