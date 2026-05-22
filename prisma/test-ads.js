const { PrismaClient } = require("../src/generated/client/index.js");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const path = require("path");

const dbUrl = "file:./dev.db";
const rawPath = dbUrl.startsWith("file:") ? dbUrl.substring(5) : dbUrl;
const dbPath = path.isAbsolute(rawPath) ? rawPath : path.join(process.cwd(), rawPath);

const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function test() {
  console.log("Starting Ad tables query tests...");
  try {
    const totalAds = await prisma.ad.count();
    console.log("Ad table query: OK =", totalAds);

    const totalRequests = await prisma.adRequest.count();
    console.log("AdRequest table query: OK =", totalRequests);

    const totalPackages = await prisma.adPackage.count();
    console.log("AdPackage table query: OK =", totalPackages);

    const totalRevenue = await prisma.adRevenue.count();
    console.log("AdRevenue table query: OK =", totalRevenue);

    console.log("ALL AD DATABASE TABLES QUERIED SUCCESSFULLY!");
  } catch (err) {
    console.error("AD DATABASE QUERY FAILED:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
