"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative h-[85vh] min-h-[600px] overflow-hidden">
      <div className="absolute inset-0">
        <Image 
          src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80" 
          alt="Hero" 
          fill
          priority
          className="w-full h-full object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-slate-900/80" />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end pb-16 lg:pb-24">
        <div className="max-w-3xl">
          <div className="opacity-0 animate-[fadeInUp_0.8s_ease_forwards]">
            <span className="inline-block px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 text-[0.7rem] font-bold uppercase tracking-wider rounded-sm">
              ⚡ Featured
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white mt-4 leading-[1.1] opacity-0 animate-[fadeInUp_0.8s_ease_0.1s_forwards]">
            The Age of Autonomous Cities: How AI Is Rewriting Urban Planning
          </h1>
          
          <p className="mt-6 text-lg sm:text-xl text-gray-300 leading-relaxed max-w-2xl opacity-0 animate-[fadeInUp_0.8s_ease_0.2s_forwards]">
            From self-optimizing traffic grids to predictive infrastructure maintenance, artificial intelligence is transforming how we design, build, and live in cities. We explore the pioneers behind this revolution.
          </p>
          
          <div className="mt-8 flex flex-wrap items-center gap-4 opacity-0 animate-[fadeInUp_0.8s_ease_0.3s_forwards]">
            <Link href="#" className="bg-indigo-550 hover:bg-indigo-600 text-white font-semibold px-8 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-indigo-550/25 inline-flex items-center gap-2 relative overflow-hidden group">
              <span className="relative z-10">Read Full Story</span>
              <ArrowRight className="w-4 h-4 relative z-10" />
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
            </Link>
            
            <span className="inline-flex items-center gap-1 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              12 min read
            </span>
          </div>
          
          <div className="mt-6 flex items-center gap-4 opacity-0 animate-[fadeInUp_0.8s_ease_0.4s_forwards]">
            <Image 
              src="https://api.dicebear.com/7.x/initials/svg?seed=SK&backgroundColor=5c7cfa&textColor=ffffff" 
              alt="Author" 
              width={40}
              height={40}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="text-sm font-semibold text-white">Sarah Kim</p>
              <p className="text-xs text-gray-500">May 5, 2026</p>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}