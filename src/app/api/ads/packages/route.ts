import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const packages = await prisma.adPackage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(packages);
  } catch (error) {
    console.error("Failed to fetch ad packages:", error);
    return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, price, priceUnit, features, isFeatured, sortOrder } = body;

    const pkg = await prisma.adPackage.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        priceUnit,
        features: JSON.stringify(features || []),
        isFeatured: isFeatured || false,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json(pkg);
  } catch (error) {
    console.error("Failed to create ad package:", error);
    return NextResponse.json({ error: "Failed to create package" }, { status: 500 });
  }
}