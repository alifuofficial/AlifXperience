"use client";

import React from "react";
import AdSpace from "./AdSpace";

interface InContentAdsProps {
  content: string;
  className?: string;
}

export default function InContentAds({ content, className = "" }: InContentAdsProps) {
  // Split content by paragraphs
  const paragraphs = content.split(/(?=<p>)/g);
  
  // Insert ads after specific paragraphs: after 1st, after 3rd, after 7th
  const adPositions = [1, 3, 7];
  const slots: ("in-content-1" | "in-content-2" | "in-content-3")[] = ["in-content-1", "in-content-2", "in-content-3"];
  
  const result: React.ReactNode[] = [];
  let adIndex = 0;
  
  paragraphs.forEach((paragraph, idx) => {
    result.push(
      <div key={`p-${idx}`} dangerouslySetInnerHTML={{ __html: paragraph }} />
    );
    
    // Check if we should insert an ad after this paragraph
    if (adPositions.includes(idx + 1) && adIndex < 3) {
      result.push(
        <div key={`ad-${idx}`} className="my-6">
          <AdSpace slot={slots[adIndex]} className="my-4" />
        </div>
      );
      adIndex++;
    }
  });
  
  return <div className={className}>{result}</div>;
}