import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import GoogleScripts from "@/components/GoogleScripts";
import { readFile } from "fs/promises";
import path from "path";

async function readPublicSettings() {
  try {
    const raw = await readFile(path.join(process.cwd(), "data", "settings.json"), "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await readPublicSettings();
  const title = settings.siteName 
    ? `${settings.siteName} | ${settings.siteTagline || "The Future of Tech"}` 
    : "AlifXperience | The Future of Tech";
  const description = settings.siteDescription || "A modern technology magazine exploring the cutting edge of AI, software, and hardware.";
  const favicon = settings.faviconUrl || "/favicon.ico";

  const siteUrl = settings.siteUrl ? settings.siteUrl.replace(/\/$/, "") : "https://alifxperience.com";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s | ${settings.siteName || "AlifXperience"}`,
    },
    description,
    alternates: {
      canonical: siteUrl,
    },
    icons: {
      icon: favicon,
      shortcut: favicon,
      apple: favicon,
    },
    openGraph: {
      title: settings.siteName || "AlifXperience",
      description: settings.siteTagline || "The Future of Tech",
      url: siteUrl,
      siteName: settings.siteName || "AlifXperience",
      locale: "en_US",
      type: "website",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

import AdPopup from "@/components/AdPopup";
import InterstitialAd from "@/components/InterstitialAd";
import GoogleOneTap from "@/components/GoogleOneTap";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <GoogleScripts />
      <body className="font-sans antialiased">
        <Providers>
          <GoogleOneTap />
          <div className="flex flex-col min-h-screen">
            {children}
          </div>
          <AdPopup />
          <InterstitialAd triggerOn="scroll-past" scrollThreshold={60} />
        </Providers>
      </body>
    </html>
  );
}
