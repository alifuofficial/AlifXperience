import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Ticker from "@/components/Ticker";
import Footer from "@/components/Footer";
import { ArrowRight, BookOpen, Clock, Calendar, User } from "lucide-react";
import { readFile } from "fs/promises";
import path from "path";
import AdSpace from "@/components/AdSpace";
import NewsletterBanner from "@/components/NewsletterBanner";

async function readPublicSettings() {
  try {
    const raw = await readFile(path.join(process.cwd(), "data", "settings.json"), "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// Helper to format read time
function readTime(html: string) {
  const words = html.replace(/<[^>]+>/g, "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// Helper to format dates beautifully
function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

// Default mock posts as elegant fallback if database has no articles yet
const MOCK_POSTS = [
  {
    id: "mock-1",
    title: "The Neural Link Revolution: Merging Mind and Machine by 2030",
    slug: "welcome-to-nexus",
    excerpt: "New breakthroughs in non-invasive brain-computer interfaces promise to change how we interact with technology forever. We explore the ethics, potentials, and pioneers behind this revolution.",
    content: "<p>Artificial intelligence is growing at an exponential rate...</p>",
    coverImage: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=2000&auto=format&fit=crop",
    createdAt: new Date(),
    author: { name: "Dr. Alex Chen" },
    category: { name: "Artificial Intelligence", slug: "ai" }
  },
  {
    id: "mock-2",
    title: "Quantum Encryption: Is Your Personal Data Safe from Next-Gen Hacks?",
    slug: "quantum-encryption-safety",
    excerpt: "As quantum computers approach reality, standard cryptography codes are becoming obsolete. Here is how post-quantum algorithms aim to keep our records safe.",
    content: "<p>Quantum computing presents both a massive opportunity and threat...</p>",
    coverImage: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop",
    createdAt: new Date(),
    author: { name: "Sarah Jenkins" },
    category: { name: "Security", slug: "security" }
  },
  {
    id: "mock-3",
    title: "The 2nm Chip War Heats Up: ASML, TSMC, and the Global Silicon Race",
    slug: "2nm-chip-war-semiconductors",
    excerpt: "Inside the ultra-clean cleanrooms where the future of human computing power is being etched on silicon wafers smaller than a strand of hair.",
    content: "<p>Semiconductor manufacturing has become the ultimate geopolitical chess match...</p>",
    coverImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1000&auto=format&fit=crop",
    createdAt: new Date(),
    author: { name: "Dr. M. Wong" },
    category: { name: "Hardware", slug: "hardware" }
  },
  {
    id: "mock-4",
    title: "Apple Vision Pro 2 Review: Lighter, Faster, and Finally Ready for Primetime",
    slug: "vision-pro-2-hands-on",
    excerpt: "Apple's second-generation spatial computer solves the critical weight distribution issue while dramatically improving visual density and FOV.",
    content: "<p>The original Vision Pro was an engineering marvel but a consumer prototype...</p>",
    coverImage: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?q=80&w=800&auto=format&fit=crop",
    createdAt: new Date(),
    author: { name: "Sarah Jenkins" },
    category: { name: "Reviews", slug: "software" }
  },
  {
    id: "mock-5",
    title: "CRISPR 3.0: Editing Out Genetic Diseases in Prenatal Human Embryos",
    slug: "crispr-3-genetic-engineering",
    excerpt: "A groundbreaking clinical trial shows near-perfect accuracy in correcting hereditary heart issues, triggering global ethical debates once again.",
    content: "<p>Gene editing has taken a massive step forward with precise base editors...</p>",
    coverImage: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=800&auto=format&fit=crop",
    createdAt: new Date(),
    author: { name: "Dr. M. Wong" },
    category: { name: "Biotech", slug: "biotech" }
  },
  {
    id: "mock-6",
    title: "Why Rust is Steadily Ousting JavaScript in Modern WebAssembly Modules",
    slug: "rust-vs-javascript-wasm",
    excerpt: "Performance benchmarks reveal that compiled WebAssembly modules written in Rust exceed native JavaScript speeds by up to 400% on calculations.",
    content: "<p>Web development is undergoing a silent speed revolution...</p>",
    coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop",
    createdAt: new Date(),
    author: { name: "Dev Team" },
    category: { name: "Dev Tech", slug: "dev" }
  }
];

function getAuthorsText(post: any, userMap: Map<string, string>) {
  const primaryName = post.author?.name || "AlifX Staff";
  const authors = [primaryName];
  if (post.coAuthorsJson) {
    try {
      const coAuthorIds = JSON.parse(post.coAuthorsJson);
      if (Array.isArray(coAuthorIds)) {
        coAuthorIds.forEach((id) => {
          const name = userMap.get(id);
          if (name && !authors.includes(name)) {
            authors.push(name);
          }
        });
      }
    } catch {}
  }
  return authors.join(" & ");
}

export default async function Home() {
  const settings = await readPublicSettings();
  const siteTitle = settings.siteName || "AlifXperience";
  const siteTagline = settings.siteTagline || "The Future of Tech";
  const siteUrl = settings.siteUrl || "https://alifxperience.com";
  const siteDesc = settings.siteDescription || "A modern technology magazine exploring the cutting edge of AI, software, and hardware.";

  // ─── Query Live Posts ────────────────────────────────────────────────────────
  let dbPosts: any[] = [];
  const userMap = new Map<string, string>();
  try {
    dbPosts = await prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { name: true } },
        category: { select: { name: true, slug: true } },
      },
    });

    const allUsers = await prisma.user.findMany({
      select: { id: true, name: true, email: true }
    });
    allUsers.forEach((u) => {
      userMap.set(u.id, u.name || u.email);
    });
  } catch (error) {
    console.error("Failed to query posts from database:", error);
  }

  // Use live posts if they exist, otherwise fall back to premium mock list
  const activePosts = dbPosts.length > 0 ? dbPosts : MOCK_POSTS;

  // Grid Assignments
  const mainFeatured = activePosts[0];
  const secondary1 = activePosts[1];
  const secondary2 = activePosts[2];
  const latestStories = activePosts.slice(3);

  // Schema graph structure for maximum Google Rank indexing
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        "url": siteUrl,
        "name": siteTitle,
        "description": siteDesc,
        "potentialAction": [
          {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": `${siteUrl}/?s={search_term_string}`
            },
            "query-input": "required name=search_term_string"
          }
        ],
        "inLanguage": "en-US"
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        "name": siteTitle,
        "url": siteUrl,
        "logo": {
          "@type": "ImageObject",
          "@id": `${siteUrl}/#logo`,
          "url": settings.logoUrl || `${siteUrl}/favicon.ico`,
          "caption": siteTitle
        },
        "sameAs": [
          "https://twitter.com/nexusmag",
          "https://linkedin.com/company/nexus-media",
          "https://youtube.com/nexus-tv"
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-brand-50 text-brand-900 flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Ticker />
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 space-y-16">
        {/* Visually Hidden SEO Primary H1 */}
        <h1 className="sr-only">
          {siteTitle} - {siteTagline} | Premier Tech Hub & Industry Insights
        </h1>

        {/* Hero Bento Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Featured Article (Left Large Panel) */}
          {mainFeatured && (
            <Link
              href={`/${mainFeatured.slug}`}
              className="lg:col-span-8 group relative flex flex-col justify-end overflow-hidden rounded-2xl bg-brand-900 border border-brand-100/50 shadow-md shadow-brand-900/5 h-[420px] lg:h-[550px] transition-all hover:shadow-xl hover:shadow-brand-900/10"
            >
              <div className="absolute inset-0">
                {mainFeatured.coverImage ? (
                  <img
                    src={mainFeatured.coverImage}
                    alt={mainFeatured.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-brand-800 to-indigo-950 flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-brand-700" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/40 to-transparent" />
              </div>

              <div className="relative z-10 p-6 md:p-8 lg:p-10 text-white space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent-600 border border-accent-600/30 text-[8px] font-bold uppercase tracking-[0.25em] rounded">
                  {mainFeatured.category?.name || "Featured"}
                </span>

                <h2 className="text-2xl md:text-4xl font-black leading-tight tracking-tight group-hover:text-accent-300 transition-colors">
                  {mainFeatured.title}
                </h2>

                {mainFeatured.excerpt && (
                  <p className="text-brand-300 text-xs md:text-sm line-clamp-2 font-medium leading-relaxed max-w-3xl">
                    {mainFeatured.excerpt}
                  </p>
                )}

                <div className="flex items-center gap-4 pt-4 border-t border-white/10 text-brand-300 text-[10px] font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>{getAuthorsText(mainFeatured, userMap)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(mainFeatured.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{readTime(mainFeatured.content || "")} min read</span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Right Sub-Featured Column */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Secondary Post 1 */}
            {secondary1 ? (
              <Link
                href={`/${secondary1.slug}`}
                className="group relative flex flex-col justify-end overflow-hidden rounded-2xl bg-brand-900 border border-brand-100/50 shadow-sm flex-1 min-h-[200px] transition-all hover:shadow-lg"
              >
                <div className="absolute inset-0">
                  {secondary1.coverImage ? (
                    <img
                      src={secondary1.coverImage}
                      alt={secondary1.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand-800 to-indigo-950 flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-brand-700" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-950/90 via-brand-950/30 to-transparent" />
                </div>
                <div className="relative z-10 p-5 text-white space-y-1">
                  <span className="text-[8px] font-bold text-accent-400 uppercase tracking-widest">
                    {secondary1.category?.name}
                  </span>
                  <h3 className="text-base font-bold leading-snug tracking-tight group-hover:text-accent-300 transition-colors line-clamp-2">
                    {secondary1.title}
                  </h3>
                  <p className="text-[9px] text-brand-300 font-bold uppercase tracking-wider pt-2">
                    {formatDate(secondary1.createdAt)}
                  </p>
                </div>
              </Link>
            ) : (
              <div className="bg-white border border-brand-100 rounded-2xl p-6 flex-1 flex flex-col items-center justify-center text-center">
                <BookOpen className="w-8 h-8 text-brand-200 mb-2" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-300">Awaiting Articles</p>
              </div>
            )}

            {/* Secondary Post 2 */}
            {secondary2 ? (
              <Link
                href={`/${secondary2.slug}`}
                className="group relative flex flex-col justify-end overflow-hidden rounded-2xl bg-brand-900 border border-brand-100/50 shadow-sm flex-1 min-h-[200px] transition-all hover:shadow-lg"
              >
                <div className="absolute inset-0">
                  {secondary2.coverImage ? (
                    <img
                      src={secondary2.coverImage}
                      alt={secondary2.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand-800 to-indigo-950 flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-brand-700" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-950/90 via-brand-950/30 to-transparent" />
                </div>
                <div className="relative z-10 p-5 text-white space-y-1">
                  <span className="text-[8px] font-bold text-accent-400 uppercase tracking-widest">
                    {secondary2.category?.name}
                  </span>
                  <h3 className="text-base font-bold leading-snug tracking-tight group-hover:text-accent-300 transition-colors line-clamp-2">
                    {secondary2.title}
                  </h3>
                  <p className="text-[9px] text-brand-300 font-bold uppercase tracking-wider pt-2">
                    {formatDate(secondary2.createdAt)}
                  </p>
                </div>
              </Link>
            ) : (
              <div className="bg-white border border-brand-100 rounded-2xl p-6 flex-1 flex flex-col items-center justify-center text-center">
                <BookOpen className="w-8 h-8 text-brand-200 mb-2" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-300">Awaiting Articles</p>
              </div>
            )}
          </div>
        </section>

        <AdSpace slot="homepage-banner" />

        {/* Latest Stories Feed Section */}
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-brand-100 pb-5">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-accent-600 mb-1">Live Feed</p>
              <h2 className="text-2xl md:text-3xl font-black text-brand-900 tracking-tight">
                Latest Stories
              </h2>
            </div>
            {latestStories.length > 0 && (
              <span className="text-[9px] font-bold uppercase tracking-widest px-3 py-1 bg-white border border-brand-100 rounded-full text-brand-400">
                {activePosts.length} Articles Online
              </span>
            )}
          </div>

          {latestStories.length === 0 ? (
            <div className="bg-white border border-brand-100 rounded-2xl py-16 flex flex-col items-center justify-center text-center max-w-xl mx-auto shadow-sm shadow-brand-900/5">
              <BookOpen className="w-12 h-12 text-brand-200 mb-4 animate-bounce" />
              <h3 className="text-sm font-bold text-brand-900 uppercase tracking-widest mb-1">Database Sync Complete</h3>
              <p className="text-xs text-brand-400 max-w-xs leading-relaxed px-4">
                You've successfully set up the platform! Go to the admin panel to publish more posts or import them instantly.
              </p>
              <Link href="/admin/posts/new" className="mt-5 text-[9px] font-bold uppercase tracking-widest bg-brand-900 hover:bg-accent-600 text-white px-5 py-2.5 rounded transition-all">
                Write First Article
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {latestStories.map((post) => (
                <Link
                  key={post.id}
                  href={`/${post.slug}`}
                  className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-brand-100/60 shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="aspect-video overflow-hidden bg-brand-50 relative">
                    {post.coverImage ? (
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-10 h-10 text-brand-200" />
                      </div>
                    )}
                    <span className="absolute top-4 left-4 bg-brand-900 text-white text-[8px] font-bold uppercase tracking-widest px-2.5 py-1 rounded shadow-sm">
                      {post.category?.name || "General"}
                    </span>
                  </div>

                  <div className="p-5 flex flex-col flex-1 space-y-3">
                    <h3 className="text-base font-bold text-brand-900 leading-snug tracking-tight group-hover:text-accent-600 transition-colors line-clamp-2">
                      {post.title}
                    </h3>

                    {post.excerpt && (
                      <p className="text-brand-500 text-xs line-clamp-2 leading-relaxed flex-1 font-medium">
                        {post.excerpt}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-brand-50 mt-auto text-[9px] font-bold text-brand-400 uppercase tracking-widest">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-brand-300" />
                        {getAuthorsText(post, userMap)}
                      </span>
                      <span>{readTime(post.content || "")} min read</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Newsletter Sponsor Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <NewsletterBanner className="mb-8" />
      </div>

      <Footer />
    </div>
  );
}