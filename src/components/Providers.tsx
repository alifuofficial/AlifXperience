"use client";

import { SessionProvider } from "next-auth/react";
import dynamic from "next/dynamic";

const AdPopup = dynamic(() => import("@/components/AdPopup"), { ssr: false });
const InterstitialAd = dynamic(() => import("@/components/InterstitialAd"), { ssr: false });
const GoogleOneTap = dynamic(() => import("@/components/GoogleOneTap"), { ssr: false });

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <GoogleOneTap />
      {children}
      <AdPopup />
      <InterstitialAd triggerOn="scroll-past" scrollThreshold={60} />
    </SessionProvider>
  );
}
