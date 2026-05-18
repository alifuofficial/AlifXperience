import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface Params {
  params: Promise<{ id: string }>;
}

// PATCH: Updates ad campaign properties or toggles statuses
export async function PATCH(req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { title, companyName, slot, imageUrl, linkUrl, htmlCode, status, impressions, clicks } = body;

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (companyName !== undefined) data.companyName = companyName;
    if (slot !== undefined) data.slot = slot;
    if (imageUrl !== undefined) data.imageUrl = imageUrl || null;
    if (linkUrl !== undefined) data.linkUrl = linkUrl || null;
    if (htmlCode !== undefined) data.htmlCode = htmlCode || null;
    if (status !== undefined) data.status = status;
    if (impressions !== undefined) data.impressions = impressions;
    if (clicks !== undefined) data.clicks = clicks;

    const ad = await prisma.ad.update({
      where: { id },
      data,
    });

    return NextResponse.json(ad);
  } catch (error: any) {
    console.error("[PATCH /api/ads/[id]]", error);
    return NextResponse.json({ error: error.message || "Failed to update ad" }, { status: 500 });
  }
}

// DELETE: Removes placement record from DB
export async function DELETE(req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.ad.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Ad successfully deleted" });
  } catch (error: any) {
    console.error("[DELETE /api/ads/[id]]", error);
    return NextResponse.json({ error: error.message || "Failed to delete ad" }, { status: 500 });
  }
}
