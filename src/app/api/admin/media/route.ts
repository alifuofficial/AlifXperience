import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import { Readable } from "stream";
import * as ftp from "basic-ftp";

const MAX_SIZE = 100 * 1024 * 1024; // 100 MB
const SETTINGS_PATH = path.join(process.cwd(), "data", "settings.json");

async function readSettings() {
  try {
    const raw = await readFile(SETTINGS_PATH, "utf-8");
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

// GET: List all media items
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || (role !== "ADMIN" && role !== "AUTHOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "all";

    // Build Prisma query filters
    let whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { filename: { contains: search } },
      ];
    }

    if (type !== "all") {
      if (type === "image") {
        whereClause.mimeType = { startsWith: "image/" };
      } else if (type === "video") {
        whereClause.mimeType = { startsWith: "video/" };
      } else if (type === "audio") {
        whereClause.mimeType = { startsWith: "audio/" };
      } else if (type === "apk") {
        whereClause.OR = [
          { mimeType: { contains: "android" } },
          { name: { endsWith: ".apk" } },
        ];
      } else if (type === "document") {
        whereClause.NOT = [
          { mimeType: { startsWith: "image/" } },
          { mimeType: { startsWith: "video/" } },
          { mimeType: { startsWith: "audio/" } },
          { mimeType: { contains: "android" } },
          { name: { endsWith: ".apk" } },
        ];
      }
    }

    const items = await prisma.media.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(items, { status: 200 });
  } catch (error: any) {
    console.error("[GET /api/admin/media]", error);
    return NextResponse.json({ error: error.message || "Failed to fetch media assets" }, { status: 500 });
  }
}

// POST: Upload a new media item
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || (role !== "ADMIN" && role !== "AUTHOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `File too large. Maximum size is 100 MB.` }, { status: 413 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Detect MIME type overrides (e.g. for APK)
    let finalMime = file.type || "application/octet-stream";
    if (ext === "apk") {
      finalMime = "application/vnd.android.package-archive";
    }

    // 1. Read Storage Settings
    const settings = await readSettings();
    const ftpEnabled = settings.ftpEnabled === "true";

    let returnedUrl = "";
    let storageType = "LOCAL";

    if (ftpEnabled) {
      const ftpHost = settings.ftpHost?.trim();
      const ftpPort = parseInt(settings.ftpPort || "21", 10);
      const ftpUser = settings.ftpUser?.trim();
      const ftpPass = settings.ftpPass?.trim();
      const ftpRemotePath = settings.ftpRemotePath?.trim() || "/";
      const ftpPublicUrl = settings.ftpPublicUrl?.trim() || "";

      if (!ftpHost || !ftpUser || !ftpPass) {
        return NextResponse.json({ error: "FTP storage is enabled but host or credentials are missing in Settings." }, { status: 500 });
      }

      const client = new ftp.Client();
      client.ftp.verbose = false;

      try {
        await client.access({
          host: ftpHost,
          port: ftpPort,
          user: ftpUser,
          password: ftpPass,
          secure: false,
        });

        // Convert Buffer to stream
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        // Upload to FTP
        const remoteFilePath = path.posix.join(ftpRemotePath, unique);
        await client.uploadFrom(stream, remoteFilePath);

        const baseUrl = ftpPublicUrl.replace(/\/$/, "");
        returnedUrl = `${baseUrl}/${unique}`;
        storageType = "FTP";
      } catch (ftpErr: any) {
        console.error("[FTP Upload Error]", ftpErr);
        return NextResponse.json({ error: `FTP server connection failed: ${ftpErr.message || ftpErr}` }, { status: 500 });
      } finally {
        client.close();
      }
    } else {
      // Local Storage Fallback
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      await writeFile(path.join(uploadDir, unique), buffer);
      returnedUrl = `/uploads/${unique}`;
      storageType = "LOCAL";
    }

    // Register inside Database
    const mediaItem = await prisma.media.create({
      data: {
        name: file.name,
        filename: unique,
        url: returnedUrl,
        mimeType: finalMime,
        size: file.size,
        storageType: storageType,
      },
    });

    return NextResponse.json(mediaItem, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/admin/media]", error);
    return NextResponse.json({ error: error.message || "Failed to process upload" }, { status: 500 });
  }
}
