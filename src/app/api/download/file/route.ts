import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing file ID" }, { status: 400 });

  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return NextResponse.json({ error: "File not found" }, { status: 444 });

  // Increment download count atomically
  try {
    await prisma.media.update({
      where: { id },
      data: { downloadCount: { increment: 1 } },
    });
  } catch (error) {
    console.error("Failed to increment download count:", error);
  }

  // Handle Local storage download
  if (media.storageType === "LOCAL") {
    const filePath = path.join(process.cwd(), "public", "uploads", media.filename);
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "File does not exist on disk" }, { status: 444 });
    }

    try {
      const fileBuffer = await readFile(filePath);
      return new Response(fileBuffer, {
        headers: {
          "Content-Disposition": `attachment; filename="${encodeURIComponent(media.name)}"`,
          "Content-Type": media.mimeType || "application/octet-stream",
        },
      });
    } catch (err: any) {
      return NextResponse.json({ error: "Error reading file from disk" }, { status: 500 });
    }
  }

  // Handle FTP storage: Redirect to the remote public URL
  return NextResponse.redirect(media.url);
}
