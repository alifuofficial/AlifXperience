import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

const SETTINGS_PATH = path.join(process.cwd(), "data", "settings.json");

const DEFAULTS = {
  siteName: "NEXUS",
  siteTagline: "The Future of Tech",
  siteDescription: "A modern technology magazine exploring the cutting edge of AI, software, and hardware.",
  siteUrl: "https://alifxperience.com",
  logoType: "text",
  logotext: "",
  logoUrl: "",
  faviconUrl: "",
  twitterUrl: "",
  linkedinUrl: "",
  githubUrl: "",
  youtubeUrl: "",
  metaTitle: "NEXUS | The Future of Tech",
  metaDescription: "A modern technology magazine exploring the cutting edge of AI, software, and hardware.",
  metaKeywords: "technology, AI, hardware, cybersecurity, space",
  googleAnalyticsId: "",
  googleAdsenseId: "",
  gaPropertyId: "",
  gaClientEmail: "",
  gaPrivateKey: "",
  googleClientId: "",
  postsPerPage: "10",
  allowComments: "true",
  requireCommentApproval: "false",
  maintenanceMode: "false",
  footerBio: "",
  newsTickerEnabled: "true",
  smtpHost: "",
  smtpPort: "587",
  smtpUser: "",
  smtpPass: "",
  smtpSecure: "tls",
  smtpSenderEmail: "",
  smtpSenderName: "NEXUS Tech",
  allowRegistration: "true",
  defaultUserRole: "USER",
  ftpEnabled: "false",
  ftpHost: "",
  ftpPort: "21",
  ftpUser: "",
  ftpPass: "",
  ftpRemotePath: "/",
  ftpPublicUrl: "",
  advertisePageEnabled: "true",
  disabledAdSlots: "",
  bannerAdEnabled: "true",
  bannerAdIsOpen: "true",
  bannerAdImageUrl: "",
  bannerAdLinkUrl: "/advertise",
  bannerAdHtmlCode: "",
  downloadCountdown: "12",
  showPostViews: "true",
};

async function readSettings() {
  try {
    const raw = await readFile(SETTINGS_PATH, "utf-8");
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await readSettings());
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const current = await readSettings();
    const merged = { ...current, ...body };
    const dir = path.dirname(SETTINGS_PATH);
    if (!existsSync(dir)) await mkdir(dir, { recursive: true });
    await writeFile(SETTINGS_PATH, JSON.stringify(merged, null, 2));
    return NextResponse.json(merged);
  } catch (e) {
    console.error("[POST /api/settings]", e);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
