import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Plus,
  FileText,
  Pencil,
  Eye,
  EyeOff,
  Search,
  ArrowUpDown,
} from "lucide-react";
import DeletePostButton from "./DeletePostButton";

export const dynamic = "force-dynamic";

async function getPosts() {
  return prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } }, category: { select: { name: true } } },
  });
}

function StatusBadge({ published }: { published: boolean }) {
  return (
    <span
      className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
        published ? "bg-emerald-50 text-emerald-700" : "bg-brand-100 text-brand-400"
      }`}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}

function getAuthorsText(post: any, userMap: Map<string, string>) {
  const primaryName = post.author?.name || "—";
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

export default async function AdminPostsPage() {
  const posts = await getPosts();
  const allUsers = await prisma.user.findMany({ select: { id: true, name: true, email: true } });
  const userMap = new Map(allUsers.map((u) => [u.id, u.name || u.email]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-accent-600 mb-1">Content</p>
          <h1 className="text-3xl font-bold text-brand-900 tracking-tight">Posts</h1>
          <p className="text-brand-400 text-sm mt-1">
            {posts.length} total · {posts.filter((p) => p.published).length} published
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className="flex items-center gap-2 bg-brand-900 hover:bg-accent-600 text-white text-[10px] font-bold uppercase tracking-widest px-5 py-3 rounded transition-all duration-300"
        >
          <Plus className="w-4 h-4" />
          New Post
        </Link>
      </div>

      {/* Search & Filter bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-300" />
          <input
            type="text"
            placeholder="Search posts…"
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-brand-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all text-brand-900 placeholder-brand-300 font-medium"
          />
        </div>
        <button className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-400 hover:text-brand-900 px-3 py-2 rounded-lg border border-brand-100 bg-white hover:bg-brand-50 transition-all">
          <ArrowUpDown className="w-3 h-3" />
          Sort
        </button>
      </div>

      {/* Posts Table */}
      <div className="bg-white rounded-xl border border-brand-100/60 overflow-hidden">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center">
              <FileText className="w-7 h-7 text-brand-200" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-brand-900">No posts yet</p>
              <p className="text-xs text-brand-400">Create your first article to get started.</p>
            </div>
            <Link
              href="/admin/posts/new"
              className="flex items-center gap-2 bg-brand-900 text-white text-[10px] font-bold uppercase tracking-widest px-5 py-3 rounded hover:bg-accent-600 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Write First Post
            </Link>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 border-b border-brand-50 bg-brand-50/40">
              {["Title", "Category", "Author", "Date", "Actions"].map((h) => (
                <span key={h} className="text-[8px] font-bold uppercase tracking-widest text-brand-300">
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            <div className="divide-y divide-brand-50">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center px-6 py-4 hover:bg-brand-50/30 transition-colors group"
                >
                  {/* Title */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-brand-100 flex-shrink-0 flex items-center justify-center">
                      <FileText className="w-3.5 h-3.5 text-brand-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-brand-900 truncate">{post.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StatusBadge published={post.published} />
                        {post.excerpt && (
                          <span className="text-[9px] text-brand-300 truncate max-w-[180px]">{post.excerpt}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Category */}
                  <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider truncate">
                    {post.category.name}
                  </span>

                  {/* Author */}
                  <span className="text-[10px] font-bold text-brand-400 truncate" title={getAuthorsText(post, userMap)}>
                    {getAuthorsText(post, userMap)}
                  </span>

                  {/* Date */}
                  <span className="text-[10px] font-bold text-brand-300">
                    {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/admin/posts/${post.id}/edit`}
                      className="p-1.5 rounded-lg text-brand-300 hover:text-accent-600 hover:bg-accent-50 transition-all"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href={`/${post.slug}`}
                      target="_blank"
                      className="p-1.5 rounded-lg text-brand-300 hover:text-brand-900 hover:bg-brand-100 transition-all"
                      title="Preview"
                    >
                      {post.published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </Link>
                    <DeletePostButton postId={post.id} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
