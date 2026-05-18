import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const { name, email, role, password } = await req.json();

    // Prevent demoting yourself
    if (id === (session.user as any).id && role === "USER") {
      return NextResponse.json({ error: "You cannot remove your own admin role" }, { status: 400 });
    }

    const data: any = {};
    if (name !== undefined) data.name = name?.trim() || null;
    if (email?.trim()) {
      const conflict = await prisma.user.findFirst({ where: { email: email.trim(), NOT: { id } } });
      if (conflict) return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      data.email = email.trim();
    }
    if (role === "ADMIN" || role === "USER" || role === "AUTHOR") data.role = role;
    if (password?.trim()) data.password = await bcrypt.hash(password, 12);

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { posts: true, comments: true } } },
    });
    return NextResponse.json(user);
  } catch (e) {
    console.error("[PATCH /api/users/[id]]", e);
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
    if (id === (session.user as any).id) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/users/[id]]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
