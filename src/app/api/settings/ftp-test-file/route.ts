import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import os from "os";
import * as ftp from "basic-ftp";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { ftpHost, ftpPort, ftpUser, ftpPass, ftpRemotePath, ftpPublicUrl } = await req.json();

    if (!ftpHost?.trim() || !ftpUser?.trim() || !ftpPass?.trim()) {
      return NextResponse.json(
        { error: "FTP Host, Username, and Password are required." },
        { status: 400 }
      );
    }

    if (!ftpPublicUrl?.trim()) {
      return NextResponse.json(
        { error: "FTP Public URL is required to generate the test file URL." },
        { status: 400 }
      );
    }

    const port = parseInt(ftpPort || "21", 10);
    const remotePath = ftpRemotePath?.trim() || "/";
    const filename = `test-${Date.now()}.txt`;
    const content = `FTP test file created at ${new Date().toISOString()}\nServer: ${ftpHost}:${port}\nPath: ${remotePath}`;

    const tmpFile = path.join(os.tmpdir(), filename);
    await writeFile(tmpFile, content, "utf-8");

    const client = new ftp.Client();
    client.ftp.verbose = false;

    try {
      await client.access({
        host: ftpHost.trim(),
        port,
        user: ftpUser.trim(),
        password: ftpPass.trim(),
        secure: false,
      });

      await client.ensureDir(remotePath);

      const remoteFilePath = path.posix.join(remotePath, filename);
      await client.uploadFrom(tmpFile, remoteFilePath);

      const baseUrl = ftpPublicUrl.trim().replace(/\/$/, "");
      const fileUrl = `${baseUrl}/${filename}`;

      return NextResponse.json({
        success: true,
        message: "Test file created and uploaded successfully!",
        filename,
        url: fileUrl,
      });
    } catch (ftpErr: any) {
      console.error("[FTP Test File Error]", ftpErr);
      return NextResponse.json(
        {
          success: false,
          error: ftpErr.message || "Failed to upload test file to FTP server. Check data connection permissions.",
        },
        { status: 200 }
      );
    } finally {
      client.close();
      await unlink(tmpFile).catch(() => {});
    }
  } catch (error: any) {
    console.error("[POST /api/settings/ftp-test-file]", error);
    return NextResponse.json(
      { error: error.message || "Failed to process test file request." },
      { status: 500 }
    );
  }
}
