import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export const dynamic = "force-dynamic";

const MENUS_PATH = path.join(process.cwd(), "data", "menus.json");
const FOOTER_MENUS_PATH = path.join(process.cwd(), "data", "footer_menus.json");

const DEFAULT_MENUS = [
  { id: "1", name: "Home", href: "/", children: [] },
  { id: "2", name: "AI & ML", href: "/category/ai", children: [] },
  { id: "3", name: "Hardware", href: "/category/hardware", children: [] },
  { id: "4", name: "Security", href: "/category/security", children: [] },
  { id: "5", name: "Space", href: "/category/space", children: [] },
  { id: "6", name: "Reviews", href: "/category/software", children: [] },
  { id: "7", name: "About Us", href: "/about", children: [] }
];

const DEFAULT_FOOTER_MENUS = [
  { id: "f1", name: "AI & Machine Learning", href: "/category/ai", children: [] },
  { id: "f2", name: "Hardware", href: "/category/hardware", children: [] },
  { id: "f3", name: "Cybersecurity", href: "/category/security", children: [] },
  { id: "f4", name: "Space Tech", href: "/category/space", children: [] },
  { id: "f5", name: "Software", href: "/category/software", children: [] },
  { id: "f6", name: "Reviews", href: "/category/software", children: [] }
];

async function readMenus(location: string) {
  const filePath = location === "footer" ? FOOTER_MENUS_PATH : MENUS_PATH;
  const defaults = location === "footer" ? DEFAULT_FOOTER_MENUS : DEFAULT_MENUS;
  try {
    if (!existsSync(filePath)) return defaults;
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return defaults;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const location = searchParams.get("location") || "header";
    const menus = await readMenus(location);
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
    const { searchParams } = new URL(req.url);
    const location = searchParams.get("location") || "header";
    const filePath = location === "footer" ? FOOTER_MENUS_PATH : MENUS_PATH;

    const body = await req.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid menus data. Must be an array." }, { status: 400 });
    }

    await writeFile(filePath, JSON.stringify(body, null, 2), "utf-8");
    return NextResponse.json({ 
      message: `Menus for ${location} saved successfully`, 
      menus: body 
    }, { status: 200 });
  } catch (error: any) {
    console.error("[POST /api/menus]", error);
    return NextResponse.json({ error: error.message || "Failed to save menus" }, { status: 500 });
  }
}
