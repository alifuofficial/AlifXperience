import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

// GET handler: retrieve database status and backup history, or download a live backup
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const download = searchParams.get("download") === "1";
  const dbPath = path.join(process.cwd(), "dev.db");
  const backupsDir = path.join(process.cwd(), "backups");

  // Ensure backups directory exists
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  // Handle live database backup download
  if (download) {
    const tempBackupPath = path.join(process.cwd(), `temp-download-${Date.now()}.db`);
    try {
      // Use better-sqlite3 native backup function for safe, non-blocking snapshot
      const sourceDb = new Database(dbPath, { readonly: true });
      await sourceDb.backup(tempBackupPath);
      sourceDb.close();

      const fileBuffer = fs.readFileSync(tempBackupPath);
      fs.unlinkSync(tempBackupPath);

      const headers = new Headers();
      headers.set("Content-Type", "application/x-sqlite3");
      headers.set("Content-Disposition", `attachment; filename="alifxperience-backup-${new Date().toISOString().slice(0, 10)}.db"`);

      return new NextResponse(fileBuffer, { status: 200, headers });
    } catch (error: any) {
      console.error("[GET /api/admin/backup?download=1] error:", error);
      if (fs.existsSync(tempBackupPath)) {
        try { fs.unlinkSync(tempBackupPath); } catch {}
      }
      return NextResponse.json(
        { success: false, error: error.message || "Failed to compile live database snapshot." },
        { status: 500 }
      );
    }
  }

  // Fetch status details
  try {
    const dbStats = fs.existsSync(dbPath) ? fs.statSync(dbPath) : null;
    let journalMode = "unknown";
    let synchronous = "unknown";

    if (dbStats) {
      try {
        const tempDb = new Database(dbPath, { readonly: true });
        journalMode = tempDb.pragma("journal_mode") as string;
        synchronous = String(tempDb.pragma("synchronous"));
        tempDb.close();
      } catch (pragErr) {
        console.warn("Failed to read SQLite pragmas:", pragErr);
      }
    }

    const backupFiles = fs.readdirSync(backupsDir)
      .filter(f => f.startsWith("dev-backup-") && f.endsWith(".db"))
      .map(f => {
        const filePath = path.join(backupsDir, f);
        const stats = fs.statSync(filePath);
        return {
          name: f,
          size: stats.size,
          createdAt: stats.mtime.toISOString(),
          timeMs: stats.mtimeMs,
        };
      })
      .sort((a, b) => b.timeMs - a.timeMs);

    return NextResponse.json({
      success: true,
      database: {
        size: dbStats?.size || 0,
        lastModified: dbStats?.mtime.toISOString() || null,
        journalMode,
        synchronous,
        path: dbPath,
      },
      backups: backupFiles.map(({ name, size, createdAt }) => ({ name, size, createdAt })),
    });
  } catch (error: any) {
    console.error("[GET /api/admin/backup] status error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch database status." },
      { status: 500 }
    );
  }
}

// POST handler: trigger a server-side transactional backup file
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const dbPath = path.join(process.cwd(), "dev.db");
  const backupsDir = path.join(process.cwd(), "backups");

  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const timestamp = Date.now();
  const backupFileName = `dev-backup-${timestamp}.db`;
  const backupFilePath = path.join(backupsDir, backupFileName);

  try {
    // Perform non-blocking online database backup
    const sourceDb = new Database(dbPath, { readonly: true });
    await sourceDb.backup(backupFilePath);
    sourceDb.close();

    // Auto-rotation protection: keep only latest 5 backups to avoid disk saturation
    const files = fs.readdirSync(backupsDir)
      .filter(f => f.startsWith("dev-backup-") && f.endsWith(".db"))
      .map(f => {
        const filePath = path.join(backupsDir, f);
        const stats = fs.statSync(filePath);
        return { name: f, path: filePath, time: stats.mtimeMs };
      })
      .sort((a, b) => b.time - a.time);

    const maxBackups = 5;
    let deletedCount = 0;
    if (files.length > maxBackups) {
      const filesToDelete = files.slice(maxBackups);
      for (const file of filesToDelete) {
        try {
          fs.unlinkSync(file.path);
          deletedCount++;
        } catch (delErr) {
          console.error(`Failed to prune old backup ${file.name}:`, delErr);
        }
      }
    }

    const backupStats = fs.statSync(backupFilePath);

    return NextResponse.json({
      success: true,
      message: `Database backup created successfully. Pruned ${deletedCount} obsolete backup files.`,
      backup: {
        name: backupFileName,
        size: backupStats.size,
        createdAt: backupStats.mtime.toISOString(),
      }
    });
  } catch (error: any) {
    console.error("[POST /api/admin/backup] error:", error);
    if (fs.existsSync(backupFilePath)) {
      try { fs.unlinkSync(backupFilePath); } catch {}
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to compile transactional SQLite backup." },
      { status: 500 }
    );
  }
}
