import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import Link from "next/link";
import { 
  Target, 
  TrendingUp, 
  Mail, 
  Globe, 
  CheckCircle2, 
  ArrowRight,
  Megaphone,
  Sparkles
} from "lucide-react";
import { readFile } from "fs/promises";
import path from "path";
import AdvertiseForm from "@/components/AdvertiseForm";
import { prisma } from "@/lib/prisma";

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
    title: `Advertise with ${siteName} | Reach Tech Leaders`,
    description: `Connect your brand with the next generation of tech leaders. Premium display ads, sponsored content, and newsletter integrations.`,
  };
}

async function getPackages() {
  try {
    const packages = await prisma.adPackage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return packages.map(p => ({
      ...p,
      features: JSON.parse(p.features || "[]")
    }));
  } catch {
    return [];
  }
}

export default async function AdvertisePage() {
  const settings = await readPublicSettings();
  if (settings.advertisePageEnabled !== "true") notFound();
  const siteName = settings.siteName || "AlifXperience";
  const contactEmail = settings.smtpUser || "advertise@alifxperience.com";
  const packages = await getPackages();

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-brand-50/50">
      <Ticker />
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 lg:pt-16 lg:pb-24 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #000 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8">
            <Link href="/" className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-brand-400 hover:text-accent-600 transition-colors">
              <ArrowRight className="w-3 h-3 rotate-180" /> Home
            </Link>
            <span className="text-brand-200">/</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-accent-600">Advertise</span>
          </div>

          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-600 text-white rounded-full shadow-lg shadow-accent-600/20">
              <Megaphone className="w-3.5 h-3.5" />
              <span className="text-[8px] font-black uppercase tracking-wider">Premium Ad Inventory</span>
            </div>
          </div>

          {/* Main Headline */}
          <div className="text-center max-w-4xl mx-auto mb-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-brand-900 tracking-tight leading-[1.1] mb-6">
              Reach the Minds{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-600 to-accent-500">
                Building Tomorrow
              </span>
            </h1>
            <p className="text-lg md:text-xl text-brand-600 leading-relaxed max-w-2xl mx-auto">
              {siteName} connects ambitious brands with 150K+ monthly visitors and 25K+ newsletter subscribers. 
              Developers, architects, and tech leaders who shape the future.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <a 
              href="#pricing" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-brand-900 text-white font-bold text-sm rounded-xl hover:bg-accent-600 transition-all shadow-xl shadow-brand-900/10"
            >
              View Pricing
              <ArrowRight className="w-4 h-4" />
            </a>
            <a 
              href="#contact" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-900 font-bold text-sm rounded-xl border-2 border-brand-100 hover:border-brand-200 hover:shadow-lg transition-all"
            >
              Get Quote
            </a>
          </div>
        </div>
      </section>

      {/* Growth Chart Section */}
      <section className="py-16 bg-gradient-to-br from-brand-900 via-brand-950 to-brand-900 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-500/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-2">Audience Growth</h2>
            <p className="text-white/50 text-sm">Our community has grown 3x in the past year</p>
          </div>

          {/* Modern Growth Chart */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-8 relative overflow-hidden">
            {/* Chart SVG */}
            <svg className="w-full h-48" viewBox="0 0 800 200" preserveAspectRatio="none">
              {/* Grid Lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line 
                  key={i} x1="60" y1={40 + i * 35} x2="780" y2={40 + i * 35} 
                  stroke="rgba(255,255,255,0.08)" strokeWidth="1" 
                />
              ))}
              
              {/* Y-Axis Labels */}
              <text x="50" y="45" fill="rgba(255,255,255,0.3)" fontSize="10" textAnchor="end" className="font-mono">120K</text>
              <text x="50" y="80" fill="rgba(255,255,255,0.3)" fontSize="10" textAnchor="end" className="font-mono">90K</text>
              <text x="50" y="115" fill="rgba(255,255,255,0.3)" fontSize="10" textAnchor="end" className="font-mono">60K</text>
              <text x="50" y="150" fill="rgba(255,255,255,0.3)" fontSize="10" textAnchor="end" className="font-mono">30K</text>
              <text x="50" y="185" fill="rgba(255,255,255,0.3)" fontSize="10" textAnchor="end" className="font-mono">0</text>

              {/* X-Axis Labels */}
              <text x="140" y="210" fill="rgba(255,255,255,0.3)" fontSize="10" textAnchor="middle" className="font-mono">Jan</text>
              <text x="280" y="210" fill="rgba(255,255,255,0.3)" fontSize="10" textAnchor="middle" className="font-mono">Mar</text>
              <text x="420" y="210" fill="rgba(255,255,255,0.3)" fontSize="10" textAnchor="middle" className="font-mono">May</text>
              <text x="560" y="210" fill="rgba(255,255,255,0.3)" fontSize="10" textAnchor="middle" className="font-mono">Jul</text>
              <text x="700" y="210" fill="rgba(255,255,255,0.3)" fontSize="10" textAnchor="middle" className="font-mono">Sep</text>

              {/* Gradient Fill */}
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4"/>
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0"/>
                </linearGradient>
              </defs>

              {/* Area Fill */}
              <path 
                d="M 100 170 Q 180 150 220 130 T 320 90 T 420 60 T 520 45 T 620 30 T 720 15 L 720 180 L 100 180 Z" 
                fill="url(#chartGradient)"
              />

              {/* Animated Line */}
              <path 
                d="M 100 170 Q 180 150 220 130 T 320 90 T 420 60 T 520 45 T 620 30 T 720 15" 
                fill="none"
                stroke="#22c55e"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Data Points */}
              {[
                { x: 100, y: 170 },
                { x: 220, y: 130 },
                { x: 320, y: 90 },
                { x: 420, y: 60 },
                { x: 520, y: 45 },
                { x: 620, y: 30 },
                { x: 720, y: 15 },
              ].map((point, i) => (
                <g key={i}>
                  <circle 
                    cx={point.x} cy={point.y} r="5" 
                    fill="#22c55e" 
                    stroke="#ffffff" 
                    strokeWidth="2"
                  />
                </g>
              ))}
            </svg>

            {/* Key Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 pt-6 border-t border-white/10">
              {[
                { metric: "150K+", label: "Monthly Visitors", change: "+24%", good: true },
                { metric: "25K+", label: "Newsletter Subs", change: "+18%", good: true },
                { metric: "4.2%", label: "Avg. CTR", change: "+0.8%", good: true },
                { metric: "82%", label: "Tech Audience", change: "+5%", good: true },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-black text-white tracking-tight">{stat.metric}</div>
                  <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider mt-1">{stat.label}</div>
                  <div className={`text-[10px] font-bold mt-1 ${stat.good ? 'text-emerald-400' : 'text-red-400'}`}>
                    {stat.change}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ad Formats Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-black text-brand-900 tracking-tight mb-3">
              Multiple Ways to Connect
            </h2>
            <p className="text-brand-600 max-w-xl mx-auto">
              Choose the format that best fits your marketing objectives and budget
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {(packages.length > 0 ? packages : [
              {
                title: "Display Ads",
                description: "High-impact banner placements across desktop and mobile with smart targeting.",
                features: ["Sidebar leaderboards", "In-article rectangles", "Sticky mobile banners", "Retargeting ready"],
                icon: Globe,
                cta: "From ETB 199/mo",
                isFeatured: false
              },
              {
                title: "Sponsored Content",
                description: "Native editorial pieces that integrate seamlessly with our content flow.",
                features: ["Dedicated review articles", "Permanent backlinks", "Social syndication", "Newsletter feature"],
                icon: Sparkles,
                cta: "From ETB 499/article",
                isFeatured: true
              },
              {
                title: "Newsletter Sponsorship",
                description: "Direct access to our engaged developer and tech professional subscriber base.",
                features: ["Top-of-email placement", "Click tracking included", "A/B subject testing", "Detailed analytics"],
                icon: Mail,
                cta: "From ETB 299/blast",
                isFeatured: false
              },
            ]).map((format: any, idx: number) => (
              <div 
                key={format.title || idx}
                className={`relative p-8 rounded-3xl border-2 transition-all hover:shadow-xl ${
                  format.isFeatured 
                    ? "border-accent-500 bg-gradient-to-b from-white to-accent-50/30 shadow-lg shadow-accent-500/10" 
                    : "border-brand-100 bg-white hover:border-brand-200 hover:shadow-lg"
                }`}
              >
                {format.isFeatured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent-600 text-white text-[7px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${
                  format.isFeatured ? "bg-accent-100" : "bg-brand-50"
                }`}>
                  {(format.icon ? <format.icon className={`w-6 h-6 ${format.isFeatured ? "text-accent-600" : "text-brand-600"}`} /> : <Globe className="w-6 h-6 text-brand-600" />)}
                </div>
                <h3 className="text-lg font-black text-brand-900 mb-2">{format.title}</h3>
                <p className="text-sm text-brand-600 leading-relaxed mb-5">{format.description}</p>
                <ul className="space-y-2 mb-6">
                  {(format.features || []).map((feat: string, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-brand-650">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <div className="pt-4 border-t border-brand-100">
                  <span className={`text-sm font-bold ${format.isFeatured ? "text-accent-600" : "text-brand-700"}`}>
                    {format.price ? `From ETB ${format.price}${format.priceUnit || "/mo"}` : format.cta}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Advertise Section */}
      <section className="py-16 bg-brand-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4">
                Why Tech Leaders Choose Us
              </h2>
              <p className="text-brand-300 leading-relaxed mb-8">
                Our audience isn't just tech enthusiasts—they're decision makers, developers, and architects 
                building the products of tomorrow. They come here for insights, and they trust what they find.
              </p>
              <div className="space-y-4">
                {[
                  "AdSense compliant & brand-safe environment",
                  "Detailed performance analytics & reporting",
                  "Flexible packages tailored to your goals",
                  "Dedicated account management"
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-accent-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm font-medium text-white">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-accent-500/20 to-transparent rounded-3xl" />
              <div className="relative bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-8">
                <div className="text-center">
                  <div className="text-5xl font-black text-white mb-2">4.2%</div>
                  <div className="text-sm font-bold text-white/60 uppercase tracking-wider mb-6">Average CTR</div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 bg-white/5 rounded-xl">
                      <div className="text-2xl font-bold text-emerald-400">2.1s</div>
                      <div className="text-[10px] text-white/60 uppercase tracking-wider">Avg. Load Time</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl">
                      <div className="text-2xl font-bold text-emerald-400">68%</div>
                      <div className="text-[10px] text-white/60 uppercase tracking-wider">Mobile Traffic</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border border-brand-100 p-8 md:p-12 shadow-xl shadow-brand-900/5">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-black text-brand-900 mb-3">
                Ready to Get Started?
              </h2>
              <p className="text-brand-600">
                Fill out the form below and we'll be in touch within 24 hours
              </p>
            </div>

            <div className="bg-brand-50/50 rounded-2xl p-6">
              <AdvertiseForm contactEmail={contactEmail} />
            </div>

            <div className="mt-6 text-center">
              <p className="text-[11px] text-brand-500">
                Prefer email? Reach us directly at{' '}
                <a href={`mailto:${contactEmail}`} className="text-accent-600 font-semibold hover:underline">
                  {contactEmail}
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}