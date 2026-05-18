import { PrismaClient } from "../src/generated/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// In Prisma 7, the adapter might prefer a config object
const adapter = new PrismaBetterSqlite3({ url: "dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      password: "password123",
      role: "ADMIN",
    },
  });
  console.log("Verified admin user:", user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
