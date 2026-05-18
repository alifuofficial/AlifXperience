"use client";

import { useState } from "react";
import { 
  Sparkles, 
  Phone, 
  Mail, 
  MapPin, 
  Send, 
  Loader2, 
  CheckCircle2, 
  MessageSquare,
  Building,
  Target,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    topic: "General Inquiry",
    message: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit message");
      }

      setSuccess(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        topic: "General Inquiry",
        message: ""
      });
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-50/50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-16">
        
        {/* Page Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-50 text-accent-700 rounded-full border border-accent-100 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[8.5px] font-black uppercase tracking-widest">Connect with Us</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-brand-900 tracking-tight uppercase">
            Get In Touch
          </h1>
          <p className="text-xs sm:text-sm text-brand-400 font-bold uppercase tracking-widest max-w-xl mx-auto leading-relaxed">
            Have a project in mind, digital marketing needs, or simply want to say hello? We are ready to collaborate!
          </p>
        </div>

        {/* Split Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column: Direct Contacts & Founder Profile (5 Columns) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Founder/Business Manager Card */}
            <div className="bg-gradient-to-br from-brand-900 to-indigo-950 p-6 rounded-3xl text-white shadow-xl space-y-5 relative overflow-hidden group">
              <div className="absolute inset-0 bg-grid-pattern opacity-5" />
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent-500/10 rounded-full blur-2xl" />
              
              <div className="space-y-1 relative">
                <span className="text-[8px] font-black uppercase tracking-[0.25em] text-accent-400">Founded By</span>
                <h3 className="text-xl font-black uppercase tracking-tight">Alifu H</h3>
                <p className="text-[10px] text-brand-300 font-bold uppercase tracking-widest">
                  Digital Transformation & System Manager
                </p>
              </div>

              <p className="text-[11px] text-brand-200 leading-relaxed font-semibold uppercase tracking-wide">
                Specialized in premium system development, infrastructure engineering, and high-impact digital marketing strategies designed to launch platforms forward.
              </p>

              <div className="border-t border-white/5 pt-4 space-y-3.5">
                <Link 
                  href="tel:0964121760" 
                  className="flex items-center gap-3 text-[11px] text-brand-100 hover:text-white transition-all font-bold uppercase tracking-wider group"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-accent-600 flex items-center justify-center transition-all">
                    <Phone className="w-4 h-4 text-accent-400 group-hover:text-white" />
                  </div>
                  <span>0964121760</span>
                </Link>

                <Link 
                  href="mailto:info@alifxperience.com" 
                  className="flex items-center gap-3 text-[11px] text-brand-100 hover:text-white transition-all font-bold uppercase tracking-wider group"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-accent-600 flex items-center justify-center transition-all">
                    <Mail className="w-4 h-4 text-accent-400 group-hover:text-white" />
                  </div>
                  <span>info@alifxperience.com</span>
                </Link>

                <div className="flex items-center gap-3 text-[11px] text-brand-100 font-bold uppercase tracking-wider">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-accent-400" />
                  </div>
                  <span>Addis Ababa, Ethiopia</span>
                </div>
              </div>
            </div>

            {/* Direct Core Pillars Info */}
            <div className="bg-white p-6 rounded-3xl border border-brand-100 shadow-sm space-y-6">
              <h4 className="text-xs font-black uppercase tracking-wider text-brand-900 border-b border-brand-50 pb-3">Why Contact Us?</h4>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-accent-50 rounded-xl flex items-center justify-center text-accent-600 flex-shrink-0">
                    <Building className="w-4.5 h-4.5" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-[11px] font-black uppercase tracking-wider text-brand-850">Custom Software Development</h5>
                    <p className="text-[10px] text-brand-400 leading-relaxed font-bold uppercase tracking-wide">
                      Beautiful, secure, and blazing-fast web ecosystems built specifically for modern enterprises.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 flex-shrink-0">
                    <Target className="w-4.5 h-4.5" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-[11px] font-black uppercase tracking-wider text-brand-850">Digital Marketing Strategy</h5>
                    <p className="text-[10px] text-brand-400 leading-relaxed font-bold uppercase tracking-wide">
                      High-conversion, metrics-driven targeted campaigns to scale your digital presence rapidly.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Form Card (7 Columns) */}
          <div className="lg:col-span-7">
            <div className="bg-white p-8 rounded-3xl border border-brand-100 shadow-xl shadow-brand-900/5 space-y-6">
              
              <div className="space-y-1">
                <h3 className="text-lg font-black uppercase tracking-tight text-brand-900">Send Us a Message</h3>
                <p className="text-[10px] text-brand-400 font-bold uppercase tracking-widest">
                  Required fields are marked with an asterisk (*)
                </p>
              </div>

              {success ? (
                <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-850 space-y-4 text-center animate-fade-in">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-black uppercase tracking-wider">Message Sent Successfully!</h4>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                      Thank you for reaching out. Our team will review your message and get in touch with you shortly.
                    </p>
                  </div>
                  <button 
                    onClick={() => setSuccess(false)}
                    className="px-5 py-2 text-[9px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-100 hover:bg-emerald-200 transition-all rounded-lg"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-[10.5px] font-black uppercase tracking-wide">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[8px] font-black uppercase tracking-wider text-brand-400 block mb-1">Your Name *</label>
                      <input 
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Alifu H"
                        className="w-full px-3.5 py-2.5 bg-brand-50/50 border border-brand-200 rounded-xl text-xs text-brand-900 placeholder-brand-300 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all font-semibold uppercase"
                      />
                    </div>

                    <div>
                      <label className="text-[8px] font-black uppercase tracking-wider text-brand-400 block mb-1">Your Email *</label>
                      <input 
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="e.g. user@domain.com"
                        className="w-full px-3.5 py-2.5 bg-brand-50/50 border border-brand-200 rounded-xl text-xs text-brand-900 placeholder-brand-300 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[8px] font-black uppercase tracking-wider text-brand-400 block mb-1">Phone Number</label>
                      <input 
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="e.g. 0964121760"
                        className="w-full px-3.5 py-2.5 bg-brand-50/50 border border-brand-200 rounded-xl text-xs text-brand-900 placeholder-brand-300 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all font-semibold uppercase"
                      />
                    </div>

                    <div>
                      <label className="text-[8px] font-black uppercase tracking-wider text-brand-400 block mb-1">Inquiry Topic</label>
                      <select 
                        name="topic"
                        value={formData.topic}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 bg-brand-50/50 border border-brand-200 rounded-xl text-xs text-brand-900 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all font-semibold uppercase"
                      >
                        <option value="General Inquiry">General Inquiry</option>
                        <option value="Tech Development Project">Tech Development Project</option>
                        <option value="Digital Marketing">Digital Marketing</option>
                        <option value="Editorial Tips / Co-Authorship">Editorial Tips / Co-Authorship</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[8px] font-black uppercase tracking-wider text-brand-400 block mb-1">Your Message *</label>
                    <textarea 
                      name="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us about your project or inquiry details..."
                      className="w-full px-3.5 py-2.5 bg-brand-50/50 border border-brand-200 rounded-xl text-xs text-brand-900 placeholder-brand-300 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all font-semibold min-h-[120px]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-accent-600 hover:bg-accent-700 disabled:opacity-50 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent-600/20"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        Send Message <Send className="w-4.5 h-4.5" />
                      </>
                    )}
                  </button>
                </form>
              )}

            </div>
          </div>

        </div>

        {/* Back Home */}
        <div className="text-center">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-brand-400 hover:text-brand-900 transition-colors"
          >
            Back to home <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </div>
  );
}
