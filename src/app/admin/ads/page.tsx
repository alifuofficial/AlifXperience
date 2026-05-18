"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Megaphone, Plus, Pencil, Trash2, Check, X, 
  Loader2, ExternalLink, Sparkles, BarChart2, Eye, 
  MousePointerClick, CheckCircle, Ban, ArrowRight,
  ImageIcon, DollarSign, Package, TrendingUp, Calendar,
  Phone, Mail, ShieldOff
} from "lucide-react";
import MediaSelectorModal from "@/components/MediaSelectorModal";

interface Ad {
  id: string;
  title: string;
  companyName: string;
  slot: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
  htmlCode?: string | null;
  status: string;
  impressions: number;
  clicks: number;
  createdAt: string;
}

interface AdRequest {
  id: string;
  brandName: string;
  email: string;
  tier: string;
  message: string;
  status: string;
  price?: number | null;
  createdAt: string;
}

interface AdPackage {
  id: string;
  title: string;
  description: string;
  price: number;
  priceUnit: string;
  features: string;
  isFeatured: boolean;
  sortOrder: number;
  isActive: boolean;
}

interface RevenueData {
  totalRevenue: number;
  monthRevenue: number;
  revenues: { id: string; source: string; amount: number; description: string; date: string }[];
}

const slotLabels: Record<string, { label: string; color: string; location: string; dimensions: string; page: string; status: string }> = {
  "homepage-banner": { label: "Homepage Top Banner", color: "bg-blue-50 text-blue-700 border-blue-150", location: "Top of homepage, below hero", dimensions: "8:1 aspect ratio (728x90 or 970x110)", page: "Homepage", status: "Implemented" },
  "article-top": { label: "Article Top Banner", color: "bg-indigo-50 text-indigo-700 border-indigo-150", location: "Top of article content", dimensions: "7:1 aspect ratio (700x100)", page: "Article Pages", status: "Implemented" },
  "sidebar-rect": { label: "Sticky Sidebar Box", color: "bg-purple-50 text-purple-700 border-purple-150", location: "Sidebar, sticky on scroll", dimensions: "1:1 square (300x300)", page: "Article Pages", status: "Implemented" },
  "article-bottom": { label: "Article Footer Banner", color: "bg-pink-50 text-pink-700 border-pink-150", location: "Bottom of article, before comments", dimensions: "7:1 aspect ratio (700x100)", page: "Article Pages", status: "Implemented" },
  "popup-overlay": { label: "Global Entry Popup", color: "bg-amber-50 text-amber-700 border-amber-150", location: "Modal overlay on page load", dimensions: "Responsive, max 500px width", page: "All Pages", status: "Implemented" },
  "category-banner": { label: "Category Page Banner", color: "bg-cyan-50 text-cyan-700 border-cyan-150", location: "Top of category listing pages", dimensions: "8:1 aspect ratio (970x110)", page: "Category Pages", status: "Implemented" },
  "search-results-banner": { label: "Search Results Banner", color: "bg-orange-50 text-orange-700 border-orange-150", location: "Between search results", dimensions: "7:1 aspect ratio (700x100)", page: "Search Page", status: "Implemented" },
  "footer-banner": { label: "Footer Banner", color: "bg-teal-50 text-teal-700 border-teal-150", location: "Above site footer", dimensions: "8:1 aspect ratio (970x110)", page: "All Pages", status: "Implemented" },
  "interstitial": { label: "Interstitial Ad", color: "bg-rose-50 text-rose-700 border-rose-150", location: "Full page between navigation", dimensions: "Full viewport, modal style", page: "All Pages", status: "Implemented" },
  "newsletter-banner": { label: "Newsletter Inline Banner", color: "bg-violet-50 text-violet-700 border-violet-150", location: "Within newsletter emails", dimensions: "600px width responsive", page: "Newsletter", status: "Implemented" },
  "in-content-1": { label: "In-Content Ad (After P1)", color: "bg-lime-50 text-lime-700 border-lime-150", location: "After first paragraph", dimensions: "7:1 aspect ratio (700x100)", page: "Article Pages", status: "Implemented" },
  "in-content-2": { label: "In-Content Ad (After P3)", color: "bg-emerald-50 text-emerald-700 border-emerald-150", location: "After third paragraph", dimensions: "7:1 aspect ratio (700x100)", page: "Article Pages", status: "Implemented" },
  "in-content-3": { label: "In-Content Ad (After P7)", color: "bg-cyan-50 text-cyan-700 border-cyan-150", location: "After seventh paragraph", dimensions: "7:1 aspect ratio (700x100)", page: "Article Pages", status: "Implemented" },
};

const allPossibleSlots: { id: string; label: string; description: string; implemented: boolean }[] = [];

export default function AdsDashboard() {
  const { data: session, status: sessionStatus } = useSession();
  const role = (session?.user as any)?.role;

  const [ads, setAds] = useState<Ad[]>([]);
  const [requests, setRequests] = useState<AdRequest[]>([]);
  const [packages, setPackages] = useState<AdPackage[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  // Campaign Modals / States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  
  // Form Inputs
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [slot, setSlot] = useState("homepage-banner");
  const [targetType, setTargetType] = useState("url"); // "url" | "phone" | "email"
  const [phoneVal, setPhoneVal] = useState("");
  const [emailVal, setEmailVal] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [htmlCode, setHtmlCode] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [submitting, setSubmitting] = useState(false);
  
  // Media Selector Modal
  const [isMediaOpen, setIsMediaOpen] = useState(false);

  // Package Form
  const [isPackageFormOpen, setIsPackageFormOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<AdPackage | null>(null);
  const [pkgTitle, setPkgTitle] = useState("");
  const [pkgDescription, setPkgDescription] = useState("");
  const [pkgPrice, setPkgPrice] = useState("");
  const [pkgPriceUnit, setPkgPriceUnit] = useState("/mo");
  const [pkgFeatures, setPkgFeatures] = useState("");
  const [pkgIsFeatured, setPkgIsFeatured] = useState(false);
  const [pkgSubmitting, setPkgSubmitting] = useState(false);

  useEffect(() => {
    if (role === "ADMIN") {
      fetchData();
    }
  }, [role]);

  if (sessionStatus === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 text-accent-500 animate-spin" />
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

  async function fetchData() {
    setLoading(true);
    try {
      const [adsRes, reqsRes, pkgsRes, revRes] = await Promise.all([
        fetch("/api/ads"),
        fetch("/api/ads/requests"),
        fetch("/api/ads/packages"),
        fetch("/api/ads/revenue")
      ]);
      const adsData = await adsRes.json();
      const reqsData = await reqsRes.json();
      const pkgsData = await pkgsRes.json();
      const revData = await revRes.json();
      
      setAds(Array.isArray(adsData) ? adsData : []);
      setRequests(Array.isArray(reqsData) ? reqsData : []);
      setPackages(Array.isArray(pkgsData) ? pkgsData : []);
      setRevenueData(revData);
    } catch (err) {
      console.error("Failed to load advertising data sets:", err);
    } finally {
      setLoading(false);
    }
  }

  // Open form with preset values for editing
  const handleEditClick = (ad: Ad) => {
    setEditingAd(ad);
    setTitle(ad.title);
    setCompanyName(ad.companyName);
    setSlot(ad.slot);
    setImageUrl(ad.imageUrl || "");
    
    // Parse link type
    const link = ad.linkUrl || "";
    if (link.startsWith("tel:")) {
      setTargetType("phone");
      setPhoneVal(link.replace("tel:", ""));
      setLinkUrl("");
      setEmailVal("");
    } else if (link.startsWith("mailto:")) {
      setTargetType("email");
      setEmailVal(link.replace("mailto:", ""));
      setLinkUrl("");
      setPhoneVal("");
    } else {
      setTargetType("url");
      setLinkUrl(link);
      setPhoneVal("");
      setEmailVal("");
    }
    
    setHtmlCode(ad.htmlCode || "");
    setStatus(ad.status);
    setIsFormOpen(true);
  };

  // Open form pre-filled from sponsor request conversion
  const handleApproveRequestClick = (req: AdRequest) => {
    setEditingAd(null);
    setTitle(`${req.brandName} Placement Campaign`);
    setCompanyName(req.brandName);
    
    // Guess slot type from tier selection
    if (req.tier.includes("Newsletter")) {
      setSlot("article-bottom");
    } else if (req.tier.includes("Editorial")) {
      setSlot("article-top");
    } else {
      setSlot("homepage-banner");
    }
    
    setTargetType("url");
    setLinkUrl("");
    setPhoneVal("");
    setEmailVal("");
    setImageUrl("");
    setHtmlCode("");
    setStatus("ACTIVE");
    setIsFormOpen(true);
  };

  // Submit dynamic campaign slot
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !companyName.trim() || !slot) return;
    setSubmitting(true);

    let calculatedLink = "";
    if (targetType === "url") {
      calculatedLink = linkUrl.trim();
    } else if (targetType === "phone") {
      calculatedLink = `tel:${phoneVal.trim()}`;
    } else if (targetType === "email") {
      calculatedLink = `mailto:${emailVal.trim()}`;
    }

    try {
      const url = editingAd ? `/api/ads/${editingAd.id}` : "/api/ads";
      const method = editingAd ? "PATCH" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          companyName: companyName.trim(),
          slot,
          imageUrl: imageUrl.trim() || null,
          linkUrl: calculatedLink || null,
          htmlCode: htmlCode.trim() || null,
          status
        })
      });

      if (!response.ok) throw new Error("Failed to save sponsorship placement");

      setIsFormOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      alert(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Campaign
  const handleDeleteAd = async (id: string) => {
    if (!confirm("Permanently remove this advertising campaign from your dashboard slots?")) return;
    try {
      const res = await fetch(`/api/ads/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Deletion failed");
      setAds((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Update Request status (e.g. Reject or Approve)
  const handleUpdateRequestStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/ads/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error("Failed to update status");
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: newStatus } : r));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Clear historical booking requests
  const handleDeleteRequest = async (id: string) => {
    if (!confirm("Delete this request history permanently?")) return;
    try {
      const res = await fetch(`/api/ads/requests/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Deletion failed");
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const resetForm = () => {
    setEditingAd(null);
    setTitle("");
    setCompanyName("");
    setSlot("homepage-banner");
    setTargetType("url");
    setLinkUrl("");
    setPhoneVal("");
    setEmailVal("");
    setImageUrl("");
    setHtmlCode("");
    setStatus("ACTIVE");
  };

  const resetPackageForm = () => {
    setEditingPackage(null);
    setPkgTitle("");
    setPkgDescription("");
    setPkgPrice("");
    setPkgPriceUnit("/mo");
    setPkgFeatures("");
    setPkgIsFeatured(false);
  };

  const handlePackageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgTitle.trim() || !pkgDescription.trim() || !pkgPrice) return;
    setPkgSubmitting(true);

    try {
      const features = pkgFeatures.split("\n").filter(f => f.trim());
      const url = editingPackage ? `/api/ads/packages/${editingPackage.id}` : "/api/ads/packages";
      const method = editingPackage ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pkgTitle.trim(),
          description: pkgDescription.trim(),
          price: pkgPrice,
          priceUnit: pkgPriceUnit,
          features,
          isFeatured: pkgIsFeatured,
        })
      });

      if (!res.ok) throw new Error("Failed to save package");

      setIsPackageFormOpen(false);
      resetPackageForm();
      fetchData();
    } catch (err: any) {
      alert(err.message || "Something went wrong.");
    } finally {
      setPkgSubmitting(false);
    }
  };

  const deletePackage = async (id: string) => {
    if (!confirm("Delete this package?")) return;
    try {
      const res = await fetch(`/api/ads/packages/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setPackages(packages.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Calculate aggregated analytics metrics
  const activeAdsCount = ads.filter((a) => a.status === "ACTIVE").length;
  const totalImpressions = ads.reduce((sum, a) => sum + (a.impressions || 0), 0);
  const totalClicks = ads.reduce((sum, a) => sum + (a.clicks || 0), 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-accent-600 mb-0.5">Sponsor Placements</p>
          <h1 className="text-2xl font-bold text-brand-900 tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-brand-900" />
            Ad Management Console
          </h1>
        </div>
        <button
          onClick={() => { resetForm(); setIsFormOpen(true); }}
          className="flex items-center justify-center gap-2 bg-brand-900 hover:bg-accent-600 text-white text-[10px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-lg transition-all shadow-md cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Sponsor Placement</span>
        </button>
      </div>

      {/* KPI metrics cards grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-brand-100/60 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[8px] font-bold uppercase tracking-widest text-brand-300">Active Slots</p>
            <p className="text-lg font-black text-brand-900 mt-0.5">{activeAdsCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-brand-100/60 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[8px] font-bold uppercase tracking-widest text-brand-300">Impressions</p>
            <p className="text-lg font-black text-brand-900 mt-0.5">{totalImpressions.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-brand-100/60 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center text-pink-600">
            <MousePointerClick className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[8px] font-bold uppercase tracking-widest text-brand-300">Total Clicks</p>
            <p className="text-lg font-black text-brand-900 mt-0.5">{totalClicks.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-brand-100/60 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[8px] font-bold uppercase tracking-widest text-brand-300">CTR Average</p>
            <p className="text-lg font-black text-brand-900 mt-0.5">{avgCtr}%</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 rounded-2xl shadow-lg flex items-center gap-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[8px] font-bold uppercase tracking-widest text-white/70">Total Revenue</p>
            <p className="text-xl font-black text-white mt-0.5">${revenueData?.totalRevenue?.toLocaleString() || "0"}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-brand-100/60 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[8px] font-bold uppercase tracking-widest text-brand-300">This Month</p>
            <p className="text-lg font-black text-brand-900 mt-0.5">${revenueData?.monthRevenue?.toLocaleString() || "0"}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-brand-100/60 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[8px] font-bold uppercase tracking-widest text-brand-300">Ad Packages</p>
            <p className="text-lg font-black text-brand-900 mt-0.5">{packages.length}</p>
          </div>
        </div>
      </div>

      {/* Ad Slots Overview */}
      <div className="bg-white rounded-2xl border border-brand-100/60 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-brand-50 flex items-center justify-between bg-brand-50/20">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-brand-900 flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-accent-600" />
            Ad Slots Overview - All Available Sections
          </h2>
          <span className="text-[8px] font-bold uppercase tracking-widest text-brand-300 px-2 py-0.5 bg-brand-100 rounded">
            {ads.filter(a => a.status === "ACTIVE").length} active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-50 bg-brand-50/10">
                <th className="px-4 py-3 text-left text-[8px] font-bold uppercase tracking-widest text-brand-400">Slot ID</th>
                <th className="px-4 py-3 text-left text-[8px] font-bold uppercase tracking-widest text-brand-400">Location</th>
                <th className="px-4 py-3 text-left text-[8px] font-bold uppercase tracking-widest text-brand-400">Page</th>
                <th className="px-4 py-3 text-left text-[8px] font-bold uppercase tracking-widest text-brand-400">Dimensions</th>
                <th className="px-4 py-3 text-center text-[8px] font-bold uppercase tracking-widest text-brand-400">Active Ads</th>
                <th className="px-4 py-3 text-center text-[8px] font-bold uppercase tracking-widest text-brand-400">Status</th>
                <th className="px-4 py-3 text-right text-[8px] font-bold uppercase tracking-widest text-brand-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {Object.entries(slotLabels).map(([key, config]) => {
                const slotAds = ads.filter(a => a.slot === key && a.status === "ACTIVE");
                return (
                  <tr key={key} className="hover:bg-brand-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-brand-900">{config.label}</span>
                      </div>
                      <span className="text-[9px] font-mono text-brand-400">{key}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] text-brand-600">{config.location}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[9px] font-bold text-brand-500 bg-brand-50 px-2 py-0.5 rounded">{config.page}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[9px] text-brand-500">{config.dimensions}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${slotAds.length > 0 ? "bg-emerald-50 text-emerald-700" : "bg-brand-100 text-brand-400"}`}>
                        {slotAds.length}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase">
                        {config.status === "Implemented" ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-600">Active</span>
                          </>
                        ) : (
                          <>
                            <Ban className="w-3 h-3 text-amber-500" />
                            <span className="text-amber-600">Coming Soon</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => { resetForm(); setSlot(key); setIsFormOpen(true); }}
                        className="text-[8px] font-bold uppercase text-accent-600 hover:text-brand-900 transition-colors cursor-pointer"
                      >
                        + Add Ad
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Possible Future Slots */}
        <div className="px-6 py-4 border-t border-brand-50 bg-brand-50/30">
          <h3 className="text-[9px] font-black uppercase tracking-widest text-brand-400 mb-3">Possible Future Ad Sections (Not Yet Implemented)</h3>
          <div className="flex flex-wrap gap-2">
            {allPossibleSlots.filter(s => !s.implemented).map((slot) => (
              <div key={slot.id} className="flex items-center gap-2 px-3 py-1.5 bg-brand-100 rounded-lg">
                <span className="text-[9px] font-bold text-brand-600">{slot.label}</span>
                <span className="text-[8px] text-brand-400">- {slot.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ad Packages Section */}
      <div className="bg-white rounded-2xl border border-brand-100/60 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-brand-50 flex items-center justify-between bg-brand-50/20">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-brand-900 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-accent-600" />
            Pricing Packages (Public /advertise Page)
          </h2>
          <button
            onClick={() => { resetPackageForm(); setIsPackageFormOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-900 hover:bg-accent-600 text-white text-[8px] font-bold uppercase tracking-widest rounded-lg transition-all cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            Add Package
          </button>
        </div>

        {packages.length === 0 ? (
          <div className="p-8 text-center text-brand-300 font-medium text-xs">
            No packages configured. Add pricing tiers to display on the public advertise page.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
            {packages.map((pkg) => {
              let features: string[] = [];
              try { features = JSON.parse(pkg.features); } catch { features = []; }
              return (
                <div key={pkg.id} className={`p-5 rounded-xl border-2 ${pkg.isFeatured ? "border-accent-500 bg-accent-50/30" : "border-brand-100"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xs font-black text-brand-900 uppercase">{pkg.title}</h3>
                      <p className="text-lg font-black text-accent-600 mt-1">${pkg.price}<span className="text-[10px] font-bold text-brand-400">{pkg.priceUnit}</span></p>
                    </div>
                    {pkg.isFeatured && (
                      <span className="text-[7px] font-black uppercase bg-accent-600 text-white px-2 py-0.5 rounded-full">Featured</span>
                    )}
                  </div>
                  <p className="text-[10px] text-brand-500 mb-3 line-clamp-2">{pkg.description}</p>
                  <ul className="space-y-1 mb-4">
                    {features.slice(0, 3).map((feat, i) => (
                      <li key={i} className="text-[9px] text-brand-600 flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-500" /> {feat}
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2 pt-3 border-t border-brand-100">
                    <button
                      onClick={() => { setEditingPackage(pkg); setIsPackageFormOpen(true); }}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-600 text-[8px] font-bold uppercase rounded transition-all cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => deletePackage(pkg.id)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-[8px] font-bold uppercase rounded transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Campaign table container */}
      <div className="bg-white rounded-2xl border border-brand-100/60 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-brand-50 flex items-center justify-between bg-brand-50/20">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-brand-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-accent-600" />
            Active Sponsorship Campaigns & Inventory Slots
          </h2>
          <span className="text-[8px] font-bold uppercase tracking-widest text-brand-300 px-2 py-0.5 bg-brand-100 rounded">
            {ads.length} campaigns
          </span>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-brand-50 bg-brand-50/10">
              <th className="px-6 py-3 text-left text-[8.5px] font-bold uppercase tracking-widest text-brand-400">Campaign / Sponsoring Partner</th>
              <th className="px-6 py-3 text-left text-[8.5px] font-bold uppercase tracking-widest text-brand-400">Inventory Placement Slot</th>
              <th className="px-6 py-3 text-center text-[8.5px] font-bold uppercase tracking-widest text-brand-400">Impressions</th>
              <th className="px-6 py-3 text-center text-[8.5px] font-bold uppercase tracking-widest text-brand-400">Clicks</th>
              <th className="px-6 py-3 text-center text-[8.5px] font-bold uppercase tracking-widest text-brand-400">CTR %</th>
              <th className="px-6 py-3 text-center text-[8.5px] font-bold uppercase tracking-widest text-brand-400">Status</th>
              <th className="px-6 py-3 text-right text-[8.5px] font-bold uppercase tracking-widest text-brand-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-50">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <Loader2 className="w-6 h-6 text-brand-300 animate-spin mx-auto" />
                </td>
              </tr>
            ) : ads.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-brand-300 font-medium text-xs">
                  No ad campaigns configured. Create a sponsor placement slot using the top actions button.
                </td>
              </tr>
            ) : (
              ads.map((ad) => {
                const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : "0.00";
                const slotConfig = slotLabels[ad.slot] || { label: ad.slot, color: "bg-brand-50 text-brand-700 border-brand-100" };

                return (
                  <tr key={ad.id} className="hover:bg-brand-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-xs font-bold text-brand-900">{ad.title}</p>
                        <p className="text-[10px] text-brand-400 font-medium mt-0.5">Sponsor: {ad.companyName}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide border ${slotConfig.color}`}>
                        {slotConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-[10px] font-bold text-brand-600">
                      {ad.impressions.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-[10px] font-bold text-brand-600">
                      {ad.clicks.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-[10px] font-bold text-brand-600">
                      {ctr}%
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-widest ${
                        ad.status === "ACTIVE" 
                          ? "bg-emerald-50 text-emerald-700" 
                          : ad.status === "PENDING"
                            ? "bg-yellow-50 text-yellow-700"
                            : "bg-red-50 text-red-700"
                      }`}>
                        {ad.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditClick(ad)}
                          className="p-1.5 text-brand-300 hover:text-brand-900 hover:bg-brand-50 rounded-lg transition-all"
                          title="Edit Campaign Settings"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAd(ad.id)}
                          className="p-1.5 text-brand-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Campaign"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Sponsor Partnerships Requests panel */}
      <div className="bg-white rounded-2xl border border-brand-100/60 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-brand-50 bg-brand-50/10">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-brand-900">
            Partnership Sponsorship Requests (From /advertise Portal)
          </h2>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-brand-50 bg-brand-50/5">
              <th className="px-6 py-3 text-left text-[8.5px] font-bold uppercase tracking-widest text-brand-400">Brand / Contact Email</th>
              <th className="px-6 py-3 text-left text-[8.5px] font-bold uppercase tracking-widest text-brand-400">Placement Tier Request</th>
              <th className="px-6 py-3 text-left text-[8.5px] font-bold uppercase tracking-widest text-brand-400">Inquiry Details Message</th>
              <th className="px-6 py-3 text-center text-[8.5px] font-bold uppercase tracking-widest text-brand-400">Status</th>
              <th className="px-6 py-3 text-right text-[8.5px] font-bold uppercase tracking-widest text-brand-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center">
                  <Loader2 className="w-5 h-5 text-brand-300 animate-spin mx-auto" />
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-brand-300 font-medium text-xs">
                  No partnership inquiries submitted yet.
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id} className="hover:bg-brand-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-xs font-bold text-brand-900">{req.brandName}</p>
                      <a href={`mailto:${req.email}`} className="text-[9px] font-mono text-accent-600 hover:underline mt-0.5 flex items-center gap-0.5">
                        {req.email} <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold bg-brand-100 text-brand-800 uppercase tracking-wide">
                      {req.tier}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[10px] text-brand-500 font-medium leading-relaxed max-w-sm line-clamp-2" title={req.message}>
                      {req.message}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-widest ${
                      req.status === "PENDING" 
                        ? "bg-yellow-50 text-yellow-700" 
                        : req.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {req.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => {
                              handleApproveRequestClick(req);
                              handleUpdateRequestStatus(req.id, "APPROVED");
                            }}
                            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all flex items-center gap-1 text-[8px] font-extrabold uppercase tracking-widest"
                            title="Approve Inquiry & Create Ad"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleUpdateRequestStatus(req.id, "REJECTED")}
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                            title="Reject Inquiry"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteRequest(req.id)}
                        className="p-1.5 text-brand-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Request History"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE / EDIT SLIDE FORM OVERLAY */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end p-4">
          <div className="absolute inset-0 bg-brand-950/40 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
          
          <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl border border-brand-100 max-w-lg w-full z-10 animate-slide-in h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-brand-50 flex items-center justify-between bg-brand-50/50">
              <h3 className="text-xs font-black uppercase tracking-widest text-brand-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent-600" />
                {editingAd ? "Modify Campaign Settings" : "Configure Placement Campaign"}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="w-6 h-6 rounded-full hover:bg-brand-100 flex items-center justify-center text-brand-400 hover:text-brand-900 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 flex-1 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Campaign Name */}
                <div className="space-y-1">
                  <label className="text-[7.5px] font-bold text-brand-450 uppercase tracking-widest block">Campaign Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cloud Summer Promo"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-[10px] font-bold text-brand-700 bg-white rounded-lg px-3 py-2 border border-brand-100 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all"
                  />
                </div>

                {/* Company Name */}
                <div className="space-y-1">
                  <label className="text-[7.5px] font-bold text-brand-450 uppercase tracking-widest block">Sponsoring Brand</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Tech"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full text-[10px] font-bold text-brand-700 bg-white rounded-lg px-3 py-2 border border-brand-100 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all"
                  />
                </div>
              </div>

              {/* Slot Target selection */}
              <div className="space-y-1">
                <label className="text-[7.5px] font-bold text-brand-450 uppercase tracking-widest block">Inventory Slot Allocation</label>
                <select
                  value={slot}
                  onChange={(e) => setSlot(e.target.value)}
                  className="w-full text-[10px] font-bold text-brand-700 bg-white rounded-lg px-3 py-2 border border-brand-100 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all"
                >
                  {Object.entries(slotLabels).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label} ({config.dimensions})
                    </option>
                  ))}
                </select>
              </div>

              {/* Banner Upload / Select from Media Library */}
              <div className="space-y-1.5">
                <label className="text-[7.5px] font-bold text-brand-450 uppercase tracking-widest block">Graphic Creative Asset</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://alifxperience.com/uploads/creative.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 text-[10px] font-mono text-brand-500 bg-brand-50 rounded-lg px-3 py-2 border border-brand-100 focus:outline-none focus:ring-2 focus:ring-accent-400/20"
                  />
                  <button
                    type="button"
                    onClick={() => setIsMediaOpen(true)}
                    className="flex items-center gap-1.5 px-3 bg-brand-900 hover:bg-accent-600 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Media Library</span>
                  </button>
                </div>
              </div>

              {/* Campaign Target Type Selector */}
              <div className="space-y-1">
                <label className="text-[7.5px] font-bold text-brand-450 uppercase tracking-widest block">Campaign Target Type</label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  className="w-full text-[10px] font-bold text-brand-700 bg-white rounded-lg px-3 py-2 border border-brand-100 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all"
                >
                  <option value="url">Website URL (External Redirect)</option>
                  <option value="phone">Phone Call (Direct Dial)</option>
                  <option value="email">Email Address (Direct Mail)</option>
                </select>
              </div>

              {/* Conditional Inputs based on Target Type */}
              {targetType === "url" && (
                <div className="space-y-1">
                  <label className="text-[7.5px] font-bold text-brand-450 uppercase tracking-widest block">Target Redirect Link</label>
                  <input
                    type="text"
                    placeholder="https://brand.com/summer-sale?ref=alifx"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="w-full text-[10px] font-mono text-brand-500 bg-white rounded-lg px-3 py-2 border border-brand-100 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all"
                  />
                </div>
              )}

              {targetType === "phone" && (
                <div className="space-y-1">
                  <label className="text-[7.5px] font-bold text-brand-450 uppercase tracking-widest block">Target Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-3.5 h-3.5 text-brand-400" />
                    <input
                      type="tel"
                      placeholder="e.g. +1 (555) 019-2834"
                      value={phoneVal}
                      onChange={(e) => setPhoneVal(e.target.value)}
                      className="w-full text-[10px] font-mono text-brand-500 bg-white rounded-lg pl-9 pr-3 py-2 border border-brand-100 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all"
                    />
                  </div>
                </div>
              )}

              {targetType === "email" && (
                <div className="space-y-1">
                  <label className="text-[7.5px] font-bold text-brand-450 uppercase tracking-widest block">Target Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-brand-400" />
                    <input
                      type="email"
                      placeholder="e.g. sponsor@acme.com"
                      value={emailVal}
                      onChange={(e) => setEmailVal(e.target.value)}
                      className="w-full text-[10px] font-mono text-brand-500 bg-white rounded-lg pl-9 pr-3 py-2 border border-brand-100 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Textarea for custom HTML block */}
              <div className="space-y-1">
                <label className="text-[7.5px] font-bold text-brand-450 uppercase tracking-widest block">Custom Scripts / Ad HTML Snippet (Takes Precedence)</label>
                <textarea
                  rows={4}
                  placeholder='<ins className="adsbygoogle" style={{ display: "block" }} data-ad-client="ca-pub-xxx" ...></ins>'
                  value={htmlCode}
                  onChange={(e) => setHtmlCode(e.target.value)}
                  className="w-full text-[10px] font-mono text-brand-500 bg-white rounded-lg px-3 py-2 border border-brand-100 focus:outline-none focus:ring-2 focus:ring-accent-400/20 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Status selector */}
                <div className="space-y-1">
                  <label className="text-[7.5px] font-bold text-brand-450 uppercase tracking-widest block">Status State</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full text-[10px] font-bold text-brand-700 bg-white rounded-lg px-3 py-2 border border-brand-100 focus:outline-none"
                  >
                    <option value="ACTIVE">ACTIVE (Running & displaying to public)</option>
                    <option value="PENDING">PENDING (Saved placement holding trigger)</option>
                    <option value="EXPIRED">EXPIRED (Deactivated / Campaign over)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-brand-50 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-brand-50 hover:bg-brand-100 text-brand-900 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-brand-900 hover:bg-accent-600 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Placement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Package Form Modal */}
      {isPackageFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-950/40 backdrop-blur-sm" onClick={() => setIsPackageFormOpen(false)} />
          <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl border border-brand-100 max-w-lg w-full z-10">
            <div className="px-6 py-4 border-b border-brand-50 flex items-center justify-between bg-brand-50/50">
              <h3 className="text-xs font-black uppercase tracking-widest text-brand-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-accent-600" />
                {editingPackage ? "Edit Package" : "Create Package"}
              </h3>
              <button onClick={() => setIsPackageFormOpen(false)} className="w-6 h-6 rounded-full hover:bg-brand-100 flex items-center justify-center text-brand-400 hover:text-brand-900 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePackageSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[7.5px] font-bold text-brand-450 uppercase tracking-widest block">Package Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Standard Banner"
                    value={pkgTitle}
                    onChange={(e) => setPkgTitle(e.target.value)}
                    className="w-full text-[10px] font-bold text-brand-700 bg-white rounded-lg px-3 py-2 border border-brand-100 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[7.5px] font-bold text-brand-450 uppercase tracking-widest block">Price</label>
                  <input
                    type="number"
                    required
                    placeholder="199"
                    value={pkgPrice}
                    onChange={(e) => setPkgPrice(e.target.value)}
                    className="w-full text-[10px] font-bold text-brand-700 bg-white rounded-lg px-3 py-2 border border-brand-100 focus:outline-none focus:ring-2 focus:ring-accent-400/20 focus:border-accent-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[7.5px] font-bold text-brand-450 uppercase tracking-widest block">Description</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Brief description of the package..."
                  value={pkgDescription}
                  onChange={(e) => setPkgDescription(e.target.value)}
                  className="w-full text-[10px] font-medium text-brand-700 bg-white rounded-lg px-3 py-2 border border-brand-100 focus:outline-none focus:ring-2 focus:ring-accent-400/20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[7.5px] font-bold text-brand-450 uppercase tracking-widest block">Price Unit</label>
                  <select
                    value={pkgPriceUnit}
                    onChange={(e) => setPkgPriceUnit(e.target.value)}
                    className="w-full text-[10px] font-bold text-brand-700 bg-white rounded-lg px-3 py-2 border border-brand-100 focus:outline-none"
                  >
                    <option value="/mo">per month</option>
                    <option value="/art">per article</option>
                    <option value="/blast">per blast</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={pkgIsFeatured}
                    onChange={(e) => setPkgIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded border-brand-200 text-accent-600 focus:ring-accent-400"
                  />
                  <label htmlFor="isFeatured" className="text-[10px] font-bold text-brand-700">Mark as Featured</label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[7.5px] font-bold text-brand-450 uppercase tracking-widest block">Features (one per line)</label>
                <textarea
                  rows={3}
                  placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                  value={pkgFeatures}
                  onChange={(e) => setPkgFeatures(e.target.value)}
                  className="w-full text-[10px] font-medium text-brand-700 bg-white rounded-lg px-3 py-2 border border-brand-100 focus:outline-none focus:ring-2 focus:ring-accent-400/20 resize-none"
                />
              </div>

              <div className="pt-4 border-t border-brand-50 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPackageFormOpen(false)}
                  className="px-4 py-2 bg-brand-50 hover:bg-brand-100 text-brand-900 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pkgSubmitting}
                  className="px-5 py-2.5 bg-brand-900 hover:bg-accent-600 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {pkgSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{editingPackage ? "Update" : "Create"} Package</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WordPress Media Library selector integration */}
      {isMediaOpen && (
        <MediaSelectorModal
          isOpen={isMediaOpen}
          onClose={() => setIsMediaOpen(false)}
          onSelect={(media) => {
            setImageUrl(media.url);
            setIsMediaOpen(false);
          }}
        />
      )}
    </div>
  );
}
