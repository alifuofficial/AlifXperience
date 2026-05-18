"use client";

import { useEffect, useState } from "react";

export default function Ticker() {
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/settings/public")
      .then((res) => res.json())
      .then((data) => {
        setEnabled(data.newsTickerEnabled !== "false");
      })
      .catch(() => {
        setEnabled(true);
      });
  }, []);

  if (enabled !== true) return null;

  const news = [
    "🔴 BREAKING: Apple announces M5 chip with 40% performance boost",
    "⚡ OpenAI releases GPT-6 with multimodal reasoning",
    "🚀 SpaceX Starship completes successful orbital refueling test",
    "🔬 Scientists achieve room-temperature superconductivity breakthrough",
    "⚙️ Linux 7.0 kernel released with major security updates",
    "🌐 EU Digital Markets Act enforcement begins today",
  ];

  return (
    <div className="bg-slate-900 text-white text-xs py-2 overflow-hidden relative">
      <div className="flex whitespace-nowrap animate-marquee">
        {[...news, ...news].map((item, i) => (
          <span key={i} className="mx-8 font-medium tracking-wide">{item}</span>
        ))}
      </div>
    </div>
  );
}