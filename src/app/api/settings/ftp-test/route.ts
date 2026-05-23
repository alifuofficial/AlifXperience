import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createFtpClient, getFtpAccessOptions, setFtpTransferMode } from "@/lib/ftp-client";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { ftpHost, ftpPort, ftpUser, ftpPass, ftpSecure, ftpMode } = await req.json();

    if (!ftpHost?.trim() || !ftpUser?.trim() || !ftpPass?.trim()) {
      return NextResponse.json(
        { error: "FTP Host, Username, and Password are required to test connection." },
        { status: 400 }
      );
    }

    const settings: Record<string, string> = {
      ftpHost: ftpHost || "",
      ftpPort: ftpPort || "21",
      ftpUser: ftpUser || "",
      ftpPass: ftpPass || "",
      ftpSecure: ftpSecure || "none",
      ftpMode: ftpMode || "passive",
      ftpTimeout: "30",
    };

    const client = createFtpClient(settings);
    setFtpTransferMode(client, settings);

    try {
      const accessOpts = getFtpAccessOptions(settings);
      await client.access(accessOpts);

      return NextResponse.json({
        success: true,
        message: "Successfully established a connection to the FTP server!",
      });
    } catch (ftpErr: any) {
      console.error("[FTP Test Connection Error]", ftpErr);
      return NextResponse.json(
        {
          success: false,
          error: ftpErr.message || "Could not connect to the FTP server. Please verify your host, credentials, and security settings.",
        },
        { status: 200 }
      );
    } finally {
      client.close();
    }
  } catch (error: any) {
    console.error("[POST /api/settings/ftp-test]", error);
    return NextResponse.json(
      { error: error.message || "Failed to process test request." },
      { status: 500 }
    );
  }
}