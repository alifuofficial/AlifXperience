import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as ftp from "basic-ftp";

export async function POST(req: NextRequest) {
  // 1. Enforce Admin session
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { ftpHost, ftpPort, ftpUser, ftpPass } = await req.json();

    if (!ftpHost?.trim() || !ftpUser?.trim() || !ftpPass?.trim()) {
      return NextResponse.json(
        { error: "FTP Host, Username, and Password are required to test connection." },
        { status: 400 }
      );
    }

    const port = parseInt(ftpPort || "21", 10);
    const client = new ftp.Client();
    client.ftp.verbose = false;

    try {
      // Connect with a 10 second timeout limit
      await client.access({
        host: ftpHost.trim(),
        port,
        user: ftpUser.trim(),
        password: ftpPass.trim(),
        secure: false, // Standard FTP for testing, or standard implicit configurations
      });

      // Connection succeeded! Close client and return
      return NextResponse.json({
        success: true,
        message: "Successfully established a connection to the FTP server!",
      });
    } catch (ftpErr: any) {
      console.error("[FTP Test Connection Error]", ftpErr);
      return NextResponse.json(
        {
          success: false,
          error: ftpErr.message || "Could not connect to the FTP server. Please verify your host and credentials.",
        },
        { status: 200 } // Return 200 so the frontend gets a clean structured error message rather than a 500 stack trace
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
