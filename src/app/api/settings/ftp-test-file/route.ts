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

      console.log(`[FTP Test File] Ensuring directory exists: ${remotePath}`);
      await client.ensureDir(remotePath);

      const remoteFilePath = path.posix.join(remotePath, filename);
      console.log(`[FTP Test File] Uploading to remote path: ${remoteFilePath}`);
      await client.uploadFrom(tmpFile, remoteFilePath);

      // Verify the file actually exists on the server
      console.log(`[FTP Test File] Verifying file exists via SIZE command`);
      const fileSize = await client.size(remoteFilePath);
      console.log(`[FTP Test File] Verified file size: ${fileSize} bytes`);

      // Also try to list the directory to confirm file is there
      try {
        const listing = await client.list(remotePath);
        const fileInListing = listing.some(f => f.name === filename);
        console.log(`[FTP Test File] Directory listing contains our file: ${fileInListing}`);
        if (!fileInListing) {
          console.warn(`[FTP Test File] File not found in directory listing after upload!`);
          console.log(`[FTP Test File] Directory listing:`, listing.map(f => f.name));
        }
      } catch (listErr: any) {
        console.warn(`[FTP Test File] Could not list directory:`, listErr);
      }

      const baseUrl = ftpPublicUrl.trim().replace(/\/$/, "");
      const fileUrl = `${baseUrl}/${filename}`;

      return NextResponse.json({
        success: true,
        message: `Test file created and uploaded successfully! Remote path: ${remoteFilePath}`,
        filename,
        url: fileUrl,
        remotePath,
        fileSize,
        // Additional diagnostic info
        diagnostics: {
          remotePath,
          filename,
          remoteFilePath,
          baseUrl,
          fileUrl,
          verifiedSize: fileSize
        }
      });
    } catch (ftpErr: any) {
      console.error("[FTP Test File Error]", ftpErr);
      return NextResponse.json(
        {
          success: false,
          error: ftpErr.message || "Failed to upload test file to FTP server. Check data connection permissions and remote path.",
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
