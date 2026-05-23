import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import DownloadClient from "./DownloadClient";
import { readFile } from "fs/promises";
import path from "path";

interface Props {
  searchParams: Promise<{ fileId?: string }>;
}

async function getFileData(id: string) {
  return prisma.media.findUnique({
    where: { id },
  });
}

async function getCountdownSetting() {
  try {
    const raw = await readFile(path.join(process.cwd(), "data", "settings.json"), "utf-8");
    const settings = JSON.parse(raw);
    return parseInt(settings.downloadCountdown) || 12;
  } catch {
    return 12;
  }
}

export default async function DownloadPage({ searchParams }: Props) {
  const { fileId } = await searchParams;

  if (!fileId) {
    return notFound();
  }

  const file = await getFileData(fileId);
  if (!file) {
    return notFound();
  }

  const countdown = await getCountdownSetting();

  return (
    <div className="min-h-screen bg-brand-50 flex flex-col">
      <Ticker />
      <Navbar />
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <DownloadClient 
          file={{ id: file.id, name: file.name, size: file.size, mimeType: file.mimeType }} 
          initialCountdown={countdown}
        />
      </main>
      <Footer />
    </div>
  );
}
