import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const SETTINGS_PATH = path.join(process.cwd(), "data", "settings.json");

export async function GET() {
  let adsenseId = "";
  try {
    const raw = await readFile(SETTINGS_PATH, "utf-8");
    const settings = JSON.parse(raw);
    adsenseId = settings.googleAdsenseId?.trim() || "";
  } catch {
    // Fail-safe
  }

  // Format of ads.txt for Google AdSense:
  // google.com, ca-pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
  let content = "# AlifXperience Authorized Digital Sellers File\n";
  
  if (adsenseId) {
    // If ca-pub- prefix is entered, clean it up or structure perfectly
    const cleanId = adsenseId.startsWith("ca-pub-") ? adsenseId : `ca-pub-${adsenseId}`;
    content += `google.com, ${cleanId}, DIRECT, f08c47fec0942fa0\n`;
  } else {
    content += "# Google AdSense Publisher ID is not configured in settings yet.\n";
    content += "# Set it inside Admin Panel -> Settings -> Analytics & Ads.\n";
    content += "google.com, ca-pub-0000000000000000, DIRECT, f08c47fec0942fa0\n";
  }

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
