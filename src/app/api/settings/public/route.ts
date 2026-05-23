import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const SETTINGS_PATH = path.join(process.cwd(), "data", "settings.json");

const PUBLIC_DEFAULTS = {
  siteName: "NEXUS",
  siteTagline: "The Future of Tech",
  siteDescription: "A modern technology magazine exploring the cutting edge of AI, software, and hardware.",
  siteUrl: "https://alifxperience.com",
  logoType: "text",
  logotext: "",
  logoUrl: "",
  faviconUrl: "",
  allowRegistration: "true",
  maintenanceMode: "false",
  footerBio: "",
  newsTickerEnabled: "true",
  bannerAdEnabled: "true",
  bannerAdIsOpen: "true",
  bannerAdImageUrl: "",
  bannerAdLinkUrl: "/advertise",
  bannerAdHtmlCode: "",
  googleClientId: "",
  advertisePageEnabled: "true",
  disabledAdSlots: "",
  downloadCountdown: "12",
  showPostViews: "true",
};

async function readSettings() {
  try {
    const raw = await readFile(SETTINGS_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    
    // Extract only safe public fields
    return {
      siteName: parsed.siteName ?? PUBLIC_DEFAULTS.siteName,
      siteTagline: parsed.siteTagline ?? PUBLIC_DEFAULTS.siteTagline,
      siteDescription: parsed.siteDescription ?? PUBLIC_DEFAULTS.siteDescription,
      siteUrl: parsed.siteUrl ?? PUBLIC_DEFAULTS.siteUrl,
      logoType: parsed.logoType ?? PUBLIC_DEFAULTS.logoType,
      logotext: parsed.logotext ?? PUBLIC_DEFAULTS.logotext,
      logoUrl: parsed.logoUrl ?? PUBLIC_DEFAULTS.logoUrl,
      footerBio: parsed.footerBio ?? PUBLIC_DEFAULTS.footerBio,
      faviconUrl: parsed.faviconUrl ?? PUBLIC_DEFAULTS.faviconUrl,
      allowRegistration: parsed.allowRegistration ?? PUBLIC_DEFAULTS.allowRegistration,
      maintenanceMode: parsed.maintenanceMode ?? PUBLIC_DEFAULTS.maintenanceMode,
      newsTickerEnabled: parsed.newsTickerEnabled ?? PUBLIC_DEFAULTS.newsTickerEnabled,
      bannerAdEnabled: parsed.bannerAdEnabled ?? PUBLIC_DEFAULTS.bannerAdEnabled,
      bannerAdIsOpen: parsed.bannerAdIsOpen ?? PUBLIC_DEFAULTS.bannerAdIsOpen,
      bannerAdImageUrl: parsed.bannerAdImageUrl ?? PUBLIC_DEFAULTS.bannerAdImageUrl,
      bannerAdLinkUrl: parsed.bannerAdLinkUrl ?? PUBLIC_DEFAULTS.bannerAdLinkUrl,
      bannerAdHtmlCode: parsed.bannerAdHtmlCode ?? PUBLIC_DEFAULTS.bannerAdHtmlCode,
      googleClientId: parsed.googleClientId ?? PUBLIC_DEFAULTS.googleClientId,
      advertisePageEnabled: parsed.advertisePageEnabled ?? PUBLIC_DEFAULTS.advertisePageEnabled,
      disabledAdSlots: parsed.disabledAdSlots ?? PUBLIC_DEFAULTS.disabledAdSlots,
      downloadCountdown: parsed.downloadCountdown ?? PUBLIC_DEFAULTS.downloadCountdown,
      showPostViews: parsed.showPostViews ?? PUBLIC_DEFAULTS.showPostViews,
    };
  } catch {
    return PUBLIC_DEFAULTS;
  }
}

export async function GET() {
  try {
    const data = await readSettings();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[GET /api/settings/public]", error);
    return NextResponse.json(PUBLIC_DEFAULTS);
  }
}
