import { PrismaClient } from "../generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import Database from "better-sqlite3";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  const dbUrl = process.env.DATABASE_URL || "file:./dev.db";

  // If using a PostgreSQL/Supabase URL, instantiate directly using the pg driver adapter (Prisma 7 format)
  if (dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://")) {
    const pool = new Pool({ connectionString: dbUrl });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }

  // Fallback to SQLite setup for local offline dev
  const rawPath = dbUrl.startsWith("file:") ? dbUrl.substring(5) : dbUrl;
  const dbPath = path.isAbsolute(rawPath) ? rawPath : path.join(process.cwd(), rawPath);

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

// Clear development global cache once to load newly generated models
if (process.env.NODE_ENV !== "production") {
  const g = globalThis as any;
  if (g.prisma) {
    try { g.prisma.$disconnect(); } catch {}
    g.prisma = undefined;
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
