"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, FolderTree, Check, X, Loader2, Hash } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  _count?: { posts: number };
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "");
}

// ─── Inline Edit Row ───────────────────────────────────────────────────────────
function EditRow({ cat, onSave, onCancel }: {
  cat: Category;
  onSave: (id: string, name: string, slug: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(cat.name);
  const [slug, setSlug] = useState(cat.slug);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSave = async () => {
    setSaving(true); setErr("");
    try { await onSave(cat.id, name.trim(), slug.trim()); }
    catch (e: any) { setErr(e.message); }
    finally { setSaving(false); }
  };

  return (
    <tr className="bg-accent-50/30">
      <td className="px-5 py-3">
        <input
          autoFocus
          value={name}
          onChange={(e) => { setName(e.target.value); setSlug(slugify(e.target.value)); }}
          className="w-full text-xs font-bold text-brand-900 bg-white border border-accent-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-400/20"
        />
        {err && <p className="text-[9px] text-red-500 font-bold mt-1">{err}</p>}
      </td>
      <td className="px-5 py-3">
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full text-[10px] font-mono text-brand-500 bg-white border border-accent-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-400/20"
        />
      </td>
      <td className="px-5 py-3 text-center text-xs text-brand-400">{cat._count?.posts ?? 0}</td>
      <td className="px-5 py-3">
        <div className="flex items-center justify-end gap-1">
          <button onClick={handleSave} disabled={saving || !name.trim()}
            className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all disabled:opacity-40"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onCancel} className="p-1.5 bg-brand-100 text-brand-500 rounded-lg hover:bg-brand-200 transition-all">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // New category form
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    try {
      const res = await fetch("/api/categories?withCount=1");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch { }
    finally { setLoading(false); }
  }

  // ─── Create ─────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true); setCreateErr("");
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), slug: newSlug.trim() || slugify(newName) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setCategories((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName(""); setNewSlug("");
    } catch (e: any) {
      setCreateErr(e.message);
    } finally { setCreating(false); }
  };

  // ─── Update ─────────────────────────────────────────────────────────────────
  const handleUpdate = async (id: string, name: string, slug: string) => {
    const res = await fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Update failed");
    setCategories((prev) => prev.map((c) => c.id === id ? { ...c, name, slug } : c));
    setEditingId(null);
  };

  // ─── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? Posts in it will become uncategorized.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Delete failed");
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (e: any) { alert(e.message); }
    finally { setDeletingId(null); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-accent-600 mb-0.5">Content</p>
          <h1 className="text-2xl font-bold text-brand-900 tracking-tight">Categories</h1>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-brand-400">
          <FolderTree className="w-3.5 h-3.5" />
          {categories.length} total
        </div>
      </div>

      {/* Create form */}
      <div className="bg-white rounded-xl border border-brand-100/60 p-5">
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-brand-900 mb-4 flex items-center gap-2">
          <Plus className="w-3.5 h-3.5 text-accent-600" /> Add New Category
        </h2>
        <div className="flex gap-3 items-start flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <input
              type="text"
              placeholder="Category name (e.g. Robotics)"
              value={newName}
              onChange={(e) => { setNewName(e.target.value); setNewSlug(slugify(e.target.value)); }}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="w-full text-xs font-bold text-brand-900 placeholder-brand-300 bg-brand-50 border border-brand-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all"
            />
          </div>
          <div className="flex-1 min-w-[160px] relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-300" />
            <input
              type="text"
              placeholder="slug (auto-generated)"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              className="w-full pl-8 text-[10px] font-mono text-brand-500 placeholder-brand-300 bg-brand-50 border border-brand-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className="flex items-center gap-2 bg-brand-900 hover:bg-accent-600 text-white text-[10px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-lg transition-all disabled:opacity-40"
          >
            {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Add
          </button>
        </div>
        {createErr && <p className="text-[9px] font-bold text-red-500 mt-2">{createErr}</p>}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-brand-100/60 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-brand-100/60">
              <th className="px-5 py-3 text-left text-[9px] font-bold uppercase tracking-widest text-brand-400">Name</th>
              <th className="px-5 py-3 text-left text-[9px] font-bold uppercase tracking-widest text-brand-400">Slug</th>
              <th className="px-5 py-3 text-center text-[9px] font-bold uppercase tracking-widest text-brand-400">Posts</th>
              <th className="px-5 py-3 text-right text-[9px] font-bold uppercase tracking-widest text-brand-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-50">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center">
                  <Loader2 className="w-5 h-5 text-brand-300 animate-spin mx-auto" />
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center">
                  <FolderTree className="w-8 h-8 text-brand-200 mx-auto mb-2" />
                  <p className="text-xs text-brand-300 font-medium">No categories yet. Add one above.</p>
                </td>
              </tr>
            ) : (
              categories.map((cat) =>
                editingId === cat.id ? (
                  <EditRow key={cat.id} cat={cat} onSave={handleUpdate} onCancel={() => setEditingId(null)} />
                ) : (
                  <tr key={cat.id} className="hover:bg-brand-50/50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-bold text-brand-900">{cat.name}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <code className="text-[10px] font-mono text-brand-400 bg-brand-50 px-2 py-0.5 rounded">{cat.slug}</code>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="text-[10px] font-bold text-brand-500 bg-brand-100 px-2 py-0.5 rounded-full">
                        {cat._count?.posts ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingId(cat.id)}
                          className="p-1.5 text-brand-300 hover:text-brand-900 hover:bg-brand-100 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          disabled={deletingId === cat.id}
                          className="p-1.5 text-brand-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-40"
                          title="Delete"
                        >
                          {deletingId === cat.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
