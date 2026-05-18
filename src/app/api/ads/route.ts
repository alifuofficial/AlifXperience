import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: Lists all ads / sponsor requests
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ads = await prisma.ad.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(ads);
  } catch (error: any) {
    console.error("[GET /api/ads]", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve ads" }, { status: 500 });
  }
}

// POST: Creates a new ad campaign slot
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, companyName, slot, imageUrl, linkUrl, htmlCode, status } = body;

    if (!title || !companyName || !slot) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const ad = await prisma.ad.create({
      data: {
        title,
        companyName,
        slot,
        imageUrl: imageUrl || null,
        linkUrl: linkUrl || null,
        htmlCode: htmlCode || null,
        status: status || "ACTIVE",
      },
    });

    return NextResponse.json(ad, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/ads]", error);
    return NextResponse.json({ error: error.message || "Failed to create ad" }, { status: 500 });
  }
}
