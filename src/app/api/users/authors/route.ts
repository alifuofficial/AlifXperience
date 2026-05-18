import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const authors = await prisma.user.findMany({
      where: {
        role: {
          in: ["ADMIN", "AUTHOR"]
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: "asc",
      }
    });

    return NextResponse.json(authors);
  } catch (error: any) {
    console.error("[GET /api/users/authors]", error);
    return NextResponse.json({ error: "Failed to fetch authors" }, { status: 500 });
  }
}
