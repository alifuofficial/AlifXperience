"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, ExternalLink, Check } from "lucide-react";

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

export default function NewsletterBanner({ className = "" }: { className?: string }) {
  const [ad, setAd] = useState<AdModel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/ads/public?slot=newsletter-banner`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          setAd(data[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !ad) return null;

  const isHtml = !!ad.htmlCode;

  return (
    <div className={`bg-gradient-to-r from-brand-900 to-indigo-950 rounded-2xl border border-white/10 overflow-hidden relative ${className}`}>
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]" />
      
      <div className="relative p-6 flex flex-col md:flex-row items-center gap-6">
        {isHtml ? (
          <div className="flex-1" dangerouslySetInnerHTML={{ __html: ad.htmlCode || "" }} />
        ) : ad.imageUrl ? (
          <div className="w-full md:w-48 flex-shrink-0">
            <Link 
              href={ad.linkUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl overflow-hidden hover:opacity-90 transition-opacity"
            >
              <div className="relative w-full aspect-[3/2]">
                <Image src={ad.imageUrl} alt={ad.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 192px" />
              </div>
            </Link>
          </div>
        ) : null}

        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-2 py-1 bg-accent-600/20 text-accent-400 rounded text-[8px] font-black uppercase tracking-wider mb-2">
            <Mail className="w-3 h-3" />
            <span>Newsletter Sponsor</span>
          </div>
          <h3 className="text-lg font-black text-white mb-1">{ad.title}</h3>
          <p className="text-sm text-brand-300 mb-3">Sponsored by {ad.companyName}</p>
          {ad.linkUrl && (
            <Link
              href={ad.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-brand-900 text-xs font-bold rounded-lg hover:bg-brand-50 transition-colors"
            >
              Learn More <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}