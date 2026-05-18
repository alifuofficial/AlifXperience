"use client";

import Link from "next/link";
import { Home, Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-brand-100 to-brand-200 rounded-full mb-6">
            <span className="text-5xl font-black text-brand-300">404</span>
          </div>
          <h1 className="text-3xl font-bold text-brand-900 mb-3">Page Not Found</h1>
          <p className="text-brand-400 text-base leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-900 text-white font-semibold text-sm rounded-lg hover:bg-brand-800 transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-900 font-semibold text-sm rounded-lg border border-brand-200 hover:bg-brand-50 transition-colors"
          >
            <Search className="w-4 h-4" />
            Search
          </Link>
        </div>

        <div className="mt-10 pt-8 border-t border-brand-100">
          <Link
            href="javascript:history.back()"
            className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-600 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back to previous page
          </Link>
        </div>
      </div>
    </div>
  );
}