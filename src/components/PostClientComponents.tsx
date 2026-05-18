"use client";

import { Link as LinkIcon, ArrowRight, MessageSquare, Mail, Loader2, Check, AlertCircle } from "lucide-react";
import { useState } from "react";

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L2.252 2.25H8.08l4.264 5.633L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
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

// ─── Share Buttons (client — uses navigator.clipboard) ─────────────────────────
export function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const url = `https://alifxperience.com/${slug}`;
  const encoded = encodeURIComponent(url);
  const titleEncoded = encodeURIComponent(title);

  const shares = [
    { icon: TwitterIcon, label: "X / Twitter", href: `https://twitter.com/intent/tweet?url=${encoded}&text=${titleEncoded}`, bg: "hover:bg-[#1d9bf0]" },
    { icon: FacebookIcon, label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`, bg: "hover:bg-[#1877f2]" },
    { icon: LinkedinIcon, label: "LinkedIn", href: `https://linkedin.com/sharing/share-offsite/?url=${encoded}`, bg: "hover:bg-[#0077b5]" },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[9px] font-bold uppercase tracking-widest text-brand-400">Share</span>
      {shares.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          title={s.label}
          className={`w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center text-brand-500 hover:text-white transition-all duration-200 ${s.bg}`}
        >
          <s.icon className="w-3.5 h-3.5" />
        </a>
      ))}
      <button
        onClick={() => navigator.clipboard?.writeText(url)}
        title="Copy link"
        className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center text-brand-500 hover:bg-brand-900 hover:text-white transition-all"
      >
        <LinkIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Comment Box (client — uses form state / future interactivity) ──────────────
export function CommentBox() {
  return (
    <div className="mt-12 bg-brand-50 rounded-2xl p-6 space-y-4">
      <h3 className="flex items-center gap-2 text-sm font-bold text-brand-900 uppercase tracking-wider">
        <MessageSquare className="w-4 h-4 text-accent-600" /> Leave a Comment
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Your name"
          className="px-4 py-2.5 bg-white border border-brand-200 rounded-lg text-sm text-brand-900 placeholder-brand-300 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all font-medium"
        />
        <input
          type="email"
          placeholder="Email (not published)"
          className="px-4 py-2.5 bg-white border border-brand-200 rounded-lg text-sm text-brand-900 placeholder-brand-300 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all font-medium"
        />
      </div>
      <textarea
        rows={4}
        placeholder="Share your thoughts…"
        className="w-full px-4 py-3 bg-white border border-brand-200 rounded-lg text-sm text-brand-900 placeholder-brand-300 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all resize-none font-medium"
      />
      <button className="flex items-center gap-2 bg-brand-900 hover:bg-accent-600 text-white text-[10px] font-bold uppercase tracking-widest px-5 py-3 rounded transition-all">
        Post Comment <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Newsletter Sidebar (client — submits subscriptions to the database) ─────────
export function NewsletterSidebar() {
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
    <div className="bg-gradient-to-br from-brand-900 to-accent-700 rounded-2xl p-6 text-white shadow-xl shadow-brand-900/10">
      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-4">
        <Mail className="w-5 h-5 text-white" />
      </div>
      <h3 className="text-base font-bold leading-tight mb-2">Get the weekly tech digest</h3>
      <p className="text-white/60 text-xs leading-relaxed mb-5">Join 10,000+ readers. No spam. Unsubscribe anytime.</p>
      
      <form onSubmit={handleSubscribe} className="space-y-3">
        <div className="relative">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            disabled={loading}
            required
            className="w-full px-3 py-2.5 bg-white/10 border border-white/10 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-all font-medium disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-white text-accent-700 hover:bg-accent-50 text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Subscribing...
            </>
          ) : (
            "Subscribe Free"
          )}
        </button>
      </form>

      {msg && (
        <div className={`mt-4 p-3 rounded-lg flex items-start gap-2 text-xs font-semibold ${
          isSuccess ? "bg-emerald-500/20 text-emerald-200" : "bg-rose-500/20 text-rose-200"
        }`}>
          {isSuccess ? <Check className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
          <span>{msg}</span>
        </div>
      )}
    </div>
  );
}
