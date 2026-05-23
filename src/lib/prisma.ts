import { PrismaClient } from "../generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  const dbUrl = process.env.DATABASE_URL || "";
  const pool = new Pool({ connectionString: dbUrl });
  const adapter = new PrismaPg(pool);

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
