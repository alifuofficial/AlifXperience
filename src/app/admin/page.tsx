"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  FileText,
  Users,
  Eye,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Plus,
  Pencil,
  Loader2,
  Settings as SettingsIcon,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Sparkles,
  Zap,
  Activity,
  BarChart3,
} from "lucide-react";

interface DBData {
  totalPosts: number;
  totalUsers: number;
  totalComments: number;
  categories: { label: string; value: number }[];
  recentPosts: any[];
  recentUsers: any[];
  activityFeed: any[];
  postsSpark?: number[];
  usersSpark?: number[];
  commentsSpark?: number[];
  revenueSpark?: number[];
  postsChange?: { percent: number; trend: "up" | "down"; text: string };
  usersChange?: { percent: number; trend: "up" | "down"; text: string };
  commentsChange?: { percent: number; trend: "up" | "down"; text: string };
  revenueChange?: { percent: number; trend: "up" | "down"; text: string };
}

interface GAData {
  totalViews: number;
  changePercent: number;
  trend: "up" | "down";
  weeklyViews: number[];
  weekLabels: string[];
  isMock: boolean;
  googleAnalyticsId?: string;
}

interface RevenueData {
  totalRevenue: number;
  monthRevenue: number;
}

const COLORS = ["#2563eb", "#7c3aed", "#059669", "#d97706", "#6366f1"];

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
}

function timeAgo(dateString: string): string {
  try {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return interval + "y ago";
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval + "mo ago";
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval + "d ago";
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + "h ago";
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval + "m ago";
    return "just now";
  } catch {
    return "recently";
  }
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const w = 64;
  const h = 28;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1 || 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * h;
    return `${x},${y}`;
  });
  const poly = pts.join(" ");
  const area = `${poly} L${w},${h} L0,${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#spark-${color.replace("#", "")})`} />
      <polyline points={poly} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AreaChart({ weeklyData, weekLabels }: { weeklyData: number[]; weekLabels: string[] }) {
  const max = Math.max(...weeklyData, 1);
  const w = 500;
  const h = 130;
  const pad = { t: 10, b: 28, l: 15, r: 15 };

  const pts = weeklyData.map((v, i) => {
    const x = pad.l + (i / (weeklyData.length - 1 || 1)) * (w - pad.l - pad.r);
    const y = pad.t + ((max - v) / max) * (h - pad.t - pad.b);
    return [x, y];
  });

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  const areaPath = `${linePath} L${pts[pts.length - 1][0]},${h - pad.b} L${pts[0][0]},${h - pad.b} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#areaGrad)" />
      <path d={linePath} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="white" stroke="#2563eb" strokeWidth="2" />
      ))}
      {weekLabels.map((label, i) => {
        const x = pad.l + (i / (weekLabels.length - 1 || 1)) * (w - pad.l - pad.r);
        return (
          <text key={i} x={x} y={h - 6} textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="Inter, sans-serif" fontWeight="600">
            {label}
          </text>
        );
      })}
    </svg>
  );
}

function DonutChart({ categories }: { categories: { label: string; value: number }[] }) {
  const total = categories.reduce((s, c) => s + c.value, 0);
  let cumulative = 0;
  const r = 48;
  const cx = 56;
  const cy = 56;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <svg width="112" height="112" viewBox="0 0 112 112" className="flex-shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="12" />
        {categories.map((cat, i) => {
          const pct = cat.value / (total || 1);
          const offset = circumference * (1 - cumulative / (total || 1));
          const dash = circumference * pct;
          const segment = (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none" stroke={COLORS[i % COLORS.length]}
              strokeWidth="12"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              strokeLinecap="round"
            />
          );
          cumulative += cat.value;
          return segment;
        })}
        <text x={cx} y={cy - 1} textAnchor="middle" fontSize="14" fontWeight="700" fill="#0f172a" fontFamily="Inter, sans-serif">
          {categories.length}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="7" fontWeight="600" fill="#64748b" fontFamily="Inter, sans-serif" letterSpacing="1">
          TOPICS
        </text>
      </svg>
      <div className="space-y-1.5 flex-1 min-w-0">
        {(categories.length > 0 ? categories : [{ label: "No Posts", value: 100 }]).map((cat, i) => {
          const pct = total > 0 ? Math.round((cat.value / total) * 100) : 0;
          return (
            <div key={cat.label} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: categories.length > 0 ? COLORS[i % COLORS.length] : "#e2e8f0" }} />
              <span className="text-[11px] font-medium text-slate-600 truncate">{cat.label}</span>
              <span className="ml-auto text-[11px] font-bold text-slate-800">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const name = session?.user?.name || "Author";
  const role = (session?.user as any)?.role || "USER";
  const isAdmin = role === "ADMIN";

  const [activeTab, setActiveTab] = useState<"posts" | "users">("posts");
  const [dbData, setDbData] = useState<DBData | null>(null);
  const [gaData, setGaData] = useState<GAData | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [dbRes, gaRes, revRes] = await Promise.all([
          fetch("/api/analytics/overview"),
          fetch("/api/analytics/ga"),
          fetch("/api/ads/revenue"),
        ]);

        if (dbRes.ok) setDbData(await dbRes.json());
        else setDbData({
          totalPosts: 0, totalUsers: 0, totalComments: 0, categories: [],
          recentPosts: [], recentUsers: [], activityFeed: [],
          postsSpark: [0, 0, 0, 0, 0, 0, 0], usersSpark: [0, 0, 0, 0, 0, 0, 0],
          commentsSpark: [0, 0, 0, 0, 0, 0, 0], revenueSpark: [0, 0, 0, 0, 0, 0, 0],
        });

        if (gaRes.ok) setGaData(await gaRes.json());
        else setGaData({
          totalViews: 0, changePercent: 0, trend: "up",
          weeklyViews: [0, 0, 0, 0, 0, 0, 0],
          weekLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], isMock: true,
        });

        if (revRes.ok) setRevenueData(await revRes.json());
        else setRevenueData({ totalRevenue: 0, monthRevenue: 0 });
      } catch {
        setDbData({
          totalPosts: 0, totalUsers: 0, totalComments: 0, categories: [],
          recentPosts: [], recentUsers: [], activityFeed: [],
          postsSpark: [0, 0, 0, 0, 0, 0, 0], usersSpark: [0, 0, 0, 0, 0, 0, 0],
          commentsSpark: [0, 0, 0, 0, 0, 0, 0], revenueSpark: [0, 0, 0, 0, 0, 0, 0],
        });
        setGaData({
          totalViews: 0, changePercent: 0, trend: "up",
          weeklyViews: [0, 0, 0, 0, 0, 0, 0],
          weekLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], isMock: true,
        });
        setRevenueData({ totalRevenue: 0, monthRevenue: 0 });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading || !dbData || !gaData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <div className="relative">
          <Loader2 className="w-10 h-10 text-accent-500 animate-spin" />
          <div className="absolute inset-0 w-10 h-10 rounded-full border-4 border-accent-500/20 animate-ping" />
        </div>
        <p className="text-sm font-bold uppercase tracking-widest text-brand-400">Loading Dashboard</p>
      </div>
    );
  }

  const kpis = [
    {
      label: isAdmin ? "Total Posts" : "My Posts",
      value: dbData.totalPosts,
      spark: dbData.postsSpark || [10, 15, 20, 22, dbData.totalPosts],
      change: dbData.postsChange ? dbData.postsChange.text : `+${dbData.recentPosts.length}`,
      trend: dbData.postsChange ? dbData.postsChange.trend : "up",
      icon: FileText, iconBg: "bg-blue-500/10", iconColor: "text-blue-500",
      gradient: "from-blue-500/5 to-transparent",
    },
    {
      label: "Registered Users",
      value: dbData.totalUsers,
      spark: dbData.usersSpark || [2, 5, 8, 12, dbData.totalUsers],
      change: dbData.usersChange ? dbData.usersChange.text : `+${dbData.recentUsers.length}`,
      trend: dbData.usersChange ? dbData.usersChange.trend : "up",
      icon: Users, iconBg: "bg-violet-500/10", iconColor: "text-violet-500",
      gradient: "from-violet-500/5 to-transparent",
    },
    {
      label: isAdmin ? "Page Views" : "My Post Views",
      value: gaData.totalViews,
      spark: gaData.weeklyViews,
      change: `${gaData.trend === "up" ? "+" : "-"}${gaData.changePercent}%`,
      trend: gaData.trend,
      icon: Eye, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-500",
      gradient: "from-emerald-500/5 to-transparent",
      isMock: gaData.isMock,
    },
    {
      label: "Comments",
      value: dbData.totalComments,
      spark: dbData.commentsSpark || [5, 12, 10, 18, dbData.totalComments],
      change: dbData.commentsChange ? dbData.commentsChange.text : `+${dbData.totalComments}`,
      trend: dbData.commentsChange ? dbData.commentsChange.trend : "up",
      icon: MessageSquare, iconBg: "bg-amber-500/10", iconColor: "text-amber-500",
      gradient: "from-amber-500/5 to-transparent",
    },
    {
      label: "Ad Revenue",
      value: revenueData?.totalRevenue || 0,
      spark: dbData.revenueSpark || [100, 150, 200, revenueData?.totalRevenue || 250],
      change: dbData.revenueChange ? dbData.revenueChange.text : `+$${revenueData?.monthRevenue || 0}`,
      trend: dbData.revenueChange ? dbData.revenueChange.trend : "up",
      icon: DollarSign, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-500",
      gradient: "from-emerald-500/5 to-transparent",
    },
  ];

  const filteredKPIs = kpis.filter((kpi) => {
    if (!isAdmin && (kpi.label === "Registered Users" || kpi.label === "Ad Revenue")) return false;
    return true;
  });

  const tabs = isAdmin ? (["posts", "users"] as const) : (["posts"] as const);

  const quickActions = isAdmin
    ? [
        { label: "New Post", href: "/admin/posts/new", desc: "Create and publish content", icon: Plus, primary: true },
        { label: "Manage Categories", href: "/admin/categories", desc: "Organize your topics", icon: BarChart3, primary: false },
        { label: "Ad Management", href: "/admin/ads", desc: "Sponsorships & revenue", icon: DollarSign, primary: false },
        { label: "Settings", href: "/admin/settings", desc: "Site configuration", icon: SettingsIcon, primary: false },
      ]
    : [
        { label: "New Post", href: "/admin/posts/new", desc: "Create and publish content", icon: Plus, primary: true },
        { label: "My Posts", href: "/admin/posts", desc: "View your articles", icon: FileText, primary: false },
      ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">

      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent-50 border border-accent-100 rounded-full text-[9px] font-bold uppercase tracking-widest text-accent-600">
              <Zap className="w-3 h-3" />
              Dashboard
            </span>
            <span className="w-1 h-1 rounded-full bg-brand-600" />
            <span className="text-[9px] font-semibold text-brand-500 uppercase tracking-wider">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span>
          </div>
          <h1 className="text-3xl font-black text-brand-900 tracking-tight">
            {greeting}, {name.split(" ")[0]} <span className="text-accent-600">.</span>
          </h1>
          <p className="text-brand-500 text-sm mt-1 font-medium">Here&apos;s your platform performance snapshot.</p>
        </div>
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center gap-2.5 bg-accent-600 hover:bg-accent-500 text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xl transition-all shadow-lg shadow-accent-600/20"
        >
          <Plus className="w-4 h-4" />
          New Post
        </Link>
      </div>

      {/* ─── Alerts ─── */}
      {isAdmin && gaData.isMock && !gaData.googleAnalyticsId && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Demo Mode</p>
              <p className="text-xs text-amber-700 font-medium mt-0.5">Page Views show mock data. Connect Google Analytics in Settings for live reporting.</p>
            </div>
          </div>
          <Link href="/admin/settings" className="flex items-center gap-1.5 px-4 py-2 bg-amber-100 hover:bg-amber-200/80 border border-amber-200/50 text-amber-800 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all flex-shrink-0">
            <SettingsIcon className="w-3.5 h-3.5" /> Setup API
          </Link>
        </div>
      )}

      {isAdmin && !gaData.isMock && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Google Analytics Live — real-time page views active</p>
        </div>
      )}

      {/* ─── KPI Cards ─── */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin ? "lg:grid-cols-3 xl:grid-cols-5" : "lg:grid-cols-3"} gap-4`}>
        {filteredKPIs.map((s, idx) => (
          <div
            key={s.label}
            className="group relative bg-white border border-brand-100/60 rounded-2xl p-5 hover:border-brand-200/60 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            {/* Gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 ${s.iconBg} rounded-xl`}>
                  <s.icon className={`w-5 h-5 ${s.iconColor}`} />
                </div>
                <Sparkline data={s.spark} color={s.trend === "up" ? "#10b981" : "#f59e0b"} />
              </div>

              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-2xl font-black text-brand-900 tracking-tight">{typeof s.value === "number" ? formatNumber(s.value) : s.value}</span>
                <span className={`flex items-center gap-0.5 text-[10px] font-bold ${s.trend === "up" ? "text-emerald-600" : "text-amber-600"}`}>
                  {s.trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {s.change}
                </span>
              </div>
              <p className="text-[10px] font-semibold text-brand-500 uppercase tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Charts Row ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="md:col-span-2 lg:col-span-2 bg-white border border-brand-100/60 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-sm font-black text-brand-900 uppercase tracking-wider">Page Views</h2>
                <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  gaData.isMock ? "text-amber-700 bg-amber-50 border-amber-200/60" : "text-emerald-700 bg-emerald-50 border-emerald-200/60"
                }`}>
                  {gaData.isMock ? "Demo" : "Live"}
                </span>
              </div>
              <p className="text-[10px] font-medium text-brand-500 mt-1">Last 7 days</p>
            </div>
            <div className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-xl ${
              gaData.trend === "up" ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50"
            }`}>
              {gaData.trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {gaData.trend === "up" ? "+" : "-"}{gaData.changePercent}%
            </div>
          </div>
          <div className="h-[140px] w-full">
            <AreaChart weeklyData={gaData.weeklyViews} weekLabels={gaData.weekLabels} />
          </div>
        </div>

        <div className="bg-white border border-brand-100/60 rounded-2xl p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-sm font-black text-brand-900 uppercase tracking-wider">Categories</h2>
            <p className="text-[10px] font-medium text-brand-500 mt-1">Post distribution</p>
          </div>
          <DonutChart categories={dbData.categories} />
        </div>
      </div>

      {/* ─── Tables + Activity ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="md:col-span-2 lg:col-span-2 bg-white border border-brand-100/60 rounded-2xl overflow-hidden shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 pt-5 pb-0 gap-2">
            <div className="flex gap-6">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-[10px] font-bold uppercase tracking-widest pb-4 border-b-2 transition-colors cursor-pointer ${
                    activeTab === tab
                      ? "border-accent-600 text-accent-600"
                      : "border-transparent text-brand-400 hover:text-brand-900"
                  }`}
                >
                  {tab === "posts" ? "Recent Posts" : "New Users"}
                </button>
              ))}
            </div>
            <Link href={activeTab === "posts" ? "/admin/posts" : "/admin/users"} className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-brand-500 hover:text-accent-600 transition-colors pb-4">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {activeTab === "posts" ? (
            <div className="overflow-x-auto divide-y divide-brand-50">
              {dbData.recentPosts.length === 0 ? (
                <div className="p-8 text-center text-xs text-brand-400 font-medium">No posts yet.</div>
              ) : dbData.recentPosts.slice(0, 5).map((post, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-3.5 hover:bg-brand-50/50 transition-colors group">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-brand-900 truncate">{post.title}</p>
                    <p className="text-[10px] font-medium text-brand-500 mt-0.5">
                      {post.category?.name || "Uncategorized"} · {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${
                      post.published ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-brand-50 text-brand-600 border border-brand-100"
                    }`}>
                      {post.published ? "Published" : "Draft"}
                    </span>
                    <Link href={`/admin/posts/${post.id}/edit`} className="p-1.5 text-brand-400 hover:text-accent-600 transition-colors opacity-0 group-hover:opacity-100">
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto divide-y divide-brand-50">
              {dbData.recentUsers.length === 0 ? (
                <div className="p-8 text-center text-xs text-brand-400 font-medium">No users yet.</div>
              ) : dbData.recentUsers.slice(0, 5).map((user, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-3.5 hover:bg-brand-50/50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-50 to-violet-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-accent-600 text-xs font-bold">{(user.name ?? user.email)[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-brand-900 truncate">{user.name ?? "—"}</p>
                    <p className="text-[10px] font-medium text-brand-500 mt-0.5">{user.email}</p>
                  </div>
                  <span className="text-[9px] text-brand-600 px-2.5 py-0.5 bg-brand-50 rounded-full font-semibold uppercase tracking-wider">{user.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white border border-brand-100/60 rounded-2xl p-5 shadow-sm">
            <h2 className="text-[10px] font-black text-brand-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-accent-600" />
              Quick Actions
            </h2>
            <div className="space-y-2">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                    action.primary
                      ? "bg-accent-600 hover:bg-accent-500 text-white shadow-lg shadow-accent-600/20"
                      : "bg-brand-50 hover:bg-brand-100/80 text-brand-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <action.icon className="w-3.5 h-3.5" />
                    <span>{action.label}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white border border-brand-100/60 rounded-2xl p-5 shadow-sm">
            <h2 className="text-[10px] font-black text-brand-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-accent-600" />
              Recent Activity
            </h2>
            <div className="space-y-3.5">
              {dbData.activityFeed.length === 0 ? (
                <div className="text-center text-xs text-brand-400 font-medium py-4">No recent activity</div>
              ) : dbData.activityFeed.slice(0, 6).map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${item.dot || "bg-accent-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-brand-600 font-medium leading-relaxed">
                      {item.action} <span className="font-bold text-brand-900">{item.target}</span>
                    </p>
                    <p className="text-[9px] font-semibold text-brand-400 uppercase tracking-wider mt-0.5">{timeAgo(item.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
