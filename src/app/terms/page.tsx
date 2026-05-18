import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Scale, ArrowLeft, BookOpen, Check } from "lucide-react";
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
    title: `Terms of Service | ${siteName}`,
    description: `Terms and Conditions of usage for ${siteName}. Explore our system directives and usage guidelines.`,
  };
}

export default async function TermsPage() {
  const settings = await readPublicSettings();
  const siteName = settings.siteName || "AlifXperience";
  const siteUrl = settings.siteUrl || "https://alifxperience.com";
  const contactEmail = settings.smtpUser || "support@alifxperience.com";

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
          <span className="text-[9px] font-bold uppercase tracking-widest text-accent-600">Terms of Service</span>
        </div>

        <div className="bg-white rounded-3xl border border-brand-100/60 p-8 md:p-12 shadow-sm space-y-10">
          
          {/* Header */}
          <div className="space-y-4 border-b border-brand-100 pb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-50 border border-brand-100 text-accent-700 rounded-full">
              <Scale className="w-3.5 h-3.5" />
              <span className="text-[8px] font-black uppercase tracking-wider">Service Agreements</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-brand-900 tracking-tight">
              Terms & Conditions
            </h1>
            <p className="text-xs text-brand-400 font-bold uppercase tracking-wider">
              Last Updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>

          {/* Intro Section */}
          <div className="space-y-4">
            <p className="text-sm text-brand-600 leading-relaxed">
              Welcome to <strong>{siteName}</strong>!
            </p>
            <p className="text-sm text-brand-600 leading-relaxed">
              These terms and conditions outline the rules and regulations for the use of {siteName}&apos;s Website, located at <a href={siteUrl} className="text-accent-600 hover:underline">{siteUrl}</a>.
            </p>
            <p className="text-sm text-brand-600 leading-relaxed">
              By accessing this website, we assume you accept these terms and conditions. Do not continue to use {siteName} if you do not agree to take all of the terms and conditions stated on this page.
            </p>
          </div>

          {/* Intellectual Property */}
          <div className="space-y-4">
            <h2 className="text-base font-extrabold text-brand-900 uppercase tracking-wider">Intellectual Property Rights</h2>
            <p className="text-sm text-brand-600 leading-relaxed">
              Unless otherwise stated, {siteName} and/or its licensors own the intellectual property rights for all material on {siteName}. All intellectual property rights are reserved. You may access this from {siteName} for your own personal use subjected to restrictions set in these terms and conditions.
            </p>
            <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 space-y-2">
              <p className="text-xs font-bold text-brand-800">You must not:</p>
              <ul className="space-y-2 text-xs text-brand-600">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent-600 rounded-full" />
                  Republish material from {siteName} without prior written consent.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent-600 rounded-full" />
                  Sell, rent, or sub-license material from {siteName}.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent-600 rounded-full" />
                  Reproduce, duplicate or copy material from {siteName}.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent-600 rounded-full" />
                  Redistribute content from {siteName}.
                </li>
              </ul>
            </div>
          </div>

          {/* Comments and Contributions */}
          <div className="space-y-4">
            <h2 className="text-base font-extrabold text-brand-900 uppercase tracking-wider">User Comments & Content</h2>
            <p className="text-sm text-brand-600 leading-relaxed">
              Parts of this website offer an opportunity for users to post and exchange opinions and information in certain areas of the website. {siteName} does not filter, edit, publish or review Comments prior to their presence on the website. Comments do not reflect the views and opinions of {siteName}, its agents and/or affiliates.
            </p>
            <p className="text-sm text-brand-600 leading-relaxed">
              {siteName} reserves the right to monitor all Comments and to remove any Comments which can be considered inappropriate, offensive or causes breach of these Terms and Conditions.
            </p>
          </div>

          {/* AdSense Disclaimer */}
          <div className="space-y-4">
            <h2 className="text-base font-extrabold text-brand-900 uppercase tracking-wider">Monetization & Ads Disclaimers</h2>
            <p className="text-sm text-brand-600 leading-relaxed font-medium">
              Our website displays Google AdSense advertisements. In accordance with this, you agree to allow Google and its partners to serve interest-based advertisements based on standard web cookie parameters. {siteName} makes no warranties or assertions regarding third-party promotional products, campaigns, or services rendered by programmatic networks.
            </p>
          </div>

          {/* Liability */}
          <div className="space-y-4">
            <h2 className="text-base font-extrabold text-brand-900 uppercase tracking-wider">Limitation of Liability</h2>
            <p className="text-sm text-brand-600 leading-relaxed">
              To the maximum extent permitted by applicable law, we exclude all representations, warranties and conditions relating to our website and the use of this website. Nothing in this disclaimer will limit or exclude our or your liability for fraud or fraudulent misrepresentation, or any liabilities that may not be excluded under applicable law.
            </p>
          </div>

          {/* Contact */}
          <div className="pt-6 border-t border-brand-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-xs text-brand-400 font-medium">
              Have questions about these terms?
            </p>
            <a href={`mailto:${contactEmail}`} className="px-4 py-2 bg-brand-900 hover:bg-accent-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all">
              Contact Support
            </a>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
