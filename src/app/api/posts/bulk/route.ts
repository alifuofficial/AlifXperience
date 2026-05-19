import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || (role !== "ADMIN" && role !== "AUTHOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { ids, action } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No post IDs provided" }, { status: 400 });
    }

    const userId = (session.user as any).id;

    if (action === "delete") {
      // If the user is an AUTHOR, verify they own all of the selected posts
      if (role === "AUTHOR") {
        const posts = await prisma.post.findMany({
          where: { id: { in: ids } },
          select: { id: true, authorId: true },
        });
        const unauthorized = posts.filter((p) => p.authorId !== userId);
        if (unauthorized.length > 0) {
          return NextResponse.json({ error: "You can only delete articles that you authored." }, { status: 401 });
        }
      }

      await prisma.post.deleteMany({
        where: { id: { in: ids } },
      });
      return NextResponse.json({ ok: true, message: `Successfully deleted ${ids.length} articles.` });
    }

    if (action === "publish") {
      if (role === "AUTHOR") {
        const posts = await prisma.post.findMany({
          where: { id: { in: ids } },
          select: { id: true, authorId: true },
        });
        const unauthorized = posts.filter((p) => p.authorId !== userId);
        if (unauthorized.length > 0) {
          return NextResponse.json({ error: "You can only publish articles that you authored." }, { status: 401 });
        }
      }

      await prisma.post.updateMany({
        where: { id: { in: ids } },
        data: { published: true },
      });
      return NextResponse.json({ ok: true, message: `Successfully published ${ids.length} articles.` });
    }

    if (action === "draft") {
      if (role === "AUTHOR") {
        const posts = await prisma.post.findMany({
          where: { id: { in: ids } },
          select: { id: true, authorId: true },
        });
        const unauthorized = posts.filter((p) => p.authorId !== userId);
        if (unauthorized.length > 0) {
          return NextResponse.json({ error: "You can only edit articles that you authored." }, { status: 401 });
        }
      }

      await prisma.post.updateMany({
        where: { id: { in: ids } },
        data: { published: false },
      });
      return NextResponse.json({ ok: true, message: `Successfully set ${ids.length} articles to draft.` });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[POST /api/posts/bulk]", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
