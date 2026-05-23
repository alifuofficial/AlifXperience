import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir, readFile, unlink } from "fs/promises";
import path from "path";
import os from "os";
import { existsSync } from "fs";
import * as ftp from "basic-ftp";
import { prisma } from "@/lib/prisma";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/x-icon", "image/vnd.microsoft.icon"];
const SETTINGS_PATH = path.join(process.cwd(), "data", "settings.json");

async function readSettings() {
  try {
    const raw = await readFile(SETTINGS_PATH, "utf-8");
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    if (!ALLOWED.includes(file.type))
      return NextResponse.json({ error: "Unsupported file type. Use JPEG, PNG, WebP, GIF, AVIF, or ICO." }, { status: 415 });

    if (file.size > MAX_SIZE)
      return NextResponse.json({ error: "File too large. Max 5 MB." }, { status: 413 });

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Read Storage Settings
    const settings = await readSettings();
    const ftpEnabled = settings.ftpEnabled === "true";

    if (ftpEnabled) {
      const ftpHost = settings.ftpHost?.trim();
      const ftpPort = parseInt(settings.ftpPort || "21", 10);
      const ftpUser = settings.ftpUser?.trim();
      const ftpPass = settings.ftpPass?.trim();
      const ftpRemotePath = settings.ftpRemotePath?.trim() || "/";
      const ftpPublicUrl = settings.ftpPublicUrl?.trim() || "";

      if (!ftpHost || !ftpUser || !ftpPass) {
        return NextResponse.json({ error: "FTP storage is enabled but server host/credentials are missing." }, { status: 500 });
      }

      if (!ftpPublicUrl) {
        return NextResponse.json({ error: "FTP Public URL is not configured in Settings. Please set the public HTTP/HTTPS URL for your FTP storage under Admin Settings -> FTP Storage tab before uploading." }, { status: 400 });
      }

      const client = new ftp.Client();
      client.ftp.verbose = false;

      const tmpFile = path.join(os.tmpdir(), unique);

      try {
        await writeFile(tmpFile, buffer);

        await client.access({
          host: ftpHost,
          port: ftpPort,
          user: ftpUser,
          password: ftpPass,
          secure: false,
        });

        await client.ensureDir(ftpRemotePath);

        const remoteFilePath = path.posix.join(ftpRemotePath, unique);
        await client.uploadFrom(tmpFile, remoteFilePath);

        const baseUrl = ftpPublicUrl.replace(/\/$/, "");
        const returnedUrl = `${baseUrl}/${unique}`;

        console.log(`[FTP Upload Success] File uploaded to remote FTP: ${remoteFilePath}. Public URL: ${returnedUrl}`);

        await prisma.media.create({
          data: {
            name: file.name,
            filename: unique,
            url: returnedUrl,
            mimeType: file.type || "application/octet-stream",
            size: file.size,
            storageType: "FTP",
          },
        });

        return NextResponse.json({ url: returnedUrl }, { status: 201 });
      } catch (ftpError: any) {
        console.error("[FTP Upload Error]", ftpError);
        return NextResponse.json({ error: `FTP server connection/upload failed: ${ftpError.message || ftpError}` }, { status: 500 });
      } finally {
        client.close();
        await unlink(tmpFile).catch(() => {});
      }
    } else {
      // 2. Fallback to Local Storage
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true });

      await writeFile(path.join(uploadDir, unique), buffer);

      const returnedUrl = `/uploads/${unique}`;

      // Register inside Database
      await prisma.media.create({
        data: {
          name: file.name,
          filename: unique,
          url: returnedUrl,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          storageType: "LOCAL",
        },
      });

      return NextResponse.json({ url: returnedUrl }, { status: 201 });
    }
  } catch (e: any) {
    console.error("[POST /api/upload]", e);
    return NextResponse.json({ error: e.message || "Upload failed" }, { status: 500 });
  }
}
