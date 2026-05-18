import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const revenues = await prisma.adRevenue.findMany({
      orderBy: { date: "desc" },
      take: 30,
    });

    const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const monthRevenue = revenues
      .filter((r) => new Date(r.date) >= thisMonth)
      .reduce((sum, r) => sum + r.amount, 0);

    return NextResponse.json({
      revenues,
      totalRevenue,
      monthRevenue,
    });
  } catch (error) {
    console.error("Failed to fetch revenue:", error);
    return NextResponse.json({ error: "Failed to fetch revenue" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { source, amount, description } = body;

    const revenue = await prisma.adRevenue.create({
      data: {
        source,
        amount: parseFloat(amount),
        description,
      },
    });

    return NextResponse.json(revenue);
  } catch (error) {
    console.error("Failed to add revenue:", error);
    return NextResponse.json({ error: "Failed to add revenue" }, { status: 500 });
  }
}