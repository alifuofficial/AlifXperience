"use client";

import { useState, useEffect } from "react";
import { 
  Zap, Save, Plus, Trash2, ArrowUp, ArrowDown, ChevronRight, 
  ChevronLeft, Edit2, Check, X, FolderKanban, Link as LinkIcon, 
  Sparkles, RotateCcw, AlertCircle, RefreshCw, ShieldOff
} from "lucide-react";
import { useSession } from "next-auth/react";

interface MenuItem {
  id: string;
  name: string;
  href: string;
  children?: MenuItem[];
}

interface FlatMenuItem {
  id: string;
  name: string;
  href: string;
  level: number; // 0 = Root, 1 = Sub-menu, 2 = Sub-sub-menu
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function MenusPage() {
  const { data: session, status } = useSession();
  const role = (session?.user as any)?.role;

  const [menuLocation, setMenuLocation] = useState<"header" | "footer">("header");
  const [flatItems, setFlatItems] = useState<FlatMenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Add Item States
  const [newItemName, setNewItemName] = useState("");
  const [newItemUrl, setNewItemUrl] = useState("");
  
  // Inline Editing States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");

  // Load Menus & Categories
  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Fetch current menus
      const menusRes = await fetch(`/api/menus?location=${menuLocation}`);
      if (!menusRes.ok) throw new Error("Failed to load menus");
      const menus: MenuItem[] = await menusRes.json();
      setFlatItems(flattenTree(menus));

      // 2. Fetch categories for quick select
      const catRes = await fetch("/api/categories");
      if (catRes.ok) {
        const cats = await catRes.json();
        setCategories(cats);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while loading data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "ADMIN") {
      loadData();
    }
  }, [role, menuLocation]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <RefreshCw className="w-8 h-8 text-accent-500 animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest text-brand-400">Authenticating Session...</p>
      </div>
    );
  }

  if (role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <div className="p-3 bg-red-50 text-red-600 rounded-full">
          <ShieldOff className="w-8 h-8" />
        </div>
        <div className="text-center max-w-sm">
          <h2 className="text-lg font-bold text-brand-900">Access Denied</h2>
          <p className="text-xs text-brand-400 mt-1 font-medium">You do not have the required permissions to access this management area. Please contact system administrator.</p>
        </div>
      </div>
    );
  }

  // Helper: Flatten Tree Structure
  const flattenTree = (items: MenuItem[], level = 0): FlatMenuItem[] => {
    let result: FlatMenuItem[] = [];
    for (const item of items) {
      result.push({
        id: item.id || Math.random().toString(36).substring(7),
        name: item.name,
        href: item.href,
        level: level,
      });
      if (item.children && item.children.length > 0) {
        result = result.concat(flattenTree(item.children, level + 1));
      }
    }
    return result;
  };

  // Helper: Nest Flat Array back to Hierarchical Tree
  const nestFlatList = (items: FlatMenuItem[]): MenuItem[] => {
    const root: MenuItem[] = [];
    const stack: { item: MenuItem; level: number }[] = [];

    for (const flat of items) {
      const node: MenuItem = {
        id: flat.id,
        name: flat.name,
        href: flat.href,
        children: [],
      };

      // Pull from stack until we find the parent level
      while (stack.length > 0 && stack[stack.length - 1].level >= flat.level) {
        stack.pop();
      }

      if (stack.length === 0) {
        root.push(node);
      } else {
        const parent = stack[stack.length - 1].item;
        if (!parent.children) parent.children = [];
        parent.children.push(node);
      }

      stack.push({ item: node, level: flat.level });
    }

    return root;
  };

  // Handlers for Arranging items
  const moveUp = (index: number) => {
    if (index === 0) return;
    setFlatItems((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index - 1];
      next[index - 1] = temp;
      return next;
    });
  };

  const moveDown = (index: number) => {
    if (index === flatItems.length - 1) return;
    setFlatItems((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index + 1];
      next[index + 1] = temp;
      return next;
    });
  };

  const indentRight = (index: number) => {
    if (index === 0) return; // First item must be root (level 0)
    setFlatItems((prev) => {
      const next = [...prev];
      const current = next[index];
      const previous = next[index - 1];

      // WordPress Rule: Nesting level cannot exceed previous item's level + 1
      const maxLevel = previous.level + 1;
      if (current.level < 2 && current.level < maxLevel) {
        current.level += 1;
      }
      return next;
    });
  };

  const indentLeft = (index: number) => {
    setFlatItems((prev) => {
      const next = [...prev];
      const current = next[index];
      if (current.level > 0) {
        current.level -= 1;
      }
      // Clean up following items if they violate hierarchy rule
      for (let i = index + 1; i < next.length; i++) {
        if (next[i].level > next[i - 1].level + 1) {
          next[i].level = next[i - 1].level + 1;
        }
      }
      return next;
    });
  };

  // Add Custom Link Item
  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemUrl.trim()) return;

    const newItem: FlatMenuItem = {
      id: `custom-${Date.now()}`,
      name: newItemName.trim(),
      href: newItemUrl.trim(),
      level: 0,
    };

    setFlatItems((prev) => [...prev, newItem]);
    setNewItemName("");
    setNewItemUrl("");
    setSuccess("Item added to the bottom of the list!");
    setTimeout(() => setSuccess(""), 3000);
  };

  // Add Category/Page Item
  const handleAddShortcut = (name: string, href: string) => {
    const newItem: FlatMenuItem = {
      id: `shortcut-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name: name,
      href: href,
      level: 0,
    };
    setFlatItems((prev) => [...prev, newItem]);
    setSuccess(`Added shortcut for "${name}"!`);
    setTimeout(() => setSuccess(""), 3000);
  };

  // Delete Item
  const handleDelete = (id: string) => {
    setFlatItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Inline Editing
  const startEdit = (item: FlatMenuItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditUrl(item.href);
  };

  const saveEdit = (id: string) => {
    setFlatItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, name: editName.trim(), href: editUrl.trim() } : item
      )
    );
    setEditingId(null);
  };

  // Save Menu to Database JSON
  const handleSaveMenu = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const nestedTree = nestFlatList(flatItems);
      const res = await fetch(`/api/menus?location=${menuLocation}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nestedTree),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save menus");
      }

      setSuccess(`Navigation menu for ${menuLocation === "footer" ? "Footer Topics" : "Header Navigation"} updated and saved successfully!`);
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      setError(err.message || "An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  // Reset to default links
  const handleResetDefaults = () => {
    if (!confirm(`Are you sure you want to reset the ${menuLocation === "footer" ? "Footer Topics" : "Header Navigation"} menu back to standard defaults? All unsaved edits will be lost.`)) return;
    
    const defaults = menuLocation === "footer" ? [
      { id: "f1", name: "AI & Machine Learning", href: "/category/ai", level: 0 },
      { id: "f2", name: "Hardware", href: "/category/hardware", level: 0 },
      { id: "f3", name: "Cybersecurity", href: "/category/security", level: 0 },
      { id: "f4", name: "Space Tech", href: "/category/space", level: 0 },
      { id: "f5", name: "Software", href: "/category/software", level: 0 },
      { id: "f6", name: "Reviews", href: "/category/software", level: 0 }
    ] : [
      { id: "1", name: "Home", href: "/", level: 0 },
      { id: "2", name: "AI & ML", href: "/category/ai", level: 0 },
      { id: "3", name: "Hardware", href: "/category/hardware", level: 0 },
      { id: "4", name: "Security", href: "/category/security", level: 0 },
      { id: "5", name: "Space", href: "/category/space", level: 0 },
      { id: "6", name: "Reviews", href: "/category/software", level: 0 },
      { id: "7", name: "About Us", href: "/about", level: 0 }
    ];

    setFlatItems(defaults);
    setSuccess(`Menu structure for ${menuLocation === "footer" ? "Footer Topics" : "Header Navigation"} reset to standard defaults.`);
    setTimeout(() => setSuccess(""), 3000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <RefreshCw className="w-8 h-8 text-accent-500 animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest text-brand-400">Loading Menu Configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-50 text-accent-700 rounded-full mb-2 border border-accent-100">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[8px] font-black uppercase tracking-wider">Dynamic Layout Blocks</span>
          </div>
          <h1 className="text-2xl font-black text-brand-900 tracking-tight uppercase">Navigation Menus Manager</h1>
          <p className="text-[10px] text-brand-400 font-bold uppercase tracking-widest mt-1">
            {menuLocation === "footer"
              ? "Configure your website footer topics section links"
              : "Configure your website header navigation links with hierarchical sub-menus"
            }
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleResetDefaults}
            className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-brand-500 bg-white border border-brand-200 rounded-lg hover:bg-brand-50 hover:text-brand-900 transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
          </button>
          
          <button
            onClick={handleSaveMenu}
            disabled={saving}
            className="px-5 py-2 text-[9px] font-bold uppercase tracking-widest text-white bg-accent-600 rounded-lg hover:bg-accent-700 transition-all shadow-md shadow-accent-600/20 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Menu Structure
          </button>
        </div>
      </div>

      {/* Menu Location Tabs */}
      <div className="bg-white p-1 rounded-xl border border-brand-100 flex max-w-sm shadow-sm">
        <button
          onClick={() => setMenuLocation("header")}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
            menuLocation === "header"
              ? "bg-accent-600 text-white shadow-sm"
              : "text-brand-500 hover:text-brand-900 font-bold"
          }`}
        >
          Header Navigation
        </button>
        <button
          onClick={() => setMenuLocation("footer")}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
            menuLocation === "footer"
              ? "bg-accent-600 text-white shadow-sm"
              : "text-brand-500 hover:text-brand-900 font-bold"
          }`}
        >
          Footer Topics
        </button>
      </div>

      {/* Notification Toast */}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-xs font-bold uppercase tracking-wider leading-none">{success}</p>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-800 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-xs font-bold uppercase tracking-wider leading-none">{error}</p>
        </div>
      )}

      {/* Core Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Menu Item Add Sources (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* source 1: Custom Links */}
          <div className="bg-white rounded-2xl border border-brand-100 p-5 shadow-sm space-y-4">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-brand-800 flex items-center gap-2 pb-2.5 border-b border-brand-50">
              <LinkIcon className="w-4 h-4 text-accent-500" /> Custom Links
            </h3>
            
            <form onSubmit={handleAddCustom} className="space-y-4">
              <div>
                <label className="text-[8px] font-black uppercase tracking-wider text-brand-400 block mb-1">Link Text</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Contact Us"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-50/50 border border-brand-200 rounded-lg text-xs text-brand-900 placeholder-brand-300 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all font-medium"
                />
              </div>

              <div>
                <label className="text-[8px] font-black uppercase tracking-wider text-brand-400 block mb-1">URL Path</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., /contact or https://..."
                  value={newItemUrl}
                  onChange={(e) => setNewItemUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-brand-50/50 border border-brand-200 rounded-lg text-xs text-brand-900 placeholder-brand-300 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-brand-50 hover:bg-accent-50 hover:text-accent-700 text-brand-700 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 border border-brand-100"
              >
                <Plus className="w-3.5 h-3.5" /> Add to Menu
              </button>
            </form>
          </div>

          {/* source 2: Categories shortcuts */}
          <div className="bg-white rounded-2xl border border-brand-100 p-5 shadow-sm space-y-4">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-brand-800 flex items-center gap-2 pb-2.5 border-b border-brand-50">
              <FolderKanban className="w-4 h-4 text-emerald-500" /> Categories Shortcuts
            </h3>
            
            {categories.length === 0 ? (
              <p className="text-[10px] text-brand-300 font-bold uppercase tracking-wider text-center py-2">No categories found</p>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleAddShortcut(cat.name, `/category/${cat.slug}`)}
                    className="w-full flex items-center justify-between p-2.5 bg-brand-50 hover:bg-brand-100 rounded-lg text-left text-xs font-bold text-brand-700 transition-all border border-brand-50"
                  >
                    <span>{cat.name}</span>
                    <Plus className="w-3.5 h-3.5 text-brand-400" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* source 3: Static Pages shortcuts */}
          <div className="bg-white rounded-2xl border border-brand-100 p-5 shadow-sm space-y-4">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-brand-800 flex items-center gap-2 pb-2.5 border-b border-brand-50">
              <Sparkles className="w-4 h-4 text-amber-500" /> Page Shortcuts
            </h3>
            
            <div className="grid grid-cols-1 gap-2">
              {[
                { name: "Home Page", url: "/" },
                { name: "About Us", url: "/about" },
                { name: "Advertise", url: "/advertise" },
                { name: "Privacy Policy", url: "/privacy" },
                { name: "Terms of Use", url: "/terms" },
              ].map((p) => (
                <button
                  key={p.name}
                  onClick={() => handleAddShortcut(p.name, p.url)}
                  className="w-full flex items-center justify-between p-2.5 bg-brand-50/70 hover:bg-brand-100 rounded-lg text-left text-xs font-bold text-brand-700 transition-all border border-brand-50"
                >
                  <span className="truncate">{p.name}</span>
                  <Plus className="w-3.5 h-3.5 text-brand-400" />
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Interactive Menu Items List tree (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-brand-100 p-6 shadow-sm min-h-[500px] flex flex-col justify-between">
          
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-brand-100 pb-3">
              <h3 className="text-[11px] font-black uppercase tracking-wider text-brand-850">Menu Structure</h3>
              <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                {flatItems.length} {flatItems.length === 1 ? "Item" : "Items"}
              </span>
            </div>

            {flatItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-350 shadow-inner">
                  <LinkIcon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700">Empty Navigation Menu</h4>
                  <p className="text-[9px] text-slate-400 leading-relaxed font-bold uppercase tracking-wider mt-1 max-w-[280px] mx-auto">
                    Add custom links or shortcuts from the left panel to populate your header navigation links.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {flatItems.map((item, index) => {
                  const isEditing = editingId === item.id;
                  
                  // Style configurations based on dynamic Nesting levels
                  let indentStyle = "";
                  let cardStyle = "border-brand-200 bg-white hover:border-brand-300";
                  let levelBadge = "ROOT LINK";
                  let levelBadgeStyle = "bg-brand-900 text-white";

                  if (item.level === 1) {
                    indentStyle = "ml-8 md:ml-12";
                    cardStyle = "border-slate-200 bg-slate-50/80 hover:border-slate-300";
                    levelBadge = "SUB-MENU";
                    levelBadgeStyle = "bg-accent-600 text-white";
                  } else if (item.level === 2) {
                    indentStyle = "ml-16 md:ml-24";
                    cardStyle = "border-amber-200 bg-amber-50/20 hover:border-amber-300";
                    levelBadge = "SUB-SUB-MENU";
                    levelBadgeStyle = "bg-amber-600 text-white";
                  }

                  return (
                    <div 
                      key={item.id} 
                      className={`relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-3.5 border rounded-2xl transition-all shadow-sm ${indentStyle} ${cardStyle}`}
                    >
                      {/* Left Side: Nested Level Graphics & Item Details */}
                      <div className="flex-1 flex items-start gap-3">
                        {/* Branch Diagonal Connector Graphics */}
                        {item.level > 0 && (
                          <div className="absolute -left-5 top-0 bottom-1/2 w-4 border-l-2 border-b-2 border-slate-200 rounded-bl-lg pointer-events-none hidden md:block" />
                        )}

                        <div className="space-y-1.5 flex-1">
                          {isEditing ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                              <div>
                                <label className="text-[7.5px] font-black uppercase tracking-wider text-brand-400 block mb-0.5">Label</label>
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="w-full px-2 py-1 border border-brand-200 bg-white rounded text-xs text-brand-900 focus:outline-none focus:border-accent-400 font-medium"
                                />
                              </div>
                              <div>
                                <label className="text-[7.5px] font-black uppercase tracking-wider text-brand-400 block mb-0.5">Link Path / URL</label>
                                <input
                                  type="text"
                                  value={editUrl}
                                  onChange={(e) => setEditUrl(e.target.value)}
                                  className="w-full px-2 py-1 border border-brand-200 bg-white rounded text-xs text-brand-900 focus:outline-none focus:border-accent-400 font-medium"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-black text-brand-900 uppercase tracking-wide">{item.name}</span>
                              <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${levelBadgeStyle}`}>
                                {levelBadge}
                              </span>
                            </div>
                          )}

                          {!isEditing && (
                            <div className="flex items-center gap-1.5 text-[9px] text-slate-450 font-bold uppercase tracking-wider">
                              <LinkIcon className="w-2.5 h-2.5" />
                              <span>{item.href}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Side: Tree Arranging & Configuration Controls */}
                      <div className="flex items-center justify-end gap-1 flex-wrap shrink-0 border-t md:border-t-0 border-slate-100 pt-2 md:pt-0">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEdit(item.id)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Save Changes"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            {/* Hierarchy / Level modification */}
                            <button
                              onClick={() => indentLeft(index)}
                              disabled={item.level === 0}
                              className="p-1.5 text-slate-400 hover:text-brand-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                              title="Outdent Left"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => indentRight(index)}
                              disabled={index === 0 || item.level >= 2}
                              className="p-1.5 text-slate-400 hover:text-brand-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                              title="Indent Right"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>

                            {/* Position ordering */}
                            <button
                              onClick={() => moveUp(index)}
                              disabled={index === 0}
                              className="p-1.5 text-slate-400 hover:text-brand-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => moveDown(index)}
                              disabled={index === flatItems.length - 1}
                              className="p-1.5 text-slate-400 hover:text-brand-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit & Delete Action buttons */}
                            <button
                              onClick={() => startEdit(item)}
                              className="p-1.5 text-slate-400 hover:text-accent-600 hover:bg-slate-100 rounded-lg transition-colors ml-1"
                              title="Edit Label/Link"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Item"
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
            )}
          </div>

          <div className="border-t border-brand-100 pt-5 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
              <AlertCircle className="w-4 h-4 text-brand-400" />
              <span>Nesting level is capped at 3 tiers (Root, Sub, Sub-sub)</span>
            </div>
            
            <button
              onClick={handleSaveMenu}
              disabled={saving}
              className="w-full sm:w-auto px-6 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white bg-accent-600 rounded-lg hover:bg-accent-700 transition-all shadow-md shadow-accent-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Menu Changes
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
