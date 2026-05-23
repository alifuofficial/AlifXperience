import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import AdSpace from "@/components/AdSpace";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import path from "path";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const categoryName = slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  return {
    title: `${categoryName} | AlifXperience`,
    description: `Latest ${categoryName} articles, news, and insights from AlifXperience.`,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const categoryName = slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  let settings = {};
  try {
    const raw = await readFile(path.join(process.cwd(), "data", "settings.json"), "utf-8");
    settings = JSON.parse(raw);
  } catch {}

  const category = await prisma.category.findFirst({
    where: { 
      OR: [
        { slug: slug },
        { name: categoryName }
      ]
    },
  });

  let posts: any[] = [];
  if (category) {
    posts = await prisma.post.findMany({
      where: { 
        published: true,
        categoryId: category.id
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { author: true, category: true },
    });
  }

  return (
    <div className="min-h-screen bg-brand-50">
      <Ticker />
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link href="/" className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-brand-400 hover:text-accent-600 transition-colors">
            <ArrowLeft className="w-3 h-3" /> Home
          </Link>
          <span className="text-brand-200">/</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-accent-600">{categoryName}</span>
        </div>

        {/* Category Banner Ad */}
        <div className="mb-8">
          <AdSpace slot="category-banner" className="mb-8" />
        </div>

        {/* Category Header */}
        <div className="bg-white rounded-3xl border border-brand-100/60 p-8 mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-brand-900 tracking-tight mb-3">{categoryName}</h1>
          <p className="text-brand-600 text-sm">
            {posts.length} {posts.length === 1 ? "article" : "articles"} in this category
          </p>
        </div>

        {/* Posts Grid */}
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post: any) => (
              <Link 
                key={post.id} 
                href={`/${post.slug}`}
                className="group bg-white rounded-2xl border border-brand-100/60 overflow-hidden hover:shadow-xl hover:shadow-brand-900/5 transition-all"
              >
                {post.imageUrl && (
                  <div className="aspect-[16/9] overflow-hidden relative">
                    <Image 
                      src={post.imageUrl} 
                      alt={post.title}
                      fill
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[8px] font-bold uppercase tracking-widest text-accent-600 bg-accent-50 px-2 py-0.5 rounded">
                      {post.category?.name || "Tech"}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-brand-900 group-hover:text-accent-600 transition-colors line-clamp-2 mb-2">
                    {post.title}
                  </h2>
                  <div className="flex items-center gap-1.5 text-[9px] font-medium text-brand-400">
                    <Clock className="w-3 h-3" />
                    {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-brand-100/60">
            <p className="text-brand-400 text-sm mb-4">No articles in this category yet.</p>
            <Link href="/" className="inline-flex items-center gap-2 text-accent-600 font-bold text-sm hover:underline">
              Back to Home <ArrowRight className="w-4 h-4" />
            </Link>
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