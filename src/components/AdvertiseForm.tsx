"use client";

import React, { useState } from "react";
import { Send, Check, Loader2 } from "lucide-react";

interface AdvertiseFormProps {
  contactEmail: string;
}

export default function AdvertiseForm({ contactEmail }: AdvertiseFormProps) {
  const [brandName, setBrandName] = useState("");
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState("Standard Banner Placement");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim() || !email.trim() || !message.trim()) return;

    try {
      const res = await fetch("/api/ads/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandName, email, tier, message }),
      });
      if (!res.ok) {
        throw new Error("Submission failed");
      }
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Submission encountered an issue. Please try again shortly.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8 space-y-4 animate-fade-in flex flex-col items-center">
        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-150 shadow-sm">
          <Check className="w-6 h-6 animate-pulse" />
        </div>
        <div className="space-y-1.5 max-w-sm">
          <h3 className="text-xs font-black uppercase tracking-widest text-brand-900">Inquiry Received Successfully!</h3>
          <p className="text-[11px] text-brand-450 leading-relaxed font-medium">
            Thank you for reaching out. Our partnerships manager will contact you at <span className="font-semibold text-brand-900 font-mono">{email}</span> within 24 hours.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setSuccess(false); setBrandName(""); setEmail(""); setMessage(""); }}
          className="mt-2 text-[8px] font-bold text-accent-600 hover:text-brand-950 uppercase tracking-widest transition-colors cursor-pointer"
        >
          Submit Another Inquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Brand Name */}
        <div className="space-y-1.5">
          <label className="text-[7.5px] font-bold text-brand-450 uppercase tracking-widest block">Brand / Company Name</label>
          <input
            type="text"
            required
            placeholder="e.g. Acme Tech Corp"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            disabled={submitting}
            className="w-full text-[10px] font-medium text-brand-700 placeholder-brand-200 bg-white rounded-lg px-3.5 py-2 border border-brand-100 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all disabled:opacity-50"
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-[7.5px] font-bold text-brand-450 uppercase tracking-widest block">Contact Email</label>
          <input
            type="email"
            required
            placeholder="e.g. partner@acme.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            className="w-full text-[10px] font-medium text-brand-700 placeholder-brand-200 bg-white rounded-lg px-3.5 py-2 border border-brand-100 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all disabled:opacity-50"
          />
        </div>
      </div>

      {/* Tier Selection */}
      <div className="space-y-1.5">
        <label className="text-[7.5px] font-bold text-brand-450 uppercase tracking-widest block">Placement Option</label>
        <select
          value={tier}
          onChange={(e) => setTier(e.target.value)}
          disabled={submitting}
          className="w-full text-[10px] font-bold text-brand-700 bg-white rounded-lg px-3.5 py-2 border border-brand-100 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all disabled:opacity-50"
        >
          <option>Standard Banner Placement</option>
          <option>Native Editorial Sponsor</option>
          <option>Newsletter Broadcast sponsor</option>
          <option>Custom Strategic Campaign</option>
        </select>
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <label className="text-[7.5px] font-bold text-brand-450 uppercase tracking-widest block">Inquiry Details & Target Launch</label>
        <textarea
          required
          rows={4}
          placeholder="Briefly describe your product and preferred advertising slots/target months..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={submitting}
          className="w-full text-[10px] font-medium text-brand-700 placeholder-brand-200 bg-white rounded-lg px-3.5 py-2 border border-brand-100 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all resize-none disabled:opacity-50"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 bg-brand-900 hover:bg-accent-600 text-white text-[9px] font-bold uppercase tracking-widest py-3 rounded-lg transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <>
            <Send className="w-3.5 h-3.5" />
            <span>Send Placement Inquiry</span>
          </>
        )}
      </button>
    </form>
  );
}
