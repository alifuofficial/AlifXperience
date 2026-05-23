"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  FileText,
  Pencil,
  Eye,
  EyeOff,
  Search,
  ArrowUpDown,
  CheckSquare,
  Square,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  FolderOpen,
  User,
  Calendar,
} from "lucide-react";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  published: boolean;
  createdAt: string;
  category: { name: string };
  author: { name: string | null };
  coAuthorsJson: string | null;
  views: number;
}

interface PostsManagerClientProps {
  initialPosts: Post[];
  userMap: Record<string, string>;
}

function StatusBadge({ published }: { published: boolean }) {
  return (
    <span
      className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
        published ? "bg-emerald-50 text-emerald-700 border border-emerald-150" : "bg-amber-50 text-amber-700 border border-amber-150"
      }`}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}

export default function PostsManagerClient({ initialPosts, userMap }: PostsManagerClientProps) {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "title-asc" | "title-desc">("date-desc");
  const [bulkAction, setBulkAction] = useState<"publish" | "draft" | "delete" | "">("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [loadingPostId, setLoadingPostId] = useState<string | null>(null);

  // Helper to format read time
  function getAuthorsText(post: Post) {
    const primaryName = post.author?.name || "—";
    const authors = [primaryName];
    if (post.coAuthorsJson) {
      try {
        const coAuthorIds = JSON.parse(post.coAuthorsJson);
        if (Array.isArray(coAuthorIds)) {
          coAuthorIds.forEach((id) => {
            const name = userMap[id];
            if (name && !authors.includes(name)) {
              authors.push(name);
            }
          });
        }
      } catch {}
    }
    return authors.join(" & ");
  }

  // Filter and Sort posts
  const filteredAndSortedPosts = useMemo(() => {
    let result = posts.filter((p) => {
      const titleMatch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
      const categoryMatch = p.category.name.toLowerCase().includes(searchQuery.toLowerCase());
      const authorMatch = getAuthorsText(p).toLowerCase().includes(searchQuery.toLowerCase());
      const excerptMatch = p.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
      return titleMatch || categoryMatch || authorMatch || excerptMatch;
    });

    result.sort((a, b) => {
      if (sortBy === "date-desc") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "date-asc") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === "title-asc") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "title-desc") {
        return b.title.localeCompare(a.title);
      }
      return 0;
    });

    return result;
  }, [posts, searchQuery, sortBy]);

  // Master Selection toggle
  const allVisibleSelected = useMemo(() => {
    if (filteredAndSortedPosts.length === 0) return false;
    return filteredAndSortedPosts.every((p) => selectedIds.includes(p.id));
  }, [filteredAndSortedPosts, selectedIds]);

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      // Remove visible posts from selection
      const visibleIds = filteredAndSortedPosts.map((p) => p.id);
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      // Add all visible posts to selection
      const visibleIds = filteredAndSortedPosts.map((p) => p.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]
    );
  };

  // Toggle single post status
  const handleToggleStatus = async (post: Post) => {
    setLoadingPostId(post.id);
    const newStatus = !post.published;
    try {
      const res = await fetch(`/api/posts/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [post.id], action: newStatus ? "publish" : "draft" }),
      });
      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) => (p.id === post.id ? { ...p, published: newStatus } : p))
        );
        router.refresh();
      } else {
        alert("Failed to update status");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating status");
    } finally {
      setLoadingPostId(null);
    }
  };

  // Delete single post
  const handleDeleteOne = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this article?")) return;
    setLoadingPostId(id);
    try {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
        setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
        router.refresh();
      } else {
        alert("Failed to delete post");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting post");
    } finally {
      setLoadingPostId(null);
    }
  };

  // Bulk execution
  const handleApplyBulkAction = async () => {
    if (!bulkAction) {
      alert("Please select a bulk action first.");
      return;
    }
    if (selectedIds.length === 0) {
      alert("No articles selected.");
      return;
    }

    const actionText =
      bulkAction === "delete"
        ? `permanently delete ${selectedIds.length} articles`
        : bulkAction === "publish"
        ? `publish ${selectedIds.length} articles`
        : `move ${selectedIds.length} articles to draft`;

    if (!confirm(`Are you sure you want to ${actionText}?`)) return;

    setIsExecuting(true);
    try {
      const res = await fetch(`/api/posts/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, action: bulkAction }),
      });

      const data = await res.json();
      if (res.ok) {
        if (bulkAction === "delete") {
          setPosts((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
        } else {
          const isPublished = bulkAction === "publish";
          setPosts((prev) =>
            prev.map((p) => (selectedIds.includes(p.id) ? { ...p, published: isPublished } : p))
          );
        }
        setSelectedIds([]);
        setBulkAction("");
        router.refresh();
      } else {
        alert(data.error || "Action failed");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during bulk operations.");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-accent-600 mb-1">Content</p>
          <h1 className="text-3xl font-bold text-brand-900 tracking-tight">Posts</h1>
          <p className="text-brand-400 text-sm mt-1">
            {posts.length} total · {posts.filter((p) => p.published).length} published · {posts.filter((p) => !p.published).length} drafts
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className="flex items-center gap-2 bg-brand-900 hover:bg-accent-600 text-white text-[10px] font-bold uppercase tracking-widest px-5 py-3 rounded transition-all duration-300 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Post
        </Link>
      </div>

      {/* Control bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-4 rounded-xl border border-brand-100/60 shadow-sm">
        {/* Bulk action selection */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value as any)}
            className="text-xs bg-brand-50 border border-brand-100 hover:border-brand-300 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 py-2.5 px-3 rounded-lg text-brand-900 font-bold uppercase tracking-wider transition-all"
            disabled={selectedIds.length === 0}
          >
            <option value="">Bulk Actions ({selectedIds.length} selected)</option>
            <option value="publish">Publish</option>
            <option value="draft">Move to Draft</option>
            <option value="delete">Delete Permanently</option>
          </select>
          <button
            onClick={handleApplyBulkAction}
            disabled={!bulkAction || selectedIds.length === 0 || isExecuting}
            className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
              bulkAction && selectedIds.length > 0 && !isExecuting
                ? "bg-brand-900 text-white hover:bg-accent-600 cursor-pointer"
                : "bg-brand-50 text-brand-300 border border-brand-100 cursor-not-allowed"
            }`}
          >
            {isExecuting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Apply"}
          </button>
        </div>

        {/* Search, Sort, Filter */}
        <div className="flex flex-1 sm:flex-initial items-center gap-3 w-full sm:w-auto justify-end">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-300" />
            <input
              type="text"
              placeholder="Search posts…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-brand-50 border border-brand-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all text-brand-900 placeholder-brand-300 font-medium"
            />
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none pr-8 pl-3 py-2.5 text-xs bg-white border border-brand-100 hover:border-brand-300 text-brand-500 hover:text-brand-900 font-bold uppercase tracking-wider rounded-lg transition-all"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="title-asc">Title A-Z</option>
              <option value="title-desc">Title Z-A</option>
            </select>
            <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-brand-300 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white rounded-xl border border-brand-100/60 overflow-hidden shadow-sm">
        {filteredAndSortedPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center">
              <FileText className="w-7 h-7 text-brand-200" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-brand-900">No matching posts</p>
              <p className="text-xs text-brand-400">Clear filters or create a new article.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-[auto_2.2fr_1.1fr_1.1fr_0.7fr_0.9fr_auto] gap-4 px-6 py-4 border-b border-brand-50 bg-brand-50/40 select-none">
              {/* Checkbox Header */}
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-brand-300 hover:text-brand-900 transition-colors"
                title="Select All"
              >
                {allVisibleSelected ? (
                  <CheckSquare className="w-4 h-4 text-brand-900" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>

              {["Title", "Category", "Author", "Views", "Date", "Actions"].map((h) => (
                <span key={h} className="text-[8px] font-bold uppercase tracking-widest text-brand-300">
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            <div className="divide-y divide-brand-50">
              {filteredAndSortedPosts.map((post) => {
                const isSelected = selectedIds.includes(post.id);
                const isPostLoading = loadingPostId === post.id;

                return (
                  <div
                    key={post.id}
                    className={`grid grid-cols-[auto_2.2fr_1.1fr_1.1fr_0.7fr_0.9fr_auto] gap-4 items-center px-6 py-4 transition-all group ${
                      isSelected ? "bg-brand-50/70" : "hover:bg-brand-50/20"
                    }`}
                  >
                    {/* Checkbox Row */}
                    <button
                      type="button"
                      onClick={() => toggleSelectOne(post.id)}
                      className="text-brand-200 hover:text-brand-950 transition-colors"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-brand-900" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>

                    {/* Title */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-brand-50 group-hover:bg-brand-100 transition-colors flex-shrink-0 flex items-center justify-center">
                        <FileText className="w-3.5 h-3.5 text-brand-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-brand-900 truncate">{post.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(post)}
                            disabled={isPostLoading}
                            className="cursor-pointer active:scale-95 transition-transform"
                            title="Click to toggle status"
                          >
                            <StatusBadge published={post.published} />
                          </button>
                          {post.excerpt && (
                            <span className="text-[9px] text-brand-300 truncate max-w-[200px]">{post.excerpt}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Category */}
                    <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider truncate flex items-center gap-1.5">
                      <FolderOpen className="w-3.5 h-3.5 text-brand-200 flex-shrink-0" />
                      {post.category?.name || "General"}
                    </span>

                    {/* Author */}
                    <span className="text-[10px] font-bold text-brand-400 truncate flex items-center gap-1.5" title={getAuthorsText(post)}>
                      <User className="w-3.5 h-3.5 text-brand-200 flex-shrink-0" />
                      {getAuthorsText(post)}
                    </span>

                    {/* Views */}
                    <span className="text-[10px] font-bold text-brand-400 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-brand-200 flex-shrink-0" />
                      {post.views || 0}
                    </span>

                    {/* Date */}
                    <span className="text-[10px] font-bold text-brand-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-brand-200 flex-shrink-0" />
                      {new Date(post.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {isPostLoading ? (
                        <div className="p-1.5">
                          <Loader2 className="w-3.5 h-3.5 text-brand-400 animate-spin" />
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(post)}
                            className={`p-1.5 rounded-lg transition-all ${
                              post.published
                                ? "text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50"
                                : "text-brand-300 hover:text-brand-900 hover:bg-brand-100"
                            }`}
                            title={post.published ? "Change to Draft" : "Publish Post"}
                          >
                            {post.published ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          </button>
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
                            title="Preview Post"
                          >
                            {post.published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteOne(post.id)}
                            className="p-1.5 rounded-lg text-brand-300 hover:text-rose-600 hover:bg-rose-50 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
