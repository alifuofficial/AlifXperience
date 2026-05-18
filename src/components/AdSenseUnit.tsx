"use client";

import { useEffect, useState } from "react";
import { Cpu, Wifi } from "lucide-react";

interface AdSenseUnitProps {
  slot?: string;
  format?: "auto" | "fluid" | "rectangle" | "horizontal" | "vertical";
  responsive?: "true" | "false";
  style?: React.CSSProperties;
  className?: string;
}

export default function AdSenseUnit({
  slot,
  format = "auto",
  responsive = "true",
  style,
  className = "",
}: AdSenseUnitProps) {
  const [adsenseId, setAdsenseId] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Fetch public settings to retrieve adsense publisher ID
    fetch("/api/settings/public")
      .then((res) => res.json())
      .then((data) => {
        if (data.googleAdsenseId) {
          setAdsenseId(data.googleAdsenseId);
          // Push to google ads array safely
          try {
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          } catch (err) {
            console.warn("[AdSense] Script push error or blocked by ad-blocker:", err);
          }
        }
      })
      .catch(() => {
        setError(true);
      });
  }, [slot]);

  // If there's an error or no AdSense ID is configured yet, render a professional dashboard placeholder
  if (!adsenseId) {
    return (
      <div 
        className={`w-full min-h-[100px] bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between select-none shadow-sm group hover:border-amber-500/20 transition-colors duration-500 ${className}`}
        style={style}
      >
        {/* Futuristic dot-grid overlay */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:8px_8px]" />
        
        {/* Dynamic network lights */}
        <div className="absolute -top-10 -right-10 w-20 h-20 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-all duration-500" />
        
        {/* Top Status Header */}
        <div className="flex items-center justify-between text-[8px] font-mono text-slate-500 tracking-widest z-10">
          <span className="flex items-center gap-1.5 uppercase font-bold text-amber-500/80">
            <Cpu className="w-3.5 h-3.5 animate-pulse" />
            Programmatic Ad Slot
          </span>
          <span className="flex items-center gap-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
            </span>
            Awaiting ID
          </span>
        </div>

        {/* Center Main Panel */}
        <div className="my-auto py-2 z-10 flex flex-col items-center sm:items-start">
          <h4 className="text-[11.5px] font-black text-white tracking-wide uppercase font-mono flex items-center gap-1.5">
            Google AdSense Integration Active
          </h4>
          <p className="text-[9.5px] text-slate-400 font-medium mt-0.5 text-center sm:text-left leading-relaxed">
            Ready to deliver targeted, high-performance programmatic campaigns. Configured in your console.
          </p>
        </div>

        {/* Bottom Symmetrical Terminal Metadata Info Bar */}
        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[7.5px] text-slate-500 font-mono z-10">
          <span>NETWORK: ADSENSE_v16.2</span>
          <span className="flex items-center gap-1">
            <Wifi className="w-3 h-3 text-slate-500 animate-pulse" />
            STATUS: PENDING_PUBLISHER_ID
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full overflow-hidden flex flex-col items-center py-2 ${className}`}>
      <span className="text-[7px] font-black uppercase tracking-[0.25em] text-brand-300 mb-1 select-none">Advertisement</span>
      <div className="w-full flex justify-center">
        <ins
          className="adsbygoogle"
          style={style || { display: "block", width: "100%", minHeight: "90px" }}
          data-ad-client={adsenseId}
          data-ad-slot={slot || "default-slot"}
          data-ad-format={format}
          data-full-width-responsive={responsive}
        />
      </div>
    </div>
  );
}
