import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import path from "path";
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

function getMimeFromExt(ext: string): string {
  switch (ext) {
    case "png": return "image/png";
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "webp": return "image/webp";
    case "gif": return "image/gif";
    case "avif": return "image/avif";
    case "svg": return "image/svg+xml";
    case "ico": return "image/x-icon";
    case "apk": return "application/vnd.android.package-archive";
    case "pdf": return "application/pdf";
    case "zip": return "application/zip";
    case "mp4": return "video/mp4";
    case "webm": return "video/webm";
    case "mp3": return "audio/mpeg";
    default: return "application/octet-stream";
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || (role !== "ADMIN" && role !== "AUTHOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await readSettings();
    const ftpEnabled = settings.ftpEnabled === "true";

    if (!ftpEnabled) {
      return NextResponse.json({ error: "FTP storage is not enabled in settings." }, { status: 400 });
    }

    const ftpHost = settings.ftpHost?.trim();
    const ftpUser = settings.ftpUser?.trim();
    const ftpPass = settings.ftpPass?.trim();
    const ftpRemotePath = settings.ftpRemotePath?.trim() || "/";
    const ftpPublicUrl = settings.ftpPublicUrl?.trim() || "";

    if (!ftpHost || !ftpUser || !ftpPass) {
      return NextResponse.json({ error: "FTP server configurations are missing in settings." }, { status: 400 });
    }

    const client = createFtpClient(settings);
    setFtpTransferMode(client, settings);

    let syncCount = 0;
    try {
      await client.access(getFtpAccessOptions(settings));

      // List remote files
      const list = await client.list(ftpRemotePath);

      // Fetch all registered FTP filenames in DB to prevent duplicate checks in a loop
      const registered = await prisma.media.findMany({
        where: { storageType: "FTP" },
        select: { filename: true },
      });
      const registeredSet = new Set(registered.map((r: { filename: string }) => r.filename));

      const baseUrl = ftpPublicUrl.replace(/\/$/, "");

      // Auto-heal and patch any relative FTP URLs currently saved in your database
      if (baseUrl) {
        const relativeFTPMedia = await prisma.media.findMany({
          where: {
            storageType: "FTP",
            url: { startsWith: "/" },
          },
        });

        if (relativeFTPMedia.length > 0) {
          console.log(`[FTP Sync Auto-Heal] Found ${relativeFTPMedia.length} relative FTP media URLs. Prepending public host...`);
          for (const m of relativeFTPMedia) {
            const fixedUrl = `${baseUrl}/${m.filename}`;
            await prisma.media.update({
              where: { id: m.id },
              data: { url: fixedUrl },
            });
          }
        }

        const ftpAssets = await prisma.media.findMany({
          where: { storageType: "FTP" },
          select: { filename: true },
        });
        const ftpFilenames = ftpAssets.map((a: { filename: string }) => a.filename);

        if (ftpFilenames.length > 0) {
          const postsWithRelativeCovers = await prisma.post.findMany({
            where: {
              coverImage: { startsWith: "/" },
            },
          });

          for (const post of postsWithRelativeCovers) {
            const coverImage = post.coverImage || "";
            const filename = coverImage.split("/").pop() || "";
            if (ftpFilenames.includes(filename)) {
              const fixedCover = `${baseUrl}/${filename}`;
              await prisma.post.update({
                where: { id: post.id },
                data: { coverImage: fixedCover },
              });
              console.log(`[FTP Sync Auto-Heal] Fixed coverImage for post "${post.title}" -> ${fixedCover}`);
            }
          }

          const postsWithRelativeContent = await prisma.post.findMany({
            where: {
              OR: [
                { content: { contains: 'src="/' } },
                { content: { contains: 'href="/' } },
              ],
            },
          });

          for (const post of postsWithRelativeContent) {
            let updatedContent = post.content;
            let contentChanged = false;

            for (const filename of ftpFilenames) {
              const oldSrc = `src="/${filename}"`;
              const newSrc = `src="${baseUrl}/${filename}"`;
              if (updatedContent.includes(oldSrc)) {
                updatedContent = updatedContent.replaceAll(oldSrc, newSrc);
                contentChanged = true;
              }

              const oldHref = `href="/${filename}"`;
              const newHref = `href="${baseUrl}/${filename}"`;
              if (updatedContent.includes(oldHref)) {
                updatedContent = updatedContent.replaceAll(oldHref, newHref);
                contentChanged = true;
              }
            }

            if (contentChanged) {
              await prisma.post.update({
                where: { id: post.id },
                data: { content: updatedContent },
              });
              console.log(`[FTP Sync Auto-Heal] Fixed content URLs for post "${post.title}"`);
            }
          }
        }
      }

      for (const fileInfo of list) {
        if (fileInfo.type !== 1) continue;

        const name = fileInfo.name;
        if (registeredSet.has(name)) continue;

        const ext = name.split(".").pop()?.toLowerCase() ?? "";
        const mime = getMimeFromExt(ext);
        const url = `${baseUrl}/${name}`;

        await prisma.media.create({
          data: {
            name: name,
            filename: name,
            url: url,
            mimeType: mime,
            size: Number(fileInfo.size),
            storageType: "FTP",
          },
        });

        syncCount++;
      }
    } catch (ftpErr: any) {
      console.error("[FTP Sync Error]", ftpErr);
      return NextResponse.json({ error: `FTP server connection or scan failed: ${ftpErr.message || ftpErr}` }, { status: 500 });
    } finally {
      client.close();
    }

    return NextResponse.json({
      success: true,
      syncCount,
      message: `Successfully synchronized ${syncCount} new assets from remote FTP server!`,
    });
  } catch (error: any) {
    console.error("[POST /api/admin/media/sync]", error);
    return NextResponse.json({ error: error.message || "Failed to synchronize FTP files" }, { status: 500 });
  }
}