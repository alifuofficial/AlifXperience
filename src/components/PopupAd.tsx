"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { X, ExternalLink } from "lucide-react";

interface PopupAdProps {
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

export default function PopupAd({ className = "" }: PopupAdProps) {
  const [ad, setAd] = useState<AdModel | null>(null);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/ads/public?slot=popup-overlay`)
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
    if (ad) {
      const seen = sessionStorage.getItem("popup-ad-seen");
      if (!seen) {
        const timer = setTimeout(() => setShow(true), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [ad]);

  const handleClose = () => {
    setShow(false);
    sessionStorage.setItem("popup-ad-seen", "true");
  };

  if (loading || !ad) return null;

  const isHtml = !!ad.htmlCode;

  return (
    <>
      {show && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-brand-950/80 backdrop-blur-sm" 
            onClick={handleClose}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 w-8 h-8 bg-brand-100 hover:bg-brand-200 rounded-full flex items-center justify-center text-brand-500 hover:text-brand-900 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {isHtml ? (
              <div 
                className="w-full"
                dangerouslySetInnerHTML={{ __html: ad.htmlCode || "" }}
              />
            ) : ad.imageUrl ? (
              <Link 
                href={`/api/ads/${ad.id}/click`}
                target="_blank"
                rel="noopener noreferrer"
                className="block relative"
              >
                <img 
                  src={ad.imageUrl} 
                  alt={ad.title} 
                  className="w-full h-auto"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-white text-xs font-bold">{ad.title}</p>
                  <p className="text-white/70 text-[10px]">Sponsored by {ad.companyName}</p>
                </div>
              </Link>
            ) : (
              <div className="p-8 text-center">
                <h3 className="text-lg font-black text-brand-900 mb-2">{ad.title}</h3>
                <p className="text-sm text-brand-600 mb-4">{ad.companyName}</p>
                {ad.linkUrl && (
                  <Link
                    href={ad.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-900 text-white text-sm font-bold rounded-lg hover:bg-accent-600 transition-colors"
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
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
}