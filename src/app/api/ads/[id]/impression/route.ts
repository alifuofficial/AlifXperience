import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface Params {
  params: Promise<{ id: string }>;
}

// POST: Increments impression count inside DB for specific ad campaign
export async function POST(req: Request, { params }: Params) {
  try {
    const { id } = await params;

    const ad = await prisma.ad.findUnique({
      where: { id },
    });

    if (!ad) {
      return NextResponse.json({ error: "Ad not found" }, { status: 404 });
    }

    await prisma.ad.update({
      where: { id },
      data: { impressions: { increment: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[POST /api/ads/[id]/impression]", error);
    return NextResponse.json({ error: error.message || "Failed to log impression" }, { status: 500 });
  }
}
