"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { X, Sparkles, Megaphone } from "lucide-react";

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

export default function AdPopup() {
  const [ad, setAd] = useState<AdModel | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Only execute on browser client
    if (typeof window === "undefined") return;

    // Check if user has already seen a popup ad in this active browser session
    const hasSeen = sessionStorage.getItem("hasSeenPopupAd");
    if (hasSeen === "true") return;

    // Fetch active popup overlay ads
    fetch("/api/ads/public?slot=popup-overlay")
      .then((res) => res.json())
      .then((data: AdModel[]) => {
        if (data && data.length > 0) {
          // Select randomly for rotation
          const randomIndex = Math.floor(Math.random() * data.length);
          const selected = data[randomIndex];
          setAd(selected);
          
          // Delay display slightly for premium UX onboarding
          const timer = setTimeout(() => {
            setIsOpen(true);
            sessionStorage.setItem("hasSeenPopupAd", "true");
          }, 3500);

          return () => clearTimeout(timer);
        }
      })
      .catch((err) => console.error("Failed to load popup overlay ad:", err));
  }, []);

  // Trigger impression analytics
  useEffect(() => {
    if (isOpen && ad) {
      fetch(`/api/ads/${ad.id}/impression`, {
        method: "POST",
      }).catch((err) => console.error("Failed to log popup impression:", err));
    }
  }, [isOpen, ad]);

  if (!isOpen || !ad) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop with heavy blur */}
      <div 
        className="absolute inset-0 bg-brand-950/70 backdrop-blur-md transition-opacity duration-500 animate-fade-in"
        onClick={() => setIsOpen(false)}
      />

      {/* Symmetrical Modal Card */}
      <div className="relative bg-white/95 border border-brand-100 rounded-3xl overflow-hidden shadow-2xl max-w-lg w-full z-10 animate-zoom-in backdrop-blur-xl flex flex-col">
        {/* Top bar header */}
        <div className="px-5 py-3 border-b border-brand-50 flex items-center justify-between bg-brand-50/50">
          <div className="flex items-center gap-1.5 text-accent-700">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Featured Sponsor Campaign</span>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="w-6 h-6 rounded-full hover:bg-brand-100 flex items-center justify-center text-brand-400 hover:text-brand-900 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 flex-1 flex flex-col justify-center">
          {ad.htmlCode ? (
            <div 
              className="w-full flex items-center justify-center min-h-[250px]"
              dangerouslySetInnerHTML={{ __html: ad.htmlCode }}
            />
          ) : ad.imageUrl ? (
            <div className="space-y-4">
              <Link 
                href={`/api/ads/${ad.id}/click`}
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="block aspect-[4/3] rounded-2xl overflow-hidden shadow-md border border-brand-100 relative group"
              >
                <img 
                  src={ad.imageUrl} 
                  alt={ad.title} 
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-all duration-500"
                />
                <span className="absolute bottom-3 right-3 px-2 py-1 rounded bg-black/60 text-white text-[7px] font-extrabold uppercase tracking-widest">
                  {ad.companyName}
                </span>
              </Link>

              <div className="text-center space-y-1">
                <h4 className="text-sm font-black text-brand-900 leading-snug">{ad.title}</h4>
                <p className="text-[10px] text-brand-400 font-medium">Click the banner graphic above to visit our sponsor's product library.</p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-brand-50 flex items-center justify-between bg-brand-50/30">
          <Link 
            href="/advertise" 
            onClick={() => setIsOpen(false)}
            className="text-[9px] font-bold uppercase tracking-widest text-brand-400 hover:text-accent-600 transition-colors flex items-center gap-1"
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Advertise with us</span>
          </Link>
          <button 
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 bg-brand-900 hover:bg-brand-800 text-white text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all cursor-pointer shadow-md"
          >
            Close Sponsor Banner
          </button>
        </div>
      </div>
    </div>
  );
}
