import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: Retrieves all pending or historical sponsorship inquires
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = await prisma.adRequest.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(requests);
  } catch (error: any) {
    console.error("[GET /api/ads/requests]", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve sponsor requests" }, { status: 500 });
  }
}

// POST: Public submission endpoint for sponsors to record requests
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { brandName, email, tier, message } = body;

    if (!brandName || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const request = await prisma.adRequest.create({
      data: {
        brandName,
        email,
        tier: tier || "Standard Banner Placement",
        message,
        status: "PENDING",
      },
    });

    return NextResponse.json(request, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/ads/requests]", error);
    return NextResponse.json({ error: error.message || "Failed to save sponsorship inquiry" }, { status: 500 });
  }
}
