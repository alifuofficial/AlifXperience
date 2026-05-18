"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Sparkles, Mail, ArrowRight, Loader2, Check, AlertCircle, 
  MapPin, Brain, Star, Code, Network, Users
} from "lucide-react";

export default function CareersPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(true);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setMsg("Please enter a valid email address.");
      setIsSuccess(false);
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Subscription failed");
      }

      setMsg(data.message || "Subscribed successfully! We will notify you when job opportunities open.");
      setIsSuccess(true);
      setEmail("");
    } catch (error: any) {
      setMsg(error.message || "An error occurred.");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-50/50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-16">
        
        {/* Page Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-50 text-accent-700 rounded-full border border-accent-100 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[8.5px] font-black uppercase tracking-widest">Join the Future</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-brand-900 tracking-tight uppercase">
            Careers at AlifXperience
          </h1>
          <p className="text-xs sm:text-sm text-brand-400 font-bold uppercase tracking-widest max-w-xl mx-auto leading-relaxed">
            Building the premier tech & innovation media platform in Addis Ababa, delivering cutting-edge insights in Afaan Oromoo.
          </p>
        </div>

        {/* Vision Columns / Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-brand-100 shadow-sm space-y-3 hover:border-accent-200 transition-all group">
            <div className="w-10 h-10 bg-accent-50 rounded-xl flex items-center justify-center text-accent-600 shadow-inner group-hover:bg-accent-600 group-hover:text-white transition-all">
              <Code className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-wider text-brand-850">Modern Engineering</h3>
            <p className="text-[11px] text-brand-400 leading-relaxed font-bold uppercase tracking-wide">
              We engineer beautiful web experiences, dynamic user tools, and scalable software systems.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-brand-100 shadow-sm space-y-3 hover:border-amber-200 transition-all group">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shadow-inner group-hover:bg-amber-600 group-hover:text-white transition-all">
              <Network className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-wider text-brand-850">Digital Innovation</h3>
            <p className="text-[11px] text-brand-400 leading-relaxed font-bold uppercase tracking-wide">
              Driving tech transformation and high-impact digital marketing strategies across Ethiopia.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-brand-100 shadow-sm space-y-3 hover:border-emerald-200 transition-all group">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-inner group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-wider text-brand-850">Empowering Context</h3>
            <p className="text-[11px] text-brand-400 leading-relaxed font-bold uppercase tracking-wide">
              Creating specialized scientific and technological resources curated specifically in Afaan Oromoo.
            </p>
          </div>
        </div>

        {/* Opportunities Announcement & Alerts Form (Main Box) */}
        <div className="bg-white rounded-3xl border border-brand-100 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
          
          {/* Left panel: We don't have open positions alerts (7 cols) */}
          <div className="p-8 sm:p-10 md:col-span-7 flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-100">
                <AlertCircle className="w-3.5 h-3.5 animate-spin" />
                <span className="text-[8px] font-black uppercase tracking-wider">Current Opportunities Status</span>
              </div>
              
              <div className="space-y-3">
                <h2 className="text-2xl font-black text-brand-900 uppercase tracking-tight leading-tight">
                  We don't have open opportunities currently
                </h2>
                <p className="text-[11px] text-brand-400 font-bold uppercase tracking-wider leading-relaxed">
                  Thank you for your interest in AlifXperience! Our engineering and creative content writing departments are currently fully staffed. 
                  However, we are scaling dynamically and look forward to expanding our team soon.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-[9px] font-black uppercase tracking-wider text-slate-450 pt-4 border-t border-brand-50">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-accent-500" />
                <span>Addis Ababa, Ethiopia</span>
              </div>
              <div className="hidden sm:block text-slate-300">•</div>
              <div className="flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-emerald-500" />
                <span>Remote & Hybrid Options</span>
              </div>
            </div>
          </div>

          {/* Right panel: dynamic alerts signup form (5 cols) */}
          <div className="bg-brand-900 text-white p-8 sm:p-10 md:col-span-5 flex flex-col justify-center space-y-6 relative overflow-hidden">
            
            {/* Visual Design Background Mesh */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent-600/20 to-brand-950 pointer-events-none" />
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-accent-500/20 rounded-full blur-2xl pointer-events-none animate-pulse" />

            <div className="relative space-y-4">
              <div className="space-y-1.5">
                <h3 className="text-xs font-black uppercase tracking-widest text-accent-400">Get Job Alerts</h3>
                <h4 className="text-lg font-black uppercase tracking-tight">Notify Me First</h4>
                <p className="text-[9.5px] text-brand-300 leading-relaxed font-bold uppercase tracking-wider">
                  Subscribe below with your email, and we will contact you immediately when new full-stack dev, engineering, or content writing opportunities open up!
                </p>
              </div>

              <form onSubmit={handleSubscribe} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500" />
                  <input
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-brand-550 focus:outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400/20 transition-all font-medium disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-accent-600 hover:bg-accent-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-accent-600/20 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>Subscribe for Alerts <ArrowRight className="w-3.5 h-3.5" /></>
                  )}
                </button>
              </form>

              {msg && (
                <div className={`p-3 rounded-xl border text-[9.5px] font-bold uppercase tracking-wider leading-relaxed flex items-start gap-2 ${
                  isSuccess 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                    : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                }`}>
                  {isSuccess ? <Check className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />}
                  <span>{msg}</span>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Footer Back navigation link shortcut */}
        <div className="text-center pt-5">
          <Link
            href="/"
            className="text-[9px] font-black uppercase tracking-widest text-brand-400 hover:text-accent-600 border border-brand-200 px-4 py-2 rounded-lg hover:bg-brand-50 transition-all"
          >
            ← Back to Homepage
          </Link>
        </div>

      </div>
    </div>
  );
}
