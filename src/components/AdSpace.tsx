"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Megaphone, ExternalLink, Sparkles, TrendingUp, Activity, Layers, Phone, Mail } from "lucide-react";

interface AdSpaceProps {
  slot: "homepage-banner" | "article-top" | "sidebar-rect" | "article-bottom" | "popup-overlay" | "category-banner" | "search-results-banner" | "footer-banner" | "interstitial" | "newsletter-banner" | "in-content-1" | "in-content-2" | "in-content-3";
  className?: string;
}

interface AdModel {
  id: string;
  title: string;
  companyName: string;
  slot: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
  htmlCode?: string | null;
  status: string;
}

export default function AdSpace({ slot, className = "" }: AdSpaceProps) {
  const [ads, setAds] = useState<AdModel[]>([]);
  const [selectedAd, setSelectedAd] = useState<AdModel | null>(null);
  const [fallbackSettings, setFallbackSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadSlotData() {
      try {
        let adsData: AdModel[] = [];
        try {
          const adsRes = await fetch(`/api/ads/public?slot=${slot}`);
          if (adsRes.ok) {
            const parsed = await adsRes.json();
            if (Array.isArray(parsed)) {
              adsData = parsed;
            }
          }
        } catch (err) {
          console.error(`[AdSpace] Failed to load ads for slot ${slot}:`, err);
        }

        let settingsData: Record<string, string> = {};
        try {
          const settingsRes = await fetch("/api/settings/public");
          if (settingsRes.ok) {
            const parsed = await settingsRes.json();
            if (parsed && typeof parsed === "object") {
              settingsData = parsed;
            }
          }
        } catch (err) {
          console.error("[AdSpace] Failed to load public settings:", err);
        }

        if (!active) return;

        setAds(adsData);
        setFallbackSettings(settingsData);

        if (adsData.length > 0) {
          const randomIndex = Math.floor(Math.random() * adsData.length);
          setSelectedAd(adsData[randomIndex]);
        } else {
          setSelectedAd(null);
        }
      } catch (err) {
        console.error("[AdSpace] Unexpected error in loadSlotData:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSlotData();

    return () => {
      active = false;
    };
  }, [slot]);

  // 2. Trigger asynchronous impression counter when an ad is displayed
  useEffect(() => {
    if (selectedAd) {
      fetch(`/api/ads/${selectedAd.id}/impression`, {
        method: "POST",
      }).catch((err) => console.error("Failed to log impression metric:", err));
    }
  }, [selectedAd]);

  if (loading) {
    return (
      <div className={`w-full h-24 bg-brand-50 border border-brand-100 rounded-2xl flex items-center justify-center animate-pulse ${className}`}>
        <span className="text-[9px] font-bold uppercase tracking-widest text-brand-300">Loading sponsor...</span>
      </div>
    );
  }

  // Check if slot is disabled in site-wide settings
  const disabledSlots = fallbackSettings.disabledAdSlots
    ? fallbackSettings.disabledAdSlots.split(",").map((s: string) => s.trim())
    : [];
  
  if (disabledSlots.includes(slot)) {
    return null;
  }

  // ── A. IF ACTIVE SPONSOR AD IS LOADED ──
  if (selectedAd) {
    const isHtml = !!selectedAd.htmlCode;

    if (isHtml) {
      return (
        <div 
          className={`w-full overflow-hidden flex items-center justify-center ${className}`}
          dangerouslySetInnerHTML={{ __html: selectedAd.htmlCode || "" }}
        />
      );
    }

    if (selectedAd.imageUrl) {
      // Determine slot styling aspects dynamically
      let aspectClass = "aspect-[8/1]";
      if (slot === "sidebar-rect") {
        aspectClass = "aspect-square max-w-[300px] mx-auto";
      } else if (slot === "article-top" || slot === "article-bottom") {
        aspectClass = "aspect-[6/1] sm:aspect-[7/1]";
      }

      const isPhone = !!selectedAd.linkUrl?.startsWith("tel:");
      const isEmail = !!selectedAd.linkUrl?.startsWith("mailto:");

      const handleContactClick = () => {
        try {
          fetch(`/api/ads/${selectedAd.id}/click`, { 
            method: "GET", 
            keepalive: true 
          }).catch(() => {});
        } catch (e) {}
      };

      return (
        <div className={`w-full overflow-hidden rounded-2xl border border-brand-100 shadow-sm relative group ${className}`}>
          {isPhone || isEmail ? (
            <a 
              href={selectedAd.linkUrl || "#"} 
              onClick={handleContactClick}
              className={`block relative ${aspectClass} w-full`}
            >
              <img 
                src={selectedAd.imageUrl} 
                alt={selectedAd.title} 
                className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.01]" 
              />
              {/* Native sponsored tag */}
              <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[6px] font-extrabold uppercase tracking-widest">
                Sponsor: {selectedAd.companyName}
              </span>

              {/* Floating Contact CTA Button always visible in bottom-right */}
              <span className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-white group-hover:bg-slate-50 text-slate-950 px-2.5 py-1.5 rounded-lg text-[8.5px] font-black uppercase tracking-widest transition-all duration-300 shadow-md border border-slate-100 group-hover:scale-105 pointer-events-none">
                {isPhone ? (
                  <>
                    <Phone className="w-3 h-3 text-accent-600 animate-pulse" />
                    <span>Call Now</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-3 h-3 text-accent-600 animate-pulse" />
                    <span>Email Us</span>
                  </>
                )}
              </span>
            </a>
          ) : (
            <Link 
              href={`/api/ads/${selectedAd.id}/click`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`block relative ${aspectClass} w-full`}
            >
              <img 
                src={selectedAd.imageUrl} 
                alt={selectedAd.title} 
                className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.01]" 
              />
              {/* Native sponsored tag */}
              <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[6px] font-extrabold uppercase tracking-widest">
                Sponsor: {selectedAd.companyName}
              </span>
            </Link>
          )}
        </div>
      );
    }
  }

  // ── B. FALLBACK SPONSOR BANNER (If open in settings) ──
  const isFallbackEnabled = fallbackSettings.bannerAdEnabled === "true";
  const isFallbackOpen = fallbackSettings.bannerAdIsOpen === "true";

  if (isFallbackEnabled && isFallbackOpen) {
    const slotDetails: Record<string, { label: string; dimensions: string }> = {
      "homepage-banner": { label: "HOMEPAGE LEADERBOARD", dimensions: "970 × 120 PX" },
      "article-top": { label: "ARTICLE LEADERBOARD", dimensions: "728 × 90 PX" },
      "article-bottom": { label: "ARTICLE FOOTER BANNER", dimensions: "728 × 90 PX" },
      "sidebar-rect": { label: "SIDEBAR RECTANGLE", dimensions: "300 × 250 PX" },
      "category-banner": { label: "CATEGORY LEADERBOARD", dimensions: "728 × 90 PX" },
      "search-results-banner": { label: "SEARCH LEADERBOARD", dimensions: "728 × 90 PX" },
      "footer-banner": { label: "FOOTER LEADERBOARD", dimensions: "970 × 90 PX" },
      "newsletter-banner": { label: "NEWSLETTER SPLIT", dimensions: "600 × 150 PX" },
      "in-content-1": { label: "IN-CONTENT SPOT 1", dimensions: "600 × 100 PX" },
      "in-content-2": { label: "IN-CONTENT SPOT 2", dimensions: "600 × 100 PX" },
      "in-content-3": { label: "IN-CONTENT SPOT 3", dimensions: "600 × 100 PX" },
    };

    const slotInfo = slotDetails[slot] || { label: "SPONSOR PLACEMENT", dimensions: "RESPONSIVE SLOT" };
    const isSidebar = slot === "sidebar-rect";
    const isInContent = slot.startsWith("in-content-");

    // 1. SIDEBAR PORTRAIT SQUARE REDESIGN
    if (isSidebar) {
      return (
        <div className={`w-full aspect-square max-w-[300px] mx-auto bg-slate-950/90 rounded-2xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)] relative overflow-hidden flex flex-col justify-between p-5 group hover:scale-[1.01] hover:border-accent-500/40 transition-all duration-500 ${className}`}>
          {/* Animated background highlights */}
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-accent-50/10 rounded-full blur-2xl group-hover:bg-accent-500/20 transition-all duration-700" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-violet-50/10 rounded-full blur-2xl group-hover:bg-violet-500/20 transition-all duration-700" />
          
          {/* Subtle tech background grid */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:10px_10px]" />
          
          {/* Shimmer line */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-accent-500/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

          {/* Header row */}
          <div className="flex items-center justify-between z-10">
            <span className="text-[7.5px] font-mono font-bold tracking-[0.25em] text-accent-300 bg-accent-500/15 px-2 py-0.5 rounded border border-accent-400/30 flex items-center gap-1.5 uppercase">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent-400"></span>
              </span>
              Sponsor Slot
            </span>
            <span className="text-[7.5px] font-mono font-bold text-slate-400 tracking-wider">
              {slotInfo.dimensions}
            </span>
          </div>

          {/* Main graphics & copy container */}
          <div className="space-y-2 my-auto z-10">
            <h4 className="text-sm font-black text-white leading-snug tracking-tight">
              <span className="bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">Feature your brand inside </span>
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">AlifXperience</span>
            </h4>
            <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
              Deliver your product directly to 150K+ weekly technology innovators and developers.
            </p>

            {/* Symmetrical Mini Tech Dashboard Visualizer */}
            <div className="pt-2 pb-1 border-t border-b border-white/5 flex items-center justify-between text-[8.5px] text-slate-300 font-mono">
              <div className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>CTR ESTIMATE: <strong className="text-white font-bold">2.4%</strong></span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-accent-400" />
                <span>AUDIENCE: <strong className="text-white font-bold">150K+</strong></span>
              </div>
            </div>
          </div>

          {/* Action button */}
          <Link
            href="/advertise"
            className="group flex items-center justify-center gap-2 bg-gradient-to-r from-accent-600 to-indigo-600 hover:from-accent-500 hover:to-indigo-500 text-white text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl transition-all duration-300 cursor-pointer z-10 shadow-[0_0_15px_rgba(37,99,235,0.2)] hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-1.5">
              <span>Book Placement</span>
              <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </span>
          </Link>
        </div>
      );
    }

    // 2. IN-CONTENT MINIMALIST INTEGRATED AD PLACEMENT
    if (isInContent) {
      return (
        <div className={`w-full bg-gradient-to-r from-brand-50 to-white/70 rounded-2xl border border-brand-200/50 shadow-sm relative overflow-hidden flex flex-col sm:flex-row items-center justify-between p-5 gap-4 group hover:shadow-md hover:border-brand-200 transition-all duration-300 border-l-[4px] border-l-accent-500 ${className}`}>
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-24 h-full bg-accent-500/5 blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-3 z-10">
            <div className="w-9 h-9 rounded-xl bg-accent-50 flex items-center justify-center text-accent-600 shrink-0 shadow-sm">
              <Megaphone className="w-4 h-4 text-accent-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-black uppercase tracking-wider text-accent-600 bg-accent-500/10 px-1.5 py-0.5 rounded">Sponsor slot</span>
                <span className="text-[7.5px] font-mono font-bold text-brand-400 uppercase tracking-widest">{slotInfo.dimensions}</span>
              </div>
              <h4 className="text-xs font-black text-brand-900 mt-1">
                Looking to expand your technology outreach?
              </h4>
              <p className="text-[10px] text-brand-500 font-medium">
                Book this contextual paragraph slot and showcase your catalog to 150K+ developers.
              </p>
            </div>
          </div>

          <Link
            href="/advertise"
            className="group flex items-center gap-2 bg-brand-900 hover:bg-accent-600 text-white text-[9px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all duration-300 cursor-pointer shrink-0 z-10 shadow-sm relative overflow-hidden"
          >
            <span className="relative z-10">Book Slot</span>
            <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      );
    }

    // 3. WIDE HORIZONTAL BANNER REDESIGN (HOMEPAGE BANNER, ARTICLE HEADERS, FOOTER BANNERS)
    return (
      <div className={`w-full bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 rounded-2xl border border-white/5 shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between p-6 md:px-8 md:py-6 gap-6 group hover:border-white/10 transition-all duration-500 ${className}`}>
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:16px_16px]" />

        {/* Ambient dynamic lights */}
        <div className="absolute -top-24 -left-24 w-44 h-44 bg-accent-600/10 rounded-full blur-[80px] group-hover:bg-accent-600/20 transition-all duration-1000" />
        <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-violet-600/10 rounded-full blur-[80px] group-hover:bg-violet-600/20 transition-all duration-1000" />

        {/* Shimmer line indicator */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-accent-500/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

        {/* Left Side: Badge, Header & Stat Bar */}
        <div className="space-y-3 z-10 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent-500/15 text-accent-300 rounded-full text-[9px] font-extrabold uppercase tracking-wider border border-accent-400/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-400"></span>
              </span>
              Open for Sponsorship Placements
            </span>
            <span className="px-2 py-1 bg-white/10 text-slate-200 border border-white/5 rounded text-[9px] font-mono font-semibold uppercase tracking-wider">
              {slotInfo.label}
            </span>
          </div>

          <h4 className="text-base md:text-lg font-black text-white tracking-tight leading-snug">
            <span className="bg-gradient-to-r from-white via-slate-100 to-slate-200 bg-clip-text text-transparent">Host your brand on </span>
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">AlifXperience's Premium Network</span>
          </h4>

          {/* Audience and professional validation details */}
          <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-300 font-medium">
            <div className="flex -space-x-1 shrink-0">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-pink-500 border border-slate-900" />
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 border border-slate-900" />
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 border border-slate-900" />
            </div>
            <span>Trusted by <strong className="text-white font-bold">150K+ Monthly Tech Leaders</strong></span>
            <span className="hidden sm:inline text-slate-700">|</span>
            <span className="flex items-center gap-1 shrink-0 font-mono text-[9px]">
              <Sparkles className="w-3.5 h-3.5 text-accent-400 animate-pulse" /> Avg. CTR: ~2.4%
            </span>
          </div>
        </div>

        {/* Right Side: Dimensions & CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-4 z-10 shrink-0 w-full md:w-auto">
          {/* Coding aspect tag */}
          <div className="hidden lg:flex flex-col text-right font-mono text-[9px] text-slate-500 leading-tight">
            <span>PLACEMENT DIMENSIONS</span>
            <span className="text-white font-black mt-0.5">{slotInfo.dimensions}</span>
          </div>
          
          <Link
            href="/advertise"
            className="group flex items-center justify-center gap-2 bg-white hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 text-slate-950 text-[10.5px] font-black uppercase tracking-widest px-6 py-3 rounded-xl transition-all duration-300 cursor-pointer w-full sm:w-auto shadow-md hover:shadow-xl hover:shadow-accent-500/20 relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-1.5">
              <span>Book Ad Slot</span>
              <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </span>
            {/* Shimmer transition overlay inside the button */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent-500/0 via-accent-500/10 to-accent-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
