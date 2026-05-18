import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET: Returns list of ACTIVE ad campaigns. If query slot is given, yields candidates filterable for rotation.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slot = searchParams.get("slot");

    const where: any = { status: "ACTIVE" };
    if (slot) where.slot = slot;

    const ads = await prisma.ad.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(ads);
  } catch (error: any) {
    console.error("[GET /api/ads/public]", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve public ads" }, { status: 500 });
  }
}
