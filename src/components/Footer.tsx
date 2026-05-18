"use client";

import Link from "next/link";
import { Zap, Mail, ArrowRight, Loader2, Check } from "lucide-react";
import { useState, useEffect } from "react";
import AdSpace from "./AdSpace";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" /><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L2.252 2.25H8.08l4.264 5.633L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

interface MenuItem {
  id: string;
  name: string;
  href: string;
}

const socials = [
  { icon: TwitterIcon, label: "Twitter", href: "#" },
  { icon: GithubIcon, label: "GitHub", href: "#" },
  { icon: LinkedinIcon, label: "LinkedIn", href: "#" },
  { icon: YoutubeIcon, label: "YouTube", href: "#" },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(true);

  // Dynamic Footer Topics loaded from the API
  const [topics, setTopics] = useState<MenuItem[]>([
    { id: "f1", name: "AI & Machine Learning", href: "/category/ai" },
    { id: "f2", name: "Hardware", href: "/category/hardware" },
    { id: "f3", name: "Cybersecurity", href: "/category/security" },
    { id: "f4", name: "Space Tech", href: "/category/space" },
    { id: "f5", name: "Software", href: "/category/software" },
    { id: "f6", name: "Reviews", href: "/category/software" }
  ]);

  useEffect(() => {
    fetch("/api/menus?location=footer")
      .then((res) => {
        if (res.ok) return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setTopics(data);
        }
      })
      .catch((err) => console.error("Footer topics load failure:", err));
  }, []);

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

      setMsg(data.message || "Subscribed successfully!");
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
    <footer className="bg-brand-900 text-white mt-24">
      {/* Newsletter strip */}
      <div className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="space-y-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-accent-400">Newsletter</p>
              <h3 className="text-2xl font-bold tracking-tight">Stay ahead of the curve.</h3>
              <p className="text-brand-400 text-sm max-w-md">
                Weekly digest of the most important tech stories, curated by our editors. No spam, ever.
              </p>
            </div>
            <div className="w-full lg:w-auto lg:min-w-[400px] space-y-2">
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 w-full">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-brand-500 focus:outline-none focus:border-accent-400 focus:ring-1 focus:ring-accent-400/20 transition-all font-medium disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 bg-accent-600 hover:bg-accent-500 text-white text-[10px] font-bold uppercase tracking-widest px-5 py-3 rounded-lg transition-all flex-shrink-0 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>Subscribe <ArrowRight className="w-3.5 h-3.5" /></>
                  )}
                </button>
              </form>
              {msg && (
                <p className={`text-[10px] font-bold uppercase tracking-wider ${isSuccess ? "text-emerald-400" : "text-amber-400"}`}>
                  {msg}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-10">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1 space-y-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent-600 rounded-lg flex items-center justify-center shadow-lg shadow-accent-600/30">
                <Zap className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="text-sm font-black tracking-widest uppercase">NEXUS</span>
            </Link>
            <p className="text-brand-400 text-sm leading-relaxed max-w-xs">
              The future of technology journalism — honest, independent, and always ahead.
            </p>
            <div className="flex items-center gap-3">
              {socials.map((s) => (
                <Link
                  key={s.label}
                  href={s.href}
                  title={s.label}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-accent-600 flex items-center justify-center transition-all"
                >
                  <s.icon className="w-3.5 h-3.5 text-brand-400 hover:text-white" />
                </Link>
              ))}
            </div>
          </div>

          {/* Topics (Dynamic) */}
          <div className="space-y-4">
            <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-brand-500">Topics</p>
            <ul className="space-y-2.5">
              {topics.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className="text-xs text-brand-400 hover:text-white transition-colors font-medium">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div className="space-y-4">
            <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-brand-500">Company</p>
            <ul className="space-y-2.5">
              {[
                { name: "About Us", href: "/about" },
                { name: "Editorial Policy", href: "/editorial-policy" },
                { name: "Advertise", href: "/advertise" },
                { name: "Careers", href: "/careers" },
                { name: "Contact", href: "/contact" }
              ].map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-xs text-brand-400 hover:text-white transition-colors font-medium">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Column */}
          <div className="space-y-4">
            <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-brand-500">Legal</p>
            <ul className="space-y-2.5">
              {[
                { name: "Privacy Policy", href: "/privacy" },
                { name: "Terms of Use", href: "/terms" },
                { name: "Cookie Policy", href: "/cookie-policy" },
                { name: "Sitemap", href: "/sitemap.xml" }
              ].map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-xs text-brand-400 hover:text-white transition-colors font-medium">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Banner Ad */}
        <div className="mt-12">
          <AdSpace slot="footer-banner" />
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-16 pt-8 border-t border-white/5">
          <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">
            © {new Date().getFullYear()} AlifXperience · All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-[10px] font-bold text-brand-600 hover:text-brand-300 uppercase tracking-widest transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-[10px] font-bold text-brand-600 hover:text-brand-300 uppercase tracking-widest transition-colors">
              Terms of Use
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
