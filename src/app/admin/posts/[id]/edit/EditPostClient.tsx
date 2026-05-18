"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Globe,
  FileText,
  Tag,
  AlignLeft,
  Loader2,
  CheckCircle,
  Upload,
  X,
  Plus,
  ImageIcon,
  FolderPlus,
} from "lucide-react";

const TipTapEditor = dynamic(() => import("@/components/TipTapEditor"), {
  ssr: false,
  loading: () => (
    <div className="border border-brand-200/60 rounded-xl bg-white h-[540px] flex items-center justify-center">
      <Loader2 className="w-5 h-5 text-brand-300 animate-spin" />
    </div>
  ),
});

interface Category { id: string; name: string; slug: string; }

type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

function slugify(str: string) {
  return str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}

// ─── Cover Image Upload Panel ──────────────────────────────────────────────────
import MediaSelectorModal from "@/components/MediaSelectorModal";
import CoAuthorsPanel from "@/components/CoAuthorsPanel";

function CoverImagePanel({
  coverImage, setCoverImage,
}: { coverImage: string; setCoverImage: (v: string) => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const handleMediaSelect = (item: any) => {
    setCoverImage(item.url);
    setIsModalOpen(false);
  };

  return (
    <div className="bg-white rounded-xl border border-brand-100/60 p-5">
      <h3 className="flex items-center gap-2 text-[10px] font-bold text-brand-900 uppercase tracking-wider mb-4">
        <ImageIcon className="w-3.5 h-3.5 text-brand-300" /> Featured Image
      </h3>

      {coverImage ? (
        <div className="relative group">
          <div className="aspect-video rounded-lg overflow-hidden border border-brand-100">
            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
          </div>
          <button
            onClick={() => setCoverImage("")}
            className="absolute top-2 right-2 p-1 bg-white/90 rounded-full shadow hover:bg-red-50 hover:text-red-500 text-brand-500 transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Open Media Library Selector Modal */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-brand-200 hover:border-accent-400 hover:bg-brand-50/50 rounded-xl transition-all cursor-pointer text-center"
          >
            <Upload className="w-4 h-4 text-brand-400" />
            <div className="text-left">
              <p className="text-[10px] font-bold text-brand-700 uppercase tracking-wider">Select Featured Image</p>
              <p className="text-[7.5px] text-brand-400 font-medium mt-0.5">Choose from library or drop upload</p>
            </div>
          </button>

          {/* Or URL */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-brand-100" />
            <span className="text-[8px] font-bold text-brand-300 uppercase tracking-widest">or URL</span>
            <div className="flex-1 h-px bg-brand-105" />
          </div>

          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://images.unsplash.com/…"
              className="flex-1 text-[10px] font-medium text-brand-700 placeholder-brand-200 bg-brand-50 rounded-lg px-3 py-2 border border-brand-100 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all"
            />
            <button
              onClick={() => { if (urlInput.trim()) { setCoverImage(urlInput.trim()); setUrlInput(""); } }}
              className="px-3 py-2 bg-brand-900 text-white text-[9px] font-bold rounded-lg hover:bg-accent-600 transition-all cursor-pointer"
            >
              Set
            </button>
          </div>
        </div>
      )}

      <MediaSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleMediaSelect}
        allowedTypes="image"
        title="Select Featured Cover Image"
      />
    </div>
  );
}

// ─── Category Panel ────────────────────────────────────────────────────────────
function CategoryPanel({
  categories, setCategories, categoryId, setCategoryId,
}: {
  categories: Category[];
  setCategories: (cats: Category[]) => void;
  categoryId: string;
  setCategoryId: (id: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [catError, setCatError] = useState("");

  const createCategory = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    setCatError("");
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setCategories([...categories, data].sort((a, b) => a.name.localeCompare(b.name)));
      setCategoryId(data.id);
      setNewName("");
      setCreating(false);
    } catch (e: any) {
      setCatError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-brand-100/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2 text-[10px] font-bold text-brand-900 uppercase tracking-wider">
          <Tag className="w-3.5 h-3.5 text-brand-300" /> Category
        </h3>
        <button
          onClick={() => { setCreating(!creating); setCatError(""); }}
          className="flex items-center gap-1 text-[9px] font-bold text-accent-600 hover:text-brand-900 uppercase tracking-wider transition-colors"
          title="Add new category"
        >
          <FolderPlus className="w-3 h-3" />
          New
        </button>
      </div>

      {creating && (
        <div className="mb-4 p-3 bg-brand-50 rounded-lg border border-brand-100 space-y-2">
          <p className="text-[9px] font-bold text-brand-500 uppercase tracking-wider">New Category</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createCategory()}
              placeholder="e.g. Robotics"
              autoFocus
              className="flex-1 text-[10px] font-medium text-brand-900 placeholder-brand-300 bg-white rounded-lg px-3 py-2 border border-brand-200 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all"
            />
            <button
              onClick={createCategory}
              disabled={saving || !newName.trim()}
              className="px-3 py-2 bg-brand-900 text-white text-[9px] font-bold rounded-lg hover:bg-accent-600 transition-all disabled:opacity-40 flex items-center gap-1"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              Add
            </button>
          </div>
          {catError && <p className="text-[9px] font-bold text-red-500">{catError}</p>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {categories.length === 0 ? (
          <p className="text-[10px] text-brand-300 col-span-2 font-medium">No categories yet.</p>
        ) : (
          categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryId(cat.id)}
              className={`text-[9px] font-bold uppercase tracking-wider px-3 py-2 rounded-lg border transition-all text-left ${
                categoryId === cat.id
                  ? "bg-brand-900 text-white border-brand-900"
                  : "bg-white text-brand-500 border-brand-100 hover:border-brand-300 hover:text-brand-900"
              }`}
            >
              {cat.name}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Auto-save Status Label ────────────────────────────────────────────────────
function AutoSaveLabel({ status, lastSaved }: { status: AutoSaveStatus; lastSaved: Date | null }) {
  if (status === "saving") return (
    <span className="flex items-center gap-1.5 text-[9px] font-bold text-brand-400 uppercase tracking-wider">
      <Loader2 className="w-3 h-3 animate-spin" /> Saving…
    </span>
  );
  if (status === "saved" && lastSaved) return (
    <span className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-500 uppercase tracking-wider">
      <CheckCircle className="w-3 h-3" /> Auto-saved at {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </span>
  );
  if (status === "error") return (
    <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider">Auto-save failed</span>
  );
  return null;
}

// ─── Edit Post Client component ───────────────────────────────────────────────
export default function EditPostClient({ initialPost }: { initialPost: any }) {
  const router = useRouter();
  const { data: session } = useSession();

  const [title, setTitle] = useState(initialPost.title || "");
  const [slug, setSlug] = useState(initialPost.slug || "");
  const [excerpt, setExcerpt] = useState(initialPost.excerpt || "");
  const [content, setContent] = useState(initialPost.content || "");
  const [coverImage, setCoverImage] = useState(initialPost.coverImage || "");
  const [categoryId, setCategoryId] = useState(initialPost.categoryId || "");
  const [published, setPublished] = useState(initialPost.published || false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [coAuthors, setCoAuthors] = useState<string[]>(() => {
    try {
      if (initialPost.coAuthorsJson) {
        const parsed = JSON.parse(initialPost.coAuthorsJson);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to parse initial co-authors:", e);
    }
    return [];
  });

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [slugManual, setSlugManual] = useState(true);

  // Auto-save state
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDirtyRef = useRef(false);

  // Load categories
  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories).catch(console.error);
  }, []);

  // Auto-generate slug (only if manual slugification mode is toggled off)
  useEffect(() => {
    if (!slugManual) setSlug(slugify(title));
  }, [title, slugManual]);

  // Mark dirty whenever content changes (to trigger auto-save)
  useEffect(() => {
    isDirtyRef.current = true;
  }, [title, content, excerpt, coverImage, categoryId, published, coAuthors]);

  // ─── Auto-save Logic ─────────────────────────────────────────────
  const doAutoSave = useCallback(async () => {
    if (!isDirtyRef.current) return;
    if (!title.trim()) return;
    setAutoSaveStatus("saving");
    try {
      const body = {
        id: initialPost.id,
        title: title.trim(),
        slug: slug || slugify(title),
        content: content || "<p></p>",
        excerpt: excerpt.trim(),
        coverImage: coverImage.trim(),
        categoryId: categoryId || null,
        published: published,
        authorId: (session?.user as any)?.id || initialPost.authorId,
        coAuthors,
      };
      const res = await fetch("/api/posts/autosave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      setLastSaved(new Date());
      setAutoSaveStatus("saved");
      isDirtyRef.current = false;
    } catch {
      setAutoSaveStatus("error");
    }
  }, [title, slug, content, excerpt, coverImage, categoryId, published, initialPost.id, session, coAuthors]);

  // Auto-save every 30 seconds
  useEffect(() => {
    autoSaveTimerRef.current = setInterval(doAutoSave, 30_000);
    return () => { if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current); };
  }, [doAutoSave]);

  // Also auto-save after 3s of inactivity when dirty
  useEffect(() => {
    const t = setTimeout(() => { if (isDirtyRef.current) doAutoSave(); }, 3000);
    return () => clearTimeout(t);
  }, [title, content, excerpt, coverImage, categoryId, published, coAuthors, doAutoSave]);

  // ─── Manual Save/Publish ─────────────────────────────────────────
  const handleSave = async (publish = false) => {
    if (!title.trim()) { setError("Title is required."); return; }
    if (!content || content === "<p></p>") { setError("Content cannot be empty."); return; }
    if (!categoryId) { setError("Please select a category."); return; }
    setError("");
    publish ? setPublishing(true) : setSaving(true);

    try {
      const body = {
        id: initialPost.id,
        title: title.trim(),
        slug: slug || slugify(title),
        content,
        excerpt: excerpt.trim(),
        coverImage: coverImage.trim(),
        categoryId,
        published: publish,
        authorId: (session?.user as any)?.id || initialPost.authorId,
        coAuthors,
      };
      const res = await fetch("/api/posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        let msg = "Update failed";
        try { msg = (await res.json()).error ?? msg; } catch {}
        throw new Error(msg);
      }
      setAutoSaveStatus("saved");
      setLastSaved(new Date());
      setTimeout(() => router.push("/admin/posts"), 800);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/posts" className="p-2 rounded-lg text-brand-400 hover:text-brand-900 hover:bg-brand-100 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-accent-600 mb-0.5">Edit Article</p>
            <h1 className="text-2xl font-bold text-brand-900 tracking-tight">Edit Post</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <AutoSaveLabel status={autoSaveStatus} lastSaved={lastSaved} />

          <button
            onClick={() => handleSave(published)}
            disabled={saving || publishing}
            className="flex items-center gap-2 bg-white border border-brand-200 text-brand-700 text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 rounded transition-all hover:bg-brand-50 disabled:opacity-40"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Changes
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={publishing || published}
            className="flex items-center gap-2 bg-brand-900 hover:bg-accent-600 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 rounded transition-all disabled:opacity-40"
          >
            {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
            {published ? "Published" : "Publish Post"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-xs font-medium flex items-center gap-2">
          <X className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">
        {/* Main Column */}
        <div className="space-y-4">
          {/* Title + Slug */}
          <div className="bg-white rounded-xl border border-brand-100/60 p-6">
            <input
              type="text"
              placeholder="Article title…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-3xl font-bold text-brand-900 placeholder-brand-200 focus:outline-none tracking-tight leading-tight bg-transparent"
            />
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-brand-50">
              <span className="text-[9px] font-bold text-brand-300 uppercase tracking-widest flex-shrink-0">Slug:</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => { setSlugManual(true); setSlug(e.target.value); }}
                className="flex-1 text-[10px] font-bold text-brand-400 focus:outline-none focus:text-accent-600 bg-transparent font-mono"
                placeholder="auto-generated-slug"
              />
              {slugManual && (
                <button
                  onClick={() => { setSlugManual(false); setSlug(slugify(title)); }}
                  className="text-[9px] font-bold text-brand-300 hover:text-accent-600 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* TipTap Editor */}
          <TipTapEditor
            content={content}
            onChange={setContent}
            placeholder="Start writing your story..."
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Publish Panel */}
          <div className="bg-white rounded-xl border border-brand-100/60 p-5">
            <h3 className="text-[10px] font-bold text-brand-900 uppercase tracking-wider mb-4">Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-brand-700">
                    {published ? "Published" : "Draft"}
                  </p>
                  <p className="text-[9px] text-brand-300 font-medium mt-0.5">
                    {published ? "Visible to all readers" : "Only visible to admins"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPublished(!published)}
                  className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${published ? "bg-accent-600" : "bg-brand-200"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${published ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>

              <button
                onClick={() => doAutoSave()}
                className="w-full flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider text-brand-500 border border-brand-100 rounded-lg py-2 hover:bg-brand-50 transition-all"
              >
                <Save className="w-3 h-3" /> Save Draft Now
              </button>
            </div>
          </div>

          {/* Category */}
          <CategoryPanel
            categories={categories}
            setCategories={setCategories}
            categoryId={categoryId}
            setCategoryId={setCategoryId}
          />

          {/* Co-Authors Selection */}
          <CoAuthorsPanel
            selectedIds={coAuthors}
            onChange={setCoAuthors}
            primaryAuthorId={initialPost.authorId}
          />

          {/* Cover Image */}
          <CoverImagePanel coverImage={coverImage} setCoverImage={setCoverImage} />

          {/* Excerpt */}
          <div className="bg-white rounded-xl border border-brand-100/60 p-5">
            <h3 className="flex items-center gap-2 text-[10px] font-bold text-brand-900 uppercase tracking-wider mb-4">
              <AlignLeft className="w-3.5 h-3.5 text-brand-300" /> Excerpt
            </h3>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Short summary shown in article cards and search results…"
              rows={3}
              maxLength={200}
              className="w-full text-xs text-brand-700 placeholder-brand-200 bg-brand-50/50 rounded-lg px-3 py-2.5 border border-brand-100 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all resize-none font-medium leading-relaxed"
            />
            <p className="text-[9px] font-bold text-brand-300 mt-1 text-right">{excerpt.length}/200</p>
          </div>

          {/* SEO Preview */}
          <div className="bg-white rounded-xl border border-brand-100/60 p-5">
            <h3 className="flex items-center gap-2 text-[10px] font-bold text-brand-900 uppercase tracking-wider mb-4">
              <FileText className="w-3.5 h-3.5 text-brand-300" /> SEO Preview
            </h3>
            <div className="p-3 bg-brand-50 rounded-lg space-y-1">
              <p className="text-[10px] text-green-700 font-medium truncate">
                alifxperience.com/{slug || "your-post-slug"}
              </p>
              <p className="text-xs font-bold text-blue-700 leading-tight line-clamp-1">
                {title || "Your Post Title"}
              </p>
              <p className="text-[10px] text-brand-500 leading-relaxed line-clamp-2">
                {excerpt || "Your post excerpt will appear here in search results."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
