import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ posts: [] });
  }

  try {
    const posts = await prisma.post.findMany({
      where: {
        published: true,
        OR: [
          { title: { contains: query } },
          { excerpt: { contains: query } },
          { content: { contains: query } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        category: true,
      },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ posts: [], error: "Search failed" }, { status: 500 });
  }
}