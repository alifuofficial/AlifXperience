import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink, readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import { createFtpClient, getFtpAccessOptions, setFtpTransferMode } from "@/lib/ftp-client";

const SETTINGS_PATH = path.join(process.cwd(), "data", "settings.json");

async function readSettings() {
  try {
    const raw = await readFile(SETTINGS_PATH, "utf-8");
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || (role !== "ADMIN" && role !== "AUTHOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const item = await prisma.media.findUnique({ where: { id } });

    if (!item) {
      return NextResponse.json({ error: "Media asset not found" }, { status: 404 });
    }

    // 1. Physically delete the file from storage
    if (item.storageType === "FTP") {
      const settings = await readSettings();
      const ftpHost = settings.ftpHost?.trim();
      const ftpUser = settings.ftpUser?.trim();
      const ftpPass = settings.ftpPass?.trim();
      const ftpRemotePath = settings.ftpRemotePath?.trim() || "/";

      if (ftpHost && ftpUser && ftpPass) {
        const client = createFtpClient(settings);
        setFtpTransferMode(client, settings);

        try {
          await client.access(getFtpAccessOptions(settings));

          const remoteFilePath = path.posix.join(ftpRemotePath, item.filename);
          await client.remove(remoteFilePath);
          console.log(`[FTP Delete Success] Purged file from remote FTP: ${remoteFilePath}`);
        } catch (ftpErr) {
          console.error(`[FTP Delete Warning] Could not remove physical FTP file, skipping:`, ftpErr);
        } finally {
          client.close();
        }
      }
    } else {
      // Local Storage Deletion
      const localFilePath = path.join(process.cwd(), "public", "uploads", item.filename);
      if (existsSync(localFilePath)) {
        try {
          await unlink(localFilePath);
          console.log(`[Local Delete Success] Purged file: ${localFilePath}`);
        } catch (unlinkErr) {
          console.error(`[Local Delete Warning] Could not remove physical local file, skipping:`, unlinkErr);
        }
      }
    }

    // 2. Remove document from database
    await prisma.media.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Media asset deleted successfully" });
  } catch (error: any) {
    console.error("[DELETE /api/admin/media/[id]]", error);
    return NextResponse.json({ error: error.message || "Failed to delete media asset" }, { status: 500 });
  }
}