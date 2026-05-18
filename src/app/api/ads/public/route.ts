import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const SETTINGS_PATH = path.join(process.cwd(), "data", "settings.json");

async function isSlotDisabled(slot: string): Promise<boolean> {
  try {
    const raw = await readFile(SETTINGS_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    const disabledStr = parsed.disabledAdSlots || "";
    const disabledList = disabledStr.split(",").map((s: string) => s.trim());
    return disabledList.includes(slot);
  } catch {
    return false;
  }
}

// GET: Returns list of ACTIVE ad campaigns. If query slot is given, yields candidates filterable for rotation.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slot = searchParams.get("slot");

    if (slot && await isSlotDisabled(slot)) {
      return NextResponse.json([]);
    }

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
