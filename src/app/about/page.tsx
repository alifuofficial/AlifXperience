import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ArrowLeft, Phone, MapPin, Award, Sparkles, Code, TrendingUp, Cpu, Heart, CheckCircle, ExternalLink } from "lucide-react";
import { readFile } from "fs/promises";
import path from "path";

async function readPublicSettings() {
  try {
    const raw = await readFile(path.join(process.cwd(), "data", "settings.json"), "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await readPublicSettings();
  const siteName = settings.siteName || "AlifXperience";
  return {
    title: `About Founder | ${siteName}`,
    description: `Discover AlifXperience, the premium Afaan Oromoo technology & innovation platform founded by Alifu H, Digital Transformation & System Manager.`,
  };
}

export default async function AboutPage() {
  const settings = await readPublicSettings();
  const siteName = settings.siteName || "AlifXperience";
  const siteUrl = settings.siteUrl || "https://alifxperience.com";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-brand-500 selection:text-white">
      <div>
        <Ticker />
        <Navbar />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-10">
            <Link href="/" className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-accent-400 transition-colors">
              <ArrowLeft className="w-3 h-3" /> Home
            </Link>
            <span className="text-slate-700">/</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-accent-400">About Founder & Platform</span>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left Column: Creative Profile Card (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900 rounded-3xl border border-slate-800/80 p-6 shadow-2xl relative overflow-hidden group">
                {/* Tech Accent Lines */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent-500/10 rounded-full blur-3xl group-hover:bg-accent-500/20 transition-all duration-500" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-500/5 rounded-full blur-3xl" />
                
                {/* Decorative Tech Tag */}
                <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-accent-500/20 border border-accent-500/30 text-accent-300 rounded-full flex items-center gap-1.5 backdrop-blur-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
                  <span className="text-[7.5px] font-black uppercase tracking-wider">Founder & Tech Leader</span>
                </div>

                {/* Profile Photo Wrapper */}
                <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden border border-slate-800 relative bg-slate-950">
                  <img
                    src="/uploads/alifu-h.png"
                    alt="Alifu H - Founder of AlifXperience"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-all duration-700 select-none filter contrast-105 brightness-95"
                  />
                </div>

                {/* Founder Specs */}
                <div className="mt-6 space-y-4">
                  <div className="text-center">
                    <h2 className="text-xl font-black text-white tracking-tight uppercase">Alifu H.</h2>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-accent-400 mt-1">Digital Transformation & System Manager</p>
                  </div>

                  <div className="border-t border-slate-800/80 pt-4 space-y-2.5 text-xs text-slate-350 font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400">
                        <MapPin className="w-4 h-4 text-accent-400" />
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Location</span>
                        <span className="text-slate-200">Addis Ababa, Ethiopia</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400">
                        <Award className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 block">Expertise</span>
                        <span className="text-slate-200">Full-Stack Dev & Digital Marketing</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Call Out Specs */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-slate-800/60 p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center text-accent-400 shrink-0">
                  <Cpu className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Digital Vision</h4>
                  <p className="text-xs text-slate-300 font-medium mt-1 leading-relaxed">
                    Driving innovation and digital inclusion across East Africa through localized technical education.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Creative Contents & Contact (7 Cols) */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Header Info */}
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-500/10 border border-brand-500/20 text-brand-400 rounded-full">
                  <Sparkles className="w-3.5 h-3.5 text-brand-400 animate-spin" />
                  <span className="text-[8.5px] font-black uppercase tracking-wider">Afaan Oromoo Tech Hub</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-none">
                  Empowering Community Through <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-brand-400">Technology & Innovation</span>
                </h1>
                <p className="text-base text-slate-300 font-medium leading-relaxed pt-2">
                  <strong>{siteName}</strong> is a dynamic, next-generation platform based in <strong>Addis Ababa, Ethiopia</strong>, dedicated to delivering highly insightful technology, science, and innovation content written entirely in <strong>Afaan Oromoo</strong>.
                </p>
              </div>

              {/* Founder Detailed Journey */}
              <div className="bg-slate-900/60 rounded-3xl border border-slate-800/80 p-8 space-y-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500" /> Waa&apos;ee Hundessaa (About The Founder)
                </h3>
                
                <div className="space-y-4 text-slate-300 text-sm leading-relaxed font-medium">
                  <p>
                    <strong>AlifXperience</strong> was founded by <strong>Alifu H.</strong>, a highly driven technology leader with extensive background across engineering systems and market analysis.
                  </p>
                  <p>
                    Alifu brings deep operational expertise in full-stack software development, systems integration, and advanced digital marketing. Currently, he serves as a <strong>Digital Transformation & System Manager</strong>, where he spearheads enterprise IT strategies, builds integrated platforms, and oversees cloud migrations.
                  </p>
                  <p>
                    Outside of enterprise systems management, Alifu is extremely focused on creative content creation, digital advocacy, and localized learning, helping the next generation of African tech students and builders unlock their potential.
                  </p>
                </div>

                {/* Portfolio Pillars */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl space-y-2">
                    <Code className="w-5 h-5 text-accent-400" />
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-200">Software Engineering</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Architecting custom web applications, APIs, and business automation software tailored to performance needs.</p>
                  </div>
                  <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl space-y-2">
                    <TrendingUp className="w-5 h-5 text-brand-400" />
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-200">Digital Marketing</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">Designing high-converting acquisition systems, SEO structures, and multi-channel campaign architectures.</p>
                  </div>
                </div>
              </div>

              {/* Direct Call to Action Campaign Card */}
              <div className="bg-gradient-to-r from-accent-600/30 to-brand-600/20 border border-accent-500/30 rounded-3xl p-8 relative overflow-hidden space-y-6">
                <div className="absolute top-0 right-0 w-48 h-48 bg-accent-400/10 rounded-full blur-3xl" />
                
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-white tracking-tight uppercase">🚀 Start Your Project Today!</h3>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    Do you have a professional website or app to develop? Or do you need an aggressive, high-ROI digital marketing campaign to scale your business? Partner directly with Alifu to turn your ideas into a high-performance system.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2 shrink-0">
                  <a
                    href="tel:0964121760"
                    className="flex-1 flex items-center justify-center gap-2.5 px-6 py-4 bg-white text-slate-950 hover:bg-accent-400 hover:text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 shadow-xl cursor-pointer"
                  >
                    <Phone className="w-4 h-4 animate-bounce" />
                    <span>Call Directly: 0964121760</span>
                  </a>
                  
                  <a
                    href="https://wa.me/251964121760"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-slate-950 border border-slate-800 text-white hover:bg-slate-900 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-300 cursor-pointer"
                  >
                    <span>Message on WhatsApp</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                  </a>
                </div>
              </div>

            </div>

          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
