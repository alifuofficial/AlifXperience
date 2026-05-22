"use client";

import { useState, useEffect } from "react";
import { Mail, X, Loader2, Check, AlertCircle } from "lucide-react";

export default function NewsletterPopup() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("newsletter-popup-seen");
    if (seen) return;

    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setShow(false);
    sessionStorage.setItem("newsletter-popup-seen", "true");
  };

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

      if (!res.ok) throw new Error(data.error || "Subscription failed");

      setMsg(data.message || "Subscribed successfully!");
      setIsSuccess(true);
      setEmail("");

      setTimeout(() => {
        setShow(false);
        sessionStorage.setItem("newsletter-popup-seen", "true");
      }, 2000);
    } catch (error: any) {
      setMsg(error.message || "An error occurred.");
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-brand-950/60 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-gradient-to-br from-brand-900 to-accent-700 rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-scale-in">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 w-7 h-7 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors z-10"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="p-8 text-white">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-5">
            <Mail className="w-6 h-6 text-white" />
          </div>

          <h3 className="text-xl font-bold leading-tight mb-2">Stay Ahead of the Curve</h3>
          <p className="text-white/60 text-sm leading-relaxed mb-6">
            Get the most important tech stories delivered to your inbox every week. No spam, ever.
          </p>

          {msg ? (
            <div className={`p-4 rounded-xl flex items-start gap-2.5 text-sm font-semibold ${
              isSuccess ? "bg-emerald-500/20 text-emerald-200" : "bg-rose-500/20 text-rose-200"
            }`}>
              {isSuccess ? <Check className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
              <span>{msg}</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="space-y-3">
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all font-medium disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-accent-700 hover:bg-accent-50 text-[10px] font-bold uppercase tracking-widest py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Subscribing...</>
                ) : (
                  "Subscribe Free"
                )}
              </button>
            </form>
          )}

          <p className="text-[10px] text-white/40 text-center mt-4 font-medium">
            Join 10,000+ readers · Unsubscribe anytime
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
          animation: scale-in 0.35s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
