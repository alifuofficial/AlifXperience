"use client";

import React, { useState, useEffect } from "react";
import { Download, FileText, Clock, Sparkles, AlertCircle, ArrowLeft } from "lucide-react";
import AdSpace from "@/components/AdSpace";
import Link from "next/link";

interface FileData {
  id: string;
  name: string;
  size: number;
  mimeType: string;
}

export default function DownloadClient({ file, initialCountdown = 12 }: { file: FileData; initialCountdown?: number }) {
  const [seconds, setSeconds] = useState(initialCountdown);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (seconds <= 0) {
      setReady(true);
      return;
    }
    const timer = setTimeout(() => {
      setSeconds(seconds - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const sizeMb = (file.size / (1024 * 1024)).toFixed(2) + " MB";

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-brand-400 hover:text-accent-600 transition-colors">
          <ArrowLeft className="w-3 h-3" /> Back to Magazine
        </Link>
      </div>

      {/* Monetized Top Leaderboard Ad */}
      <div className="w-full">
        <AdSpace slot="article-top" className="shadow-sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Main Content Card (Download & Countdown) */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-brand-100/60 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent-50 border border-accent-100 rounded-full text-[9px] font-bold uppercase tracking-widest text-accent-600">
              <Sparkles className="w-3.5 h-3.5" />
              Secure Attachment Node
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-brand-900 tracking-tight leading-tight">
              Your File is Ready for Download
            </h1>
            <p className="text-xs text-brand-400 font-medium">
              Verify your file details and fetch your attachment securely.
            </p>
          </div>

          {/* File Information Box */}
          <div className="p-5 bg-brand-50 rounded-2xl border border-brand-100/40 flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl border border-brand-100 flex-shrink-0 text-accent-600 shadow-sm">
              <FileText className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-brand-900 truncate" title={file.name}>
                {file.name}
              </p>
              <p className="text-[10px] text-brand-400 font-semibold uppercase tracking-wider mt-1">
                {sizeMb} · {file.mimeType || "Binary Attachment"}
              </p>
            </div>
          </div>

          {/* Download Generator State */}
          <div className="py-4 border-t border-brand-50 flex flex-col items-center justify-center text-center space-y-4">
            {!ready ? (
              <>
                <div className="relative w-20 h-20 flex items-center justify-center">
                  {/* Outer spinning circular ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-accent-100 animate-pulse" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-accent-600 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                  <div className="text-lg font-black text-brand-900 font-mono">
                    {seconds}s
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-brand-800 flex items-center justify-center gap-1.5 uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5 text-accent-600" />
                    Generating Secure Download Link
                  </p>
                  <p className="text-[10px] text-brand-400 font-medium max-w-sm">
                    Please wait while our secure server verifies the payload integrity and establishes a client connection.
                  </p>
                </div>
              </>
            ) : (
              <div className="w-full space-y-3 animate-fade-in">
                <a
                  href={`/api/download/file?id=${file.id}`}
                  className="flex items-center justify-center gap-2.5 w-full bg-accent-600 hover:bg-accent-500 text-white text-xs font-extrabold uppercase tracking-widest py-4 px-6 rounded-2xl transition-all shadow-lg shadow-accent-600/20 active:scale-[0.99] cursor-pointer"
                >
                  <Download className="w-4 h-4 animate-bounce" />
                  Download attachment
                </a>
                <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                  Attachment signature verified. Download is ready.
                </p>
              </div>
            )}
          </div>

          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-4.5 h-4.5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Security Notice</p>
              <p className="text-[9px] text-amber-700 font-medium mt-0.5 leading-relaxed">
                Ensure that you trust the contents of this file. Do not run executable attachments without standard desktop sandbox checking. AlifXperience holds no liability for payload execution.
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Monetized Ad Slot (Square Sidebar Sponsor) */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-brand-100/60 p-4 shadow-sm">
            <p className="text-[8px] font-bold text-brand-300 uppercase tracking-[0.2em] mb-3 text-center">Sponsored Message</p>
            <AdSpace slot="sidebar-rect" className="w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
