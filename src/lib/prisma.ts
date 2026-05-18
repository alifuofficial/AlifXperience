import { PrismaClient } from "../generated/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

import Database from "better-sqlite3";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  // Support custom database path via DATABASE_URL, defaulting to dev.db at project root
  const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
  const rawPath = dbUrl.startsWith("file:") ? dbUrl.substring(5) : dbUrl;
  const dbPath = path.isAbsolute(rawPath) ? rawPath : path.join(process.cwd(), rawPath);

  // Open the SQLite database directly to safely enable Write-Ahead Logging (WAL)
  // and synchronous = NORMAL optimizations once on startup.
  try {
    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("synchronous = NORMAL");
    db.close();
  } catch (err) {
    console.error("Failed to initialize SQLite WAL optimizations:", err);
  }

  const adapter = new PrismaBetterSqlite3({ url: dbPath, timeout: 5000 });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
};

// Clear development global cache once to load newly generated models (like Subscriber)
if (process.env.NODE_ENV !== "production") {
  const g = globalThis as any;
  if (g.prisma) {
    try { g.prisma.$disconnect(); } catch {}
    g.prisma = undefined;
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
