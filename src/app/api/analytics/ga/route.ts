import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGoogleAnalyticsData } from "@/lib/ga";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await getGoogleAnalyticsData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API /api/analytics/ga]", error);
    return NextResponse.json({ error: "Failed to fetch GA data" }, { status: 500 });
  }
}
