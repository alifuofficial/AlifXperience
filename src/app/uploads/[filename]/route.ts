import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

// Helper to determine Content-Type based on file extension
function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    case "webp":
      return "image/webp";
    case "ico":
      return "image/x-icon";
    case "apk":
      return "application/vnd.android.package-archive";
    case "pdf":
      return "application/pdf";
    case "json":
      return "application/json";
    case "txt":
      return "text/plain";
    default:
      return "application/octet-stream";
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    // Safely construct target path to prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(process.cwd(), "public", "uploads", safeFilename);

    if (!existsSync(filePath)) {
      return new NextResponse("File Not Found", { status: 404 });
    }

    // Read file buffer from storage
    const fileBuffer = await readFile(filePath);
    const mimeType = getMimeType(safeFilename);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[Dynamic Upload Serving Error]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
