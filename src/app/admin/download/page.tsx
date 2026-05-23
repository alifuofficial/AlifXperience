import { prisma } from "@/lib/prisma";
import DownloadManagerClient from "./DownloadManagerClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function getMediaItems() {
  return prisma.media.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export default async function AdminDownloadPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    redirect("/");
  }

  const mediaItems = await getMediaItems();

  return <DownloadManagerClient initialMedia={mediaItems} />;
}
