"use client";

import { 
  Sparkles, 
  ShieldCheck, 
  BookOpen, 
  Scale, 
  Globe, 
  MessageSquareCode, 
  PenTool, 
  CheckCircle2,
  Phone,
  Mail,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export default function EditorialPolicyPage() {
  const policies = [
    {
      icon: ShieldCheck,
      color: "text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-600",
      title: "Accuracy & Scientific Rigor",
      description: "At AlifXperience, our primary commitment is to truthfulness and technical precision. We thoroughly fact-check scientific claims, validate engineering procedures, and cross-examine source references before publishing code snippets, tech analysis, or innovations.",
    },
    {
      icon: Scale,
      color: "text-amber-600 bg-amber-50 border-amber-100 hover:bg-amber-600",
      title: "Editorial Independence",
      description: "Our content is purely objective, completely independent, and free from external influence or bias. Advertising banners, sponsorship placements, and affiliate links are distinctly labeled to ensure transparent segregation from our organic articles.",
    },
    {
      icon: Globe,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-600",
      title: "Afaan Oromoo Terminology",
      description: "We are deeply dedicated to delivering specialized technological and scientific content curated natively in Afaan Oromoo. Our expert linguistics council works collaboratively to expand tech vocabulary and maintain educational parity.",
    },
    {
      icon: MessageSquareCode,
      color: "text-indigo-600 bg-indigo-50 border-indigo-100 hover:bg-indigo-600",
      title: "Co-Authorship & Peer Review",
      description: "We champion collaborative technology research. By enabling multi-author and co-authorship credentials across our articles, we ensure our insights undergo thorough peer review and collective refinement by experts in the field.",
    },
    {
      icon: PenTool,
      color: "text-rose-600 bg-rose-50 border-rose-100 hover:bg-rose-600",
      title: "Corrections & Integrity",
      description: "We hold our platform to the highest standards of journalistic integrity. If any typo, scientific error, or source-code flaw is identified, our editorial managers verify and issue transparent corrections swiftly.",
    },
  ];

  return (
    <div className="min-h-screen bg-brand-50/50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-16">
        
        {/* Page Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-50 text-accent-700 rounded-full border border-accent-100 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[8.5px] font-black uppercase tracking-widest">Platform Integrity</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-brand-900 tracking-tight uppercase">
            Editorial Policy
          </h1>
          <p className="text-xs sm:text-sm text-brand-400 font-bold uppercase tracking-widest max-w-xl mx-auto leading-relaxed">
            The values, guidelines, and standards that anchor tech, science, and innovation journalism at AlifXperience.
          </p>
        </div>

        {/* Introduction */}
        <div className="bg-white p-8 rounded-3xl border border-brand-100/60 shadow-xl shadow-brand-900/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-accent-500/10 transition-all duration-700" />
          <div className="space-y-4 relative">
            <div className="w-12 h-12 bg-accent-50 rounded-2xl flex items-center justify-center text-accent-600">
              <BookOpen className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-wider text-brand-900">Our Editorial Mission</h2>
            <p className="text-xs text-brand-500 leading-relaxed font-semibold uppercase tracking-wide">
              Founded by <span className="text-brand-900 font-extrabold">Alifu H</span>, AlifXperience is dedicated to pioneering technological, digital marketing, and scientific knowledge base transformation across Ethiopia. We exist to empower individuals by translating complex modern software paradigms, system administration strategies, and innovations into premium, accessible, and structured Afaan Oromoo contents.
            </p>
            <p className="text-[11px] text-brand-400 leading-relaxed font-bold uppercase tracking-wide">
              To guarantee that every piece of analysis, post, and video we publish meets these high benchmarks, all contributors and co-authors strictly adhere to the guidelines set forth below.
            </p>
          </div>
        </div>

        {/* Pillars / Policies Section */}
        <div className="space-y-6">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-brand-400 border-b border-brand-100 pb-3">Core Journalism Principles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {policies.map((p, idx) => (
              <div 
                key={idx} 
                className={`bg-white p-6 rounded-2xl border border-brand-100 shadow-sm space-y-4 hover:border-brand-300 transition-all duration-300 hover:shadow-lg group ${idx === 4 ? "md:col-span-2" : ""}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 group-hover:text-white ${p.color}`}>
                  <p.icon className="w-5 h-5 flex-shrink-0" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-brand-900 group-hover:text-accent-600 transition-colors">
                    {p.title}
                  </h3>
                  <p className="text-[11px] text-brand-500 leading-relaxed font-semibold uppercase tracking-wide">
                    {p.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Editorial Box */}
        <div className="bg-gradient-to-br from-brand-900 to-indigo-950 p-8 rounded-3xl text-white space-y-6 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent-500/10 rounded-full blur-3xl" />
          
          <div className="relative space-y-4 text-center">
            <p className="text-[9px] font-black uppercase tracking-[0.35em] text-accent-400">Collaborate with Us</p>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Have an correction or contribution?</h2>
            <p className="text-xs text-brand-200 uppercase tracking-widest max-w-xl mx-auto leading-relaxed font-bold">
              We value community feedback and intellectual precision. If you spot an error, have questions regarding our peer reviews, or wish to submit tech and scientific articles as an author, get in touch with our leadership directly.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative pt-4">
            <Link 
              href="tel:0964121760"
              className="flex items-center gap-2 px-6 py-3.5 bg-white text-brand-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-brand-50 hover:scale-105 transition-all shadow-md w-full sm:w-auto justify-center"
            >
              <Phone className="w-4 h-4 text-accent-600" />
              Call 0964121760
            </Link>
            
            <Link 
              href="mailto:info@alifxperience.com"
              className="flex items-center gap-2 px-6 py-3.5 bg-brand-800 border border-white/10 hover:border-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-brand-700 hover:scale-105 transition-all w-full sm:w-auto justify-center"
            >
              <Mail className="w-4 h-4 text-accent-400" />
              Email Editorial Team
            </Link>
          </div>
        </div>

        {/* Back Link */}
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
