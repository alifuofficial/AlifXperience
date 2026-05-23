import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import NewsletterPopup from "@/components/NewsletterPopup";
import { ShareButtons, CommentBox, NewsletterSidebar } from "@/components/PostClientComponents";
import Link from "next/link";
import AdSpace from "@/components/AdSpace";
import InContentAds from "@/components/InContentAds";
import {
  Clock, ArrowLeft, Calendar, User,
  MessageSquare, TrendingUp, BookOpen, Mail, Eye,
} from "lucide-react";

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
interface Props { params: Promise<{ slug: string }>; }

const RESERVED = new Set(["admin", "api", "auth", "dashboard", "favicon.ico", "category"]);

async function getPost(slug: string) {
  if (RESERVED.has(slug)) return null;
  return prisma.post.findFirst({
    where: { slug, published: true },
    include: {
      author: { select: { name: true, email: true, bio: true, avatarUrl: true, twitterUrl: true, githubUrl: true, linkedinUrl: true, websiteUrl: true } },
      category: { select: { id: true, name: true, slug: true } },
      comments: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { author: { select: { name: true, email: true } } },
      },
    },
  });
}

async function getRelatedPosts(categoryId: string, excludeSlug: string) {
  return prisma.post.findMany({
    where: { published: true, categoryId, slug: { not: excludeSlug } },
    orderBy: { createdAt: "desc" },
    take: 4,
    select: { id: true, title: true, slug: true, excerpt: true, coverImage: true, createdAt: true, category: { select: { name: true } } },
  });
}

async function getTrendingPosts(excludeSlug: string) {
  return prisma.post.findMany({
    where: { published: true, slug: { not: excludeSlug } },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, title: true, slug: true, coverImage: true, createdAt: true, category: { select: { name: true } } },
  });
}

// ─── SEO ──────────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Not Found" };

  const settings = await readPublicSettings();
  const siteUrl = settings.siteUrl ? settings.siteUrl.replace(/\/$/, "") : "https://alifxperience.com";
  const canonicalUrl = `${siteUrl}/${slug}`;

  return {
    title: post.title,
    description: post.excerpt ?? post.content.replace(/<[^>]+>/g, "").slice(0, 160),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      url: canonicalUrl,
      siteName: settings.siteName || "AlifXperience",
      images: post.coverImage ? [{ url: post.coverImage }] : [],
      type: "article",
      publishedTime: post.createdAt.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt ?? post.content.replace(/<[^>]+>/g, "").slice(0, 160),
      images: post.coverImage ? [post.coverImage] : [],
    }
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function readTime(html: string) {
  const words = html.replace(/<[^>]+>/g, "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

// ─── Server-only components ────────────────────────────────────────────────────
function InlineRecommendation({ post }: {
  post: { title: string; slug: string; excerpt?: string | null; coverImage?: string | null; category: { name: string } }
}) {
  return (
    <div className="my-10 border-l-4 border-accent-600 bg-accent-50/50 rounded-r-xl overflow-hidden flex">
      <div className="flex-1 p-5">
        <p className="text-[8px] font-bold uppercase tracking-[0.25em] text-accent-600 mb-2 flex items-center gap-1.5">
          <BookOpen className="w-3 h-3" /> Also Read
        </p>
        <Link href={`/${post.slug}`} className="font-bold text-brand-900 hover:text-accent-600 transition-colors leading-snug text-sm">
          {post.title}
        </Link>
        {post.excerpt && <p className="text-xs text-brand-400 mt-1 line-clamp-1">{post.excerpt}</p>}
      </div>
      {post.coverImage && (
        <div className="w-24 h-24 flex-shrink-0">
          <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
}

function CommentList({ comments, formatDate }: {
  comments: Array<{ id: string; content: string; createdAt: Date; author: { name: string | null; email: string } }>;
  formatDate: (d: Date) => string;
}) {
  if (!comments.length) return (
    <p className="text-sm text-brand-400 font-medium text-center py-6">No comments yet. Be the first!</p>
  );
  return (
    <div className="space-y-4">
      {comments.map((c) => (
        <div key={c.id} className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-400 to-indigo-500 flex-shrink-0 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">
              {(c.author.name ?? c.author.email)[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1 bg-brand-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold text-brand-900">{c.author.name ?? "Anonymous"}</p>
              <p className="text-[9px] font-bold text-brand-300 uppercase tracking-wider">{formatDate(c.createdAt)}</p>
            </div>
            <p className="text-sm text-brand-600 leading-relaxed">{c.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}



function TrendingSidebar({ posts }: {
  posts: Array<{ id: string; title: string; slug: string; coverImage: string | null; createdAt: Date; category: { name: string } }>
}) {
  return (
    <div className="bg-white rounded-2xl border border-brand-100/60 p-5">
      <h3 className="flex items-center gap-2 text-[10px] font-bold text-brand-900 uppercase tracking-wider mb-5">
        <TrendingUp className="w-3.5 h-3.5 text-accent-600" /> Trending Now
      </h3>
      <div className="space-y-4">
        {posts.map((post, i) => (
          <Link key={post.id} href={`/${post.slug}`} className="flex gap-3 group">
            <span className="text-3xl font-black text-brand-100 leading-none w-6 flex-shrink-0 select-none">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <span className="text-[8px] font-bold text-accent-600 uppercase tracking-widest">{post.category.name}</span>
              <p className="text-xs font-bold text-brand-900 group-hover:text-accent-600 transition-colors leading-snug mt-0.5 line-clamp-2">{post.title}</p>
              <p className="text-[9px] font-bold text-brand-300 uppercase tracking-wider mt-1">{formatDate(post.createdAt)}</p>
            </div>
            {post.coverImage && (
              <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

function RelatedPosts({ posts }: {
  posts: Array<{ id: string; title: string; slug: string; excerpt: string | null; coverImage: string | null; createdAt: Date; category: { name: string } }>
}) {
  if (!posts.length) return null;
  return (
    <section className="mt-20 pt-10 border-t border-brand-100">
      <h2 className="text-lg font-bold text-brand-900 uppercase tracking-wider mb-8">More from this category</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {posts.map((post) => (
          <Link key={post.id} href={`/${post.slug}`} className="group flex flex-col bg-white rounded-xl border border-brand-100/60 overflow-hidden hover:shadow-lg hover:shadow-brand-900/5 transition-all">
            <div className="aspect-video bg-brand-100 overflow-hidden">
              {post.coverImage
                ? <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-8 h-8 text-brand-200" /></div>
              }
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <span className="text-[8px] font-bold text-accent-600 uppercase tracking-widest">{post.category.name}</span>
              <h3 className="text-sm font-bold text-brand-900 mt-1 leading-snug line-clamp-2 group-hover:text-accent-600 transition-colors">{post.title}</h3>
              {post.excerpt && <p className="text-xs text-brand-400 mt-2 line-clamp-2 flex-1">{post.excerpt}</p>}
              <p className="text-[9px] font-bold text-brand-300 uppercase tracking-wider mt-3">{formatDate(post.createdAt)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─── Shared prose classes ─────────────────────────────────────────────────────
const prose = `prose prose-slate prose-base max-w-none
  prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-brand-900
  prose-p:text-brand-600 prose-p:leading-relaxed prose-p:font-normal
  prose-a:text-accent-600 prose-a:no-underline hover:prose-a:underline
  prose-strong:text-brand-900 prose-strong:font-bold
  prose-blockquote:border-l-4 prose-blockquote:border-accent-600 prose-blockquote:bg-accent-50/50 prose-blockquote:rounded-r-xl prose-blockquote:py-1 prose-blockquote:not-italic prose-blockquote:text-brand-600
  prose-code:text-accent-700 prose-code:bg-accent-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
  prose-pre:bg-brand-900 prose-pre:text-brand-100 prose-pre:rounded-xl
  prose-img:rounded-xl prose-img:shadow-lg
  prose-hr:border-brand-100
  prose-li:text-brand-600`;

// ─── Main Page ────────────────────────────────────────────────────────────────
export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const [post, trending] = await Promise.all([getPost(slug), getTrendingPosts(slug)]);
  if (!post) notFound();

  // Increment views count atomically
  try {
    await prisma.post.update({
      where: { id: post.id },
      data: { views: { increment: 1 } },
    });
  } catch (error) {
    console.error("Failed to increment post views:", error);
  }

  const related = await getRelatedPosts(post.category.id, slug);
  const mins = readTime(post.content);

  // Load co-authors
  let coAuthorsList: Array<{
    id: string; name: string | null; email: string;
    bio: string | null; avatarUrl: string | null;
    twitterUrl: string | null; githubUrl: string | null; linkedinUrl: string | null; websiteUrl: string | null;
  }> = [];
  if (post.coAuthorsJson) {
    try {
      const coAuthorIds = JSON.parse(post.coAuthorsJson);
      if (Array.isArray(coAuthorIds) && coAuthorIds.length > 0) {
        coAuthorsList = await prisma.user.findMany({
          where: { id: { in: coAuthorIds } },
          select: { id: true, name: true, email: true, bio: true, avatarUrl: true, twitterUrl: true, githubUrl: true, linkedinUrl: true, websiteUrl: true },
        });
      }
    } catch {}
  }

  const allAuthors = [
    { name: post.author.name ?? "AlifX Staff", email: post.author.email ?? "", bio: post.author.bio, avatarUrl: post.author.avatarUrl, twitterUrl: post.author.twitterUrl, githubUrl: post.author.githubUrl, linkedinUrl: post.author.linkedinUrl, websiteUrl: post.author.websiteUrl },
    ...coAuthorsList.map((a) => ({ name: a.name ?? a.email, email: a.email, bio: a.bio, avatarUrl: a.avatarUrl, twitterUrl: a.twitterUrl, githubUrl: a.githubUrl, linkedinUrl: a.linkedinUrl, websiteUrl: a.websiteUrl })),
  ];
  const authorsText = allAuthors.map((a) => a.name).join(" & ");

  // Replace [download id="..."] shortcodes with HTML attachment boxes
  let processedContent = post.content;
  const shortcodeRegex = /\[download id=["']([^"']+)["']\]/g;
  const shortcodeMatches = [...processedContent.matchAll(shortcodeRegex)];
  
  if (shortcodeMatches.length > 0) {
    const mediaIds = shortcodeMatches.map(m => m[1]);
    const mediaItems = await prisma.media.findMany({
      where: { id: { in: mediaIds } },
    });
    
    const mediaMap = new Map(mediaItems.map(m => [m.id, m]));
    
    for (const match of shortcodeMatches) {
      const bareShortcode = match[0];
      const mediaId = match[1];
      const media = mediaMap.get(mediaId);
      
      if (media) {
        const sizeMb = (media.size / (1024 * 1024)).toFixed(2) + " MB";
        const attachmentHtml = `
<div class="my-8 p-6 bg-white border border-brand-100/60 rounded-2xl shadow-sm text-center not-prose max-w-md mx-auto">
  <div class="w-12 h-12 bg-accent-50 rounded-2xl flex items-center justify-center text-accent-600 mx-auto mb-4">
    <svg class="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
    </svg>
  </div>
  <div class="space-y-1 mb-5">
    <div class="text-xs font-bold text-brand-900 break-all px-2 leading-snug">${media.name}</div>
    <div class="text-[9px] text-brand-400 font-bold uppercase tracking-wider">${sizeMb} · File Attachment</div>
  </div>
  <a href="/download?fileId=${media.id}" class="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-accent-600 hover:bg-accent-500 !text-white text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-accent-600/10 active:scale-[0.99] cursor-pointer">
    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"></path>
    </svg>
    <span>Download Attachment</span>
  </a>
</div>
        `;
        
        // Escape bareShortcode for use in regex
        const escapedShortcode = bareShortcode.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const wrappedDoubleQuotePattern = new RegExp(`<p>\\s*${escapedShortcode}\\s*</p>`, "g");
        const wrappedSingleQuotePattern = new RegExp(`<p>\\s*\\[download id='${mediaId}']\\s*</p>`, "g");
        
        const oldContent = processedContent;
        processedContent = processedContent.replace(wrappedDoubleQuotePattern, attachmentHtml);
        processedContent = processedContent.replace(wrappedSingleQuotePattern, attachmentHtml);
        
        if (processedContent === oldContent) {
          processedContent = processedContent.replace(bareShortcode, attachmentHtml);
        }
      } else {
        processedContent = processedContent.replace(bareShortcode, "");
      }
    }
  }

  // Split content at midpoint to inject inline recommendation
  const midPoint = Math.floor(processedContent.length / 2);
  const splitIdx = processedContent.indexOf("</p>", midPoint);
  const firstHalf = splitIdx > -1 ? processedContent.slice(0, splitIdx + 4) : processedContent;
  const secondHalf = splitIdx > -1 ? processedContent.slice(splitIdx + 4) : "";
  const inlineRec = related[0] ?? trending[0];

  const settings = await readPublicSettings();
  const siteTitle = settings.siteName || "AlifXperience";
  const siteUrl = settings.siteUrl || "https://alifxperience.com";

  // NewsArticle JSON-LD for Search Engine dynamic indexing
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${siteUrl}/${slug}`
    },
    "headline": post.title,
    "description": post.excerpt || post.content.replace(/<[^>]+>/g, "").slice(0, 160),
    "image": post.coverImage ? [post.coverImage] : [`${siteUrl}/favicon.ico`],
    "datePublished": post.createdAt.toISOString(),
    "dateModified": post.createdAt.toISOString(),
    "author": allAuthors.map(auth => ({
      "@type": "Person",
      "name": auth.name,
      ...(auth.bio ? { "description": auth.bio } : {}),
      "jobTitle": "Tech Journalist"
    })),
    "publisher": {
      "@type": "Organization",
      "name": siteTitle,
      "logo": {
        "@type": "ImageObject",
        "url": settings.logoUrl || `${siteUrl}/favicon.ico`
      }
    }
  };

  return (
    <div className="min-h-screen bg-brand-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <Ticker />
      <Navbar />

      {/* Hero */}
      <div className="bg-white border-b border-brand-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8">
            <Link href="/" className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-brand-400 hover:text-accent-600 transition-colors">
              <ArrowLeft className="w-3 h-3" /> Home
            </Link>
            <span className="text-brand-200">/</span>
            <Link href={`/category/${post.category.slug}`} className="text-[9px] font-bold uppercase tracking-widest text-accent-600">
              {post.category.name}
            </Link>
          </div>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-600/5 border border-accent-600/10 rounded mb-5">
              <span className="w-1.5 h-1.5 bg-accent-600 rounded-full animate-pulse" />
              <span className="text-[8px] font-bold uppercase tracking-[0.25em] text-accent-700">{post.category.name}</span>
            </div>

            <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold text-brand-900 leading-[1.05] tracking-tighter">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-lg text-brand-500 leading-relaxed mt-5 max-w-2xl">{post.excerpt}</p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-6 mt-8 pt-6 border-t border-brand-100">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2.5">
                  {allAuthors.map((auth, index) => (
                    <div
                      key={index}
                      className="w-9 h-9 rounded-full border-2 border-white bg-gradient-to-br from-accent-400 to-indigo-500 flex items-center justify-center shadow-sm relative z-[2] first:z-[3] overflow-hidden"
                      title={auth.name}
                    >
                      {auth.avatarUrl ? (
                        <img src={auth.avatarUrl} alt={auth.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-900 leading-tight">{authorsText}</p>
                  <p className="text-[9px] text-brand-300 font-bold uppercase tracking-wider mt-0.5">
                    {allAuthors.length > 1 ? "Authors" : "Author"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-brand-400">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{formatDate(post.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-brand-400">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{mins} min read</span>
              </div>
              {settings.showPostViews !== "false" && (
                <div className="flex items-center gap-1.5 text-brand-400">
                  <Eye className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{post.views + 1} views</span>
                </div>
              )}
              <div className="ml-auto">
                {/* Client component — safe to render here */}
                <ShareButtons title={post.title} slug={slug} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-12">

          {/* Article column */}
          <div>
            {/* Featured image — contained within article column */}
            {post.coverImage && (
              <div className="aspect-video rounded-xl overflow-hidden mb-8 shadow-md shadow-brand-900/5">
                <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
              </div>
            )}

            <AdSpace slot="article-top" className="mb-8" />

            <div className={prose}>
              <InContentAds content={firstHalf} />
            </div>

            {inlineRec && secondHalf && <InlineRecommendation post={inlineRec} />}

            {secondHalf && (
              <div className={prose}>
                <InContentAds content={secondHalf} />
              </div>
            )}

            {/* Post footer */}
            <div className="flex flex-wrap items-center justify-between gap-4 mt-12 pt-8 border-t border-brand-100">
              <Link
                href={`/category/${post.category.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-accent-600/5 border border-accent-600/10 rounded-lg hover:bg-accent-600 hover:text-white hover:border-accent-600 transition-all group"
              >
                <span className="text-[9px] font-bold uppercase tracking-widest text-accent-700 group-hover:text-white">{post.category.name}</span>
              </Link>
              <ShareButtons title={post.title} slug={slug} />
            </div>

            {/* Comments */}
            <section className="mt-14">
              <h2 className="flex items-center gap-2 text-lg font-bold text-brand-900 uppercase tracking-wider mb-6">
                <MessageSquare className="w-5 h-5 text-accent-600" />
                Comments ({post.comments.length})
              </h2>
              <CommentList comments={post.comments} formatDate={formatDate} />
              <CommentBox />
            </section>

            <RelatedPosts posts={related} />
            <AdSpace slot="article-bottom" className="mt-8" />
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">

            {/* Article Info card — fills the top gap */}
            <div className="bg-white rounded-2xl border border-brand-100/60 p-5 space-y-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-brand-300">Article Info</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400">Category</span>
                  <Link href={`/category/${post.category.slug}`} className="text-[10px] font-bold text-accent-600 hover:underline uppercase tracking-wider">{post.category.name}</Link>
                </div>
                <div className="h-px bg-brand-50" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400">Published</span>
                  <span className="text-[10px] font-bold text-brand-700">{formatDate(post.createdAt)}</span>
                </div>
                <div className="h-px bg-brand-50" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400">Read time</span>
                  <span className="text-[10px] font-bold text-brand-700">{mins} min</span>
                </div>
                {settings.showPostViews !== "false" && (
                  <>
                    <div className="h-px bg-brand-50" />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400">Views</span>
                      <span className="text-[10px] font-bold text-brand-700">{post.views + 1}</span>
                    </div>
                  </>
                )}
                <div className="h-px bg-brand-50" />
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400">
                    {allAuthors.length > 1 ? "Authors" : "Author"}
                  </span>
                  <span className="text-[10px] font-bold text-brand-700 text-right max-w-[180px] break-words">
                    {authorsText}
                  </span>
                </div>
              </div>
              <div className="pt-1">
                <ShareButtons title={post.title} slug={slug} />
              </div>
            </div>

            <NewsletterSidebar />
            <AdSpace slot="sidebar-rect" className="mb-4" />
            <TrendingSidebar posts={trending} />

            {/* Author card */}
            <div className="bg-white rounded-2xl border border-brand-100/60 p-5 space-y-4">
              <p className="text-[9px] font-bold uppercase tracking-widest text-brand-300">
                {allAuthors.length > 1 ? "Written by Contributors" : "Written by"}
              </p>
              {allAuthors.map((auth, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-400 to-indigo-500 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {auth.avatarUrl ? (
                        <img src={auth.avatarUrl} alt={auth.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-brand-900 text-xs">{auth.name}</p>
                    </div>
                  </div>
                  {auth.bio && (
                    <p className="text-xs text-brand-500 leading-relaxed">{auth.bio}</p>
                  )}
                  {(auth.twitterUrl || auth.githubUrl || auth.linkedinUrl || auth.websiteUrl) && (
                    <div className="flex items-center gap-2 pt-1">
                      {auth.twitterUrl && (
                        <a href={auth.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-accent-600 transition-colors" title="Twitter / X">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L2.252 2.25H8.08l4.264 5.633L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        </a>
                      )}
                      {auth.githubUrl && (
                        <a href={auth.githubUrl} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-accent-600 transition-colors" title="GitHub">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
                        </a>
                      )}
                      {auth.linkedinUrl && (
                        <a href={auth.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-accent-600 transition-colors" title="LinkedIn">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                        </a>
                      )}
                      {auth.websiteUrl && (
                        <a href={auth.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-accent-600 transition-colors" title="Website">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                        </a>
                      )}
                    </div>
                  )}
                  {idx < allAuthors.length - 1 && <div className="border-t border-brand-50" />}
                </div>
              ))}
            </div>

            {/* Follow Us — fills the bottom gap */}
            <div className="bg-white rounded-2xl border border-brand-100/60 p-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-brand-300 mb-4">Follow NEXUS</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Twitter / X", handle: "@nexusmag", color: "hover:bg-[#1d9bf0]" },
                  { label: "LinkedIn", handle: "NEXUS Media", color: "hover:bg-[#0077b5]" },
                  { label: "YouTube", handle: "NEXUS TV", color: "hover:bg-[#ff0000]" },
                  { label: "GitHub", handle: "nexus-open", color: "hover:bg-brand-900" },
                ].map((s) => (
                  <a key={s.label} href="#"
                    className={`flex flex-col p-3 bg-brand-50 rounded-xl border border-brand-100 hover:text-white transition-all group ${s.color}`}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wider text-brand-500 group-hover:text-white/70">{s.label}</span>
                    <span className="text-[10px] font-bold text-brand-900 mt-0.5 group-hover:text-white">{s.handle}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Topics tag cloud */}
            <div className="bg-white rounded-2xl border border-brand-100/60 p-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-brand-300 mb-4">Explore Topics</p>
              <div className="flex flex-wrap gap-2">
                {["AI & ML", "Hardware", "Cybersecurity", "Space", "Software", "Reviews", "Mobile", "EVs", "Robotics"].map((tag) => (
                  <Link key={tag} href="#"
                    className="text-[9px] font-bold uppercase tracking-wider px-3 py-1.5 bg-brand-50 border border-brand-100 text-brand-500 rounded hover:bg-accent-600 hover:text-white hover:border-accent-600 transition-all"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>

          </aside>
        </div>
      </div>

      <NewsletterPopup />
      <Footer />
    </div>
  );
}
