import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function slugify(str: string) {
  return str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}

// Auto-save a draft — does NOT require category or valid content
// Used by the 30s interval and 3s debounce on the new post page
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const authorId = (session.user as any).id;
    if (!authorId) return NextResponse.json({ error: "No author" }, { status: 400 });

    const title = (body.title ?? "Untitled Draft").trim();
    const slug = body.slug?.trim() || slugify(title) || `draft-${Date.now()}`;
    const content = body.content ?? "<p></p>";

    // Resolve categoryId — fall back to first available category if not set
    let categoryId = body.categoryId;
    if (!categoryId) {
      const first = await prisma.category.findFirst({ orderBy: { name: "asc" } });
      if (!first) {
        // Create a default "Uncategorized" category on the fly
        const cat = await prisma.category.upsert({
          where: { slug: "uncategorized" },
          update: {},
          create: { name: "Uncategorized", slug: "uncategorized" },
        });
        categoryId = cat.id;
      } else {
        categoryId = first.id;
      }
    }

    if (body.id) {
      // Update existing draft
      const updated = await prisma.post.update({
        where: { id: body.id },
        data: { title, slug, content, excerpt: body.excerpt ?? null, coverImage: body.coverImage || null, categoryId, published: false, updatedAt: new Date() },
      });
      return NextResponse.json({ id: updated.id });
    } else {
      // Ensure slug uniqueness for new draft
      let finalSlug = slug;
      const existing = await prisma.post.findUnique({ where: { slug: finalSlug } });
      if (existing) finalSlug = `${slug}-${Date.now()}`;

      const created = await prisma.post.create({
        data: { title, slug: finalSlug, content, excerpt: body.excerpt ?? null, coverImage: body.coverImage || null, published: false, authorId, categoryId },
      });
      return NextResponse.json({ id: created.id });
    }
  } catch (e) {
    console.error("[POST /api/posts/autosave]", e);
    return NextResponse.json({ error: "Auto-save failed" }, { status: 500 });
  }
}
