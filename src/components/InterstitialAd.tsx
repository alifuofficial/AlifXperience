"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { X, ExternalLink } from "lucide-react";

interface InterstitialAdProps {
  triggerOn?: "exit" | "scroll-past" | "time";
  scrollThreshold?: number;
  timeDelay?: number;
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

export default function InterstitialAd({ 
  triggerOn = "time", 
  scrollThreshold = 50, 
  timeDelay = 30000,
  className = "" 
}: InterstitialAdProps) {
  const [ad, setAd] = useState<AdModel | null>(null);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/ads/public?slot=interstitial`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          setAd(data[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!ad) return;

    const checkShowAd = () => {
      const seen = sessionStorage.getItem("interstitial-ad-shown");
      if (seen) return;

      let shouldShow = false;

      if (triggerOn === "time") {
        const timer = setTimeout(() => {
          setShow(true);
          sessionStorage.setItem("interstitial-ad-shown", "true");
        }, timeDelay);
        return () => clearTimeout(timer);
      }

      if (triggerOn === "scroll-past") {
        const handleScroll = () => {
          const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
          if (scrollPercent >= scrollThreshold && !shouldShow) {
            shouldShow = true;
            setShow(true);
            sessionStorage.setItem("interstitial-ad-shown", "true");
            window.removeEventListener("scroll", handleScroll);
          }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
      }
    };

    checkShowAd();
  }, [ad, triggerOn, scrollThreshold, timeDelay]);

  const handleClose = () => {
    setShow(false);
    sessionStorage.setItem("interstitial-ad-shown", "true");
  };

  const handleLinkClick = () => {
    sessionStorage.setItem("interstitial-ad-shown", "true");
  };

  if (loading || !ad) return null;

  const isHtml = !!ad.htmlCode;

  return (
    <>
      {show && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-brand-950/95 backdrop-blur-sm"
            onClick={handleClose}
          />

          <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden animate-scale-in">
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 w-8 h-8 bg-brand-100 hover:bg-brand-200 rounded-full flex items-center justify-center text-brand-500 hover:text-brand-900 transition-colors z-10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {isHtml ? (
              <div 
                className="w-full flex items-center justify-center min-h-[400px] p-4"
                dangerouslySetInnerHTML={{ __html: ad.htmlCode || "" }}
              />
            ) : ad.imageUrl ? (
              <div className="relative">
                <Link 
                  href={ad.linkUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleLinkClick}
                  className="block"
                >
                  <img 
                    src={ad.imageUrl} 
                    alt={ad.title} 
                    className="w-full h-auto max-h-[500px] object-contain"
                  />
                </Link>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-black text-white">{ad.title}</h3>
                      <p className="text-xs text-white/70">Sponsored by {ad.companyName}</p>
                    </div>
                    <Link
                      href={ad.linkUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleLinkClick}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-brand-900 text-xs font-bold rounded-lg hover:bg-brand-50 transition-colors"
                    >
                      Visit <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <h3 className="text-xl font-black text-brand-900 mb-2">{ad.title}</h3>
                <p className="text-sm text-brand-600 mb-4">Sponsored by {ad.companyName}</p>
                {ad.linkUrl && (
                  <Link
                    href={ad.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleLinkClick}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-brand-900 text-white text-sm font-bold rounded-lg hover:bg-accent-600 transition-colors"
                  >
                    Learn More <ExternalLink className="w-4 h-4" />
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      <style jsx global>{`
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
}