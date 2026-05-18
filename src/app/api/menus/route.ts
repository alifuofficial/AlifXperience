import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export const dynamic = "force-dynamic";

const MENUS_PATH = path.join(process.cwd(), "data", "menus.json");

const DEFAULT_MENUS = [
  { id: "1", name: "Home", href: "/", children: [] },
  { id: "2", name: "AI & ML", href: "/category/ai", children: [] },
  { id: "3", name: "Hardware", href: "/category/hardware", children: [] },
  { id: "4", name: "Security", href: "/category/security", children: [] },
  { id: "5", name: "Space", href: "/category/space", children: [] },
  { id: "6", name: "Reviews", href: "/category/software", children: [] },
  { id: "7", name: "About Us", href: "/about", children: [] }
];

async function readMenus() {
  try {
    if (!existsSync(MENUS_PATH)) return DEFAULT_MENUS;
    const raw = await readFile(MENUS_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return DEFAULT_MENUS;
  }
}

export async function GET() {
  try {
    const menus = await readMenus();
    return NextResponse.json(menus, { status: 200 });
  } catch (error: any) {
    console.error("[GET /api/menus]", error);
    return NextResponse.json({ error: error.message || "Failed to load menus" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid menus data. Must be an array." }, { status: 400 });
    }

    await writeFile(MENUS_PATH, JSON.stringify(body, null, 2), "utf-8");
    return NextResponse.json({ message: "Menus saved successfully", menus: body }, { status: 200 });
  } catch (error: any) {
    console.error("[POST /api/menus]", error);
    return NextResponse.json({ error: error.message || "Failed to save menus" }, { status: 500 });
  }
}
