import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(categories);
  } catch {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const existing = await prisma.category.findFirst({ where: { OR: [{ name: name.trim() }, { slug }] } });
    if (existing) return NextResponse.json({ error: "Category already exists" }, { status: 409 });

    const category = await prisma.category.create({ data: { name: name.trim(), slug } });
    return NextResponse.json(category, { status: 201 });
  } catch (e) {
    console.error("[POST /api/categories]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
