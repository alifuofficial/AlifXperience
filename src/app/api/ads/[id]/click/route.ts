import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface Params {
  params: Promise<{ id: string }>;
}

// GET: Increments click metrics and redirects instantly to destination URL
export async function GET(req: Request, { params }: Params) {
  try {
    const { id } = await params;

    const ad = await prisma.ad.findUnique({
      where: { id },
    });

    if (!ad) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Increment click count asynchronously
    await prisma.ad.update({
      where: { id },
      data: { clicks: { increment: 1 } },
    });

    const destination = ad.linkUrl || "/advertise";
    return NextResponse.redirect(new URL(destination, req.url));
  } catch (error) {
    console.error("[GET /api/ads/[id]/click]", error);
    return NextResponse.redirect(new URL("/", req.url));
  }
}
