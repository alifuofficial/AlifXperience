import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const { name, slug } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const finalSlug = slug?.trim() || name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    // Check slug uniqueness excluding self
    const conflict = await prisma.category.findFirst({ where: { slug: finalSlug, NOT: { id } } });
    if (conflict) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });

    const category = await prisma.category.update({
      where: { id },
      data: { name: name.trim(), slug: finalSlug },
    });
    return NextResponse.json(category);
  } catch (e) {
    console.error("[PATCH /api/categories/[id]]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;

    // Move posts to "Uncategorized" before deleting
    const fallback = await prisma.category.upsert({
      where: { slug: "uncategorized" },
      update: {},
      create: { name: "Uncategorized", slug: "uncategorized" },
    });

    if (fallback.id !== id) {
      await prisma.post.updateMany({ where: { categoryId: id }, data: { categoryId: fallback.id } });
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/categories/[id]]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
