import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Shield, Lock, Eye, CheckCircle, ArrowLeft } from "lucide-react";
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
    title: `Privacy Policy | ${siteName}`,
    description: `Privacy Policy and data tracking disclosures for ${siteName}. Understand how we protect your personal information.`,
  };
}

export default async function PrivacyPage() {
  const settings = await readPublicSettings();
  const siteName = settings.siteName || "AlifXperience";
  const siteUrl = settings.siteUrl || "https://alifxperience.com";
  const contactEmail = settings.smtpUser || "privacy@alifxperience.com";

  return (
    <div className="min-h-screen bg-brand-50">
      <Ticker />
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8">
          <Link href="/" className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-brand-400 hover:text-accent-600 transition-colors">
            <ArrowLeft className="w-3 h-3" /> Home
          </Link>
          <span className="text-brand-200">/</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-accent-600">Privacy Policy</span>
        </div>

        <div className="bg-white rounded-3xl border border-brand-100/60 p-8 md:p-12 shadow-sm space-y-10">
          
          {/* Header */}
          <div className="space-y-4 border-b border-brand-100 pb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full">
              <Shield className="w-3.5 h-3.5" />
              <span className="text-[8px] font-black uppercase tracking-wider">AdSense Compliant Disclosures</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-brand-900 tracking-tight">
              Privacy Policy & Cookie Disclosures
            </h1>
            <p className="text-xs text-brand-400 font-bold uppercase tracking-wider">
              Last Updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>

          {/* Intro Section */}
          <div className="space-y-4">
            <p className="text-sm text-brand-600 leading-relaxed">
              At <strong>{siteName}</strong>, accessible from <a href={siteUrl} className="text-accent-600 hover:underline">{siteUrl}</a>, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by {siteName} and how we use it.
            </p>
            <p className="text-sm text-brand-600 leading-relaxed">
              If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us at <span className="font-semibold text-brand-900">{contactEmail}</span>.
            </p>
          </div>

          {/* AdSense specific disclosure - MANDATORY FOR APPROVAL */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-800">
              <Lock className="w-4 h-4 flex-shrink-0" />
              <h2 className="text-xs font-black uppercase tracking-wider">Google AdSense DoubleClick DART Cookies</h2>
            </div>
            <p className="text-xs text-amber-700 leading-relaxed font-medium">
              Google is one of the third-party vendors on our site. It also uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to our site and other sites on the internet. However, visitors may choose to decline the use of DART cookies by visiting the Google ad and content network Privacy Policy at the following URL: <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="underline font-bold text-accent-700">https://policies.google.com/technologies/ads</a>
            </p>
          </div>

          {/* Information We Collect */}
          <div className="space-y-4">
            <h2 className="text-base font-extrabold text-brand-900 uppercase tracking-wider">Information We Collect</h2>
            <p className="text-sm text-brand-600 leading-relaxed">
              The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information.
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {[
                "Newsletter subscription emails (securely encrypted)",
                "User profile display name & credentials",
                "Visitor IP address & standard user-agent specs",
                "Log files (browser type, ISP, dates/timestamps)",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-xs text-brand-500 font-medium">
                  <CheckCircle className="w-4 h-4 text-accent-600 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Cookie Disclosures */}
          <div className="space-y-4">
            <h2 className="text-base font-extrabold text-brand-900 uppercase tracking-wider">Cookies and Web Beacons</h2>
            <p className="text-sm text-brand-600 leading-relaxed">
              Like any other website, {siteName} uses &apos;cookies&apos;. These cookies are used to store information including visitors&apos; preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users&apos; experience by customizing our web page content based on visitors&apos; browser type and/or other information.
            </p>
          </div>

          {/* Third Party Policies */}
          <div className="space-y-4">
            <h2 className="text-base font-extrabold text-brand-900 uppercase tracking-wider">Third Party Privacy Policies</h2>
            <p className="text-sm text-brand-600 leading-relaxed">
              {siteName}&apos;s Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective Privacy Policies of these third-party ad servers for more detailed information. It may include their practices and instructions about how to opt-out of certain options.
            </p>
            <p className="text-sm text-brand-600 leading-relaxed">
              You can choose to disable cookies through your individual browser options. To know more detailed information about cookie management with specific web browsers, it can be found at the browsers&apos; respective websites.
            </p>
          </div>

          {/* GDPR Rights */}
          <div className="space-y-4">
            <h2 className="text-base font-extrabold text-brand-900 uppercase tracking-wider">GDPR & CCPA Data Protection Rights</h2>
            <p className="text-sm text-brand-600 leading-relaxed">
              We would like to make sure you are fully aware of all of your data protection rights. Every user is entitled to the following:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-brand-50/50 rounded-2xl p-5 border border-brand-100/50">
              <div>
                <p className="text-xs font-bold text-brand-800">The right to access</p>
                <p className="text-[11px] text-brand-500 leading-relaxed mt-1">You have the right to request copies of your personal data stored within our newsletter lists.</p>
              </div>
              <div>
                <p className="text-xs font-bold text-brand-800">The right to rectification</p>
                <p className="text-[11px] text-brand-500 leading-relaxed mt-1">You have the right to request that we correct any information you believe is inaccurate.</p>
              </div>
              <div>
                <p className="text-xs font-bold text-brand-800">The right to erasure (Right to be Forgotten)</p>
                <p className="text-[11px] text-brand-500 leading-relaxed mt-1">You have the right to request that we erase your personal data under certain conditions, such as unsubscribing.</p>
              </div>
              <div>
                <p className="text-xs font-bold text-brand-800">The right to opt-out</p>
                <p className="text-[11px] text-brand-500 leading-relaxed mt-1">You have the right to opt-out of third-party interest-based ad tracking anytime via browser parameters.</p>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
