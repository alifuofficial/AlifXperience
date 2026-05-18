import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, role: true, createdAt: true,
        _count: { select: { posts: true, comments: true } },
      },
    });
    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { name, email, password, role } = await req.json();
    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email: email.trim() } });
    if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name: name?.trim() || null, email: email.trim(), password: hash, role: role === "ADMIN" ? "ADMIN" : "USER" },
      select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { posts: true, comments: true } } },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    console.error("[POST /api/users]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
