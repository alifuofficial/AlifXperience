"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import AdSpace from "@/components/AdSpace";
import Link from "next/link";
import Image from "next/image";
import { Search as SearchIcon, ArrowRight, Clock, Loader2, X } from "lucide-react";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  imageUrl?: string | null;
  createdAt: string;
  category: { name: string } | null;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    if (query) {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => {
          setResults(data.posts || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchInput.trim())}`;
    }
  };

  return (
    <div className="min-h-screen bg-brand-50">
      <Ticker />
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="bg-white rounded-3xl border border-brand-100/60 p-8 mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-brand-900 tracking-tight mb-6">Search</h1>
          
          <form onSubmit={handleSearch} className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-300" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search articles, topics, keywords..."
              className="w-full pl-12 pr-12 py-4 bg-brand-50 border border-brand-200 rounded-xl text-brand-900 placeholder-brand-300 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 text-base font-medium"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => { setSearchInput(""); window.location.href = "/search"; }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-300 hover:text-brand-500"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </form>
        </div>

        {/* Search Results Banner Ad */}
        <div className="mb-8">
          <AdSpace slot="search-results-banner" />
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-accent-600 animate-spin" />
          </div>
        ) : query ? (
          <div>
            <p className="text-sm font-medium text-brand-400 mb-6">
              {results.length} {results.length === 1 ? "result" : "results"} for "{query}"
            </p>

            {results.length > 0 ? (
              <div className="space-y-4">
                {results.map((post) => (
                  <Link
                    key={post.id}
                    href={`/${post.slug}`}
                    className="flex gap-4 bg-white rounded-2xl border border-brand-100/60 p-5 hover:shadow-lg hover:shadow-brand-900/5 transition-all group"
                  >
                    {post.imageUrl && (
                      <div className="w-32 h-24 flex-shrink-0 rounded-xl overflow-hidden relative">
                        <Image src={post.imageUrl} alt={post.title} fill className="w-full h-full object-cover" sizes="128px" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-accent-600 bg-accent-50 px-2 py-0.5 rounded">
                          {post.category?.name || "Tech"}
                        </span>
                      </div>
                      <h2 className="text-base font-bold text-brand-900 group-hover:text-accent-600 transition-colors mb-1">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="text-sm text-brand-500 line-clamp-2">{post.excerpt}</p>
                      )}
                      <div className="flex items-center gap-1.5 text-[9px] font-medium text-brand-400 mt-2">
                        <Clock className="w-3 h-3" />
                        {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <ArrowRight className="w-5 h-5 text-brand-200 group-hover:text-accent-600 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-3xl border border-brand-100/60">
                <p className="text-brand-400 text-sm mb-4">No articles found for "{query}"</p>
                <p className="text-brand-300 text-xs">Try different keywords or browse categories</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-brand-100/60">
            <p className="text-brand-400 text-sm">Enter a search term to find articles</p>
          </div>
        )}
      </main>

      {/* Footer Banner Ad */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <AdSpace slot="footer-banner" />
      </div>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent-600 animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}