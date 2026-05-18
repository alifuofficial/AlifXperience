import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface Params {
  params: Promise<{ id: string }>;
}

// PATCH: Updates booking request status (e.g. APPROVED, REJECTED)
export async function PATCH(req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "Missing status field" }, { status: 400 });
    }

    const updated = await prisma.adRequest.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[PATCH /api/ads/requests/[id]]", error);
    return NextResponse.json({ error: error.message || "Failed to update request" }, { status: 500 });
  }
}

// DELETE: Clears historical inquiries from admin dashboard panel
export async function DELETE(req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.adRequest.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Request successfully cleared" });
  } catch (error: any) {
    console.error("[DELETE /api/ads/requests/[id]]", error);
    return NextResponse.json({ error: error.message || "Failed to clear request" }, { status: 500 });
  }
}
