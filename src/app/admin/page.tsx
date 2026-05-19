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
  Trash2,
  Loader2,
  Settings as SettingsIcon,
  AlertCircle,
  CheckCircle,
  DollarSign,
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
}

interface RevenueData {
  totalRevenue: number;
  monthRevenue: number;
}

// ─── Inline SVG Area Chart ─────────────────────────────────────────────────────
function AreaChart({ weeklyData, weekLabels }: { weeklyData: number[]; weekLabels: string[] }) {
  const max = Math.max(...weeklyData, 1);
  const w = 500;
  const h = 120;
  const pad = { t: 10, b: 24, l: 15, r: 15 };

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
          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#areaGrad)" />
      <path d={linePath} fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill="white" stroke="#4f46e5" strokeWidth="2" />
      ))}
      {weekLabels.map((label, i) => {
        const x = pad.l + (i / (weekLabels.length - 1 || 1)) * (w - pad.l - pad.r);
        return (
          <text key={i} x={x} y={h - 4} textAnchor="middle" fontSize="10" fill="#64748b" fontFamily="Inter, sans-serif" fontWeight="500">
            {label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Inline SVG Donut Chart ────────────────────────────────────────────────────
const COLORS = ["#4f46e5", "#8b5cf6", "#10b981", "#f59e0b", "#64748b"];

function DonutChart({ categories }: { categories: { label: string; value: number }[] }) {
  const total = categories.reduce((s, c) => s + c.value, 0);
  let cumulative = 0;
  const r = 52;
  const cx = 64;
  const cy = 64;
  const circumference = 2 * Math.PI * r;

  const displayCategories = categories.length > 0 
    ? categories 
    : [{ label: "No Posts", value: 100 }];

  return (
    <div className="flex items-center gap-6">
      <svg width="128" height="128" viewBox="0 0 128 128" className="flex-shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="14" />
        {categories.map((cat, i) => {
          const pct = cat.value / (total || 1);
          const offset = circumference * (1 - cumulative / (total || 1));
          const dash = circumference * pct;
          const segment = (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={COLORS[i % COLORS.length]}
              strokeWidth="14"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              strokeLinecap="round"
            />
          );
          cumulative += cat.value;
          return segment;
        })}
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize="16" fontWeight="600" fill="#0f172a" fontFamily="Inter, sans-serif">
          {categories.length}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8" fontWeight="500" fill="#64748b" fontFamily="Inter, sans-serif" letterSpacing="1">
          TOP TOPICS
        </text>
      </svg>
      <div className="space-y-2 flex-1">
        {displayCategories.map((cat, i) => (
          <div key={cat.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: categories.length > 0 ? COLORS[i % COLORS.length] : "#e2e8f0" }} />
            <span className="text-xs font-medium text-slate-600 truncate max-w-[120px]">{cat.label}</span>
            <span className="ml-auto text-xs font-semibold text-slate-900">{cat.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Mini Sparkline ────────────────────────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const w = 60;
  const h = 24;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1 || 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * h;
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: boolean }) {
  return status ? (
    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-100">
      Published
    </span>
  ) : (
    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium tracking-wide bg-slate-50 text-slate-500 border border-slate-100">
      Draft
    </span>
  );
}

// Helper to format large numbers
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k";
  }
  return num.toString();
}

// Helper to calculate time ago from string
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

// ─── Main Dashboard ────────────────────────────────────────────────────────────
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
        
        if (dbRes.ok) {
          setDbData(await dbRes.json());
        } else {
          console.error("Overview stats fetch failed:", dbRes.status);
          setDbData({
            totalPosts: 0,
            totalUsers: 0,
            totalComments: 0,
            categories: [],
            recentPosts: [],
            recentUsers: [],
            activityFeed: [],
            postsSpark: [0, 0, 0, 0, 0, 0, 0],
            usersSpark: [0, 0, 0, 0, 0, 0, 0],
            commentsSpark: [0, 0, 0, 0, 0, 0, 0],
            revenueSpark: [0, 0, 0, 0, 0, 0, 0],
          });
        }

        if (gaRes.ok) {
          setGaData(await gaRes.json());
        } else {
          console.error("GA stats fetch failed:", gaRes.status);
          setGaData({
            totalViews: 0,
            changePercent: 0,
            trend: "up",
            weeklyViews: [0, 0, 0, 0, 0, 0, 0],
            weekLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            isMock: true,
          });
        }

        if (revRes.ok) {
          setRevenueData(await revRes.json());
        } else {
          console.error("Revenue stats fetch failed:", revRes.status);
          setRevenueData({
            totalRevenue: 0,
            monthRevenue: 0,
          });
        }
      } catch (error) {
        console.error("Dashboard fetch error", error);
        setDbData({
          totalPosts: 0,
          totalUsers: 0,
          totalComments: 0,
          categories: [],
          recentPosts: [],
          recentUsers: [],
          activityFeed: [],
          postsSpark: [0, 0, 0, 0, 0, 0, 0],
          usersSpark: [0, 0, 0, 0, 0, 0, 0],
          commentsSpark: [0, 0, 0, 0, 0, 0, 0],
          revenueSpark: [0, 0, 0, 0, 0, 0, 0],
        });
        setGaData({
          totalViews: 0,
          changePercent: 0,
          trend: "up",
          weeklyViews: [0, 0, 0, 0, 0, 0, 0],
          weekLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          isMock: true,
        });
        setRevenueData({
          totalRevenue: 0,
          monthRevenue: 0,
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading || !dbData || !gaData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] py-12 space-y-4">
        <Loader2 className="w-8 h-8 text-accent-600 animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest text-brand-400">Loading Dashboard Metrics...</p>
      </div>
    );
  }

  const kpis = [
    {
      label: isAdmin ? "Total Posts" : "My Posts",
      value: dbData.totalPosts,
      spark: dbData.postsSpark || [10, 15, 20, 22, dbData.totalPosts],
      change: dbData.postsChange ? dbData.postsChange.text : `+${dbData.recentPosts.length}`,
      period: dbData.postsChange ? "this week" : "recent",
      trend: dbData.postsChange ? dbData.postsChange.trend : "up",
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Registered Users",
      value: dbData.totalUsers,
      spark: dbData.usersSpark || [2, 5, 8, 12, dbData.totalUsers],
      change: dbData.usersChange ? dbData.usersChange.text : `+${dbData.recentUsers.length}`,
      period: dbData.usersChange ? "this week" : "recent",
      trend: dbData.usersChange ? dbData.usersChange.trend : "up",
      icon: Users,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: isAdmin ? "Page Views" : "My Post Views",
      value: gaData.totalViews,
      spark: gaData.weeklyViews,
      change: `${gaData.trend === "up" ? "+" : "-"}${gaData.changePercent}%`,
      period: "vs last week",
      trend: gaData.trend,
      icon: Eye,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      isMock: gaData.isMock,
    },
    {
      label: "Comments",
      value: dbData.totalComments,
      spark: dbData.commentsSpark || [5, 12, 10, 18, dbData.totalComments],
      change: dbData.commentsChange ? dbData.commentsChange.text : `+${dbData.totalComments}`,
      period: dbData.commentsChange ? "this week" : "all-time",
      trend: dbData.commentsChange ? dbData.commentsChange.trend : "up",
      icon: MessageSquare,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Ad Revenue",
      value: revenueData?.totalRevenue || 0,
      spark: dbData.revenueSpark || [100, 150, 200, revenueData?.totalRevenue || 250],
      change: dbData.revenueChange ? dbData.revenueChange.text : `+$${revenueData?.monthRevenue || 0}`,
      period: dbData.revenueChange ? "this week" : "this month",
      trend: dbData.revenueChange ? dbData.revenueChange.trend : "up",
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  const filteredKPIs = kpis.filter((kpi) => {
    if (!isAdmin && kpi.label === "Registered Users") return false;
    if (!isAdmin && kpi.label === "Ad Revenue") return false;
    return true;
  });

  const tabs = isAdmin ? (["posts", "users"] as const) : (["posts"] as const);

  const quickActions = isAdmin
    ? [
        { label: "New Post", href: "/admin/posts/new", primary: true },
        { label: "Manage Categories", href: "/admin/categories", primary: false },
        { label: "Settings & Analytics", href: "/admin/settings", primary: false },
        { label: "User Management", href: "/admin/users", primary: false },
      ]
    : [
        { label: "New Post", href: "/admin/posts/new", primary: true },
        { label: "Manage My Posts", href: "/admin/posts", primary: false },
      ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/60 pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-accent-600 mb-1">Dashboard Overview</p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Good morning, {name} 👋</h1>
          <p className="text-slate-500 text-sm mt-0.5">Here's a quick look at your platform performance today.</p>
        </div>
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-accent-600 text-white text-xs font-semibold uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all duration-200 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Post
        </Link>
      </div>

      {/* GA Mock Alert Indicator if needed */}
      {isAdmin && gaData.isMock && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-amber-50/70 border border-amber-200/60 rounded-2xl">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Demo Mode (Mock Analytics)</p>
              <p className="text-xs text-amber-700 font-medium mt-0.5">
                The Page Views card is displaying mock demo data. Set up Google Cloud service account keys in Settings to activate real Google Analytics reporting.
              </p>
            </div>
          </div>
          <Link
            href="/admin/settings"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-100 border border-amber-200 text-amber-700 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all flex-shrink-0"
          >
            <SettingsIcon className="w-3.5 h-3.5" /> Setup API
          </Link>
        </div>
      )}

      {/* GA Live Active Indicator */}
      {isAdmin && !gaData.isMock && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Google Analytics Live</p>
            <p className="text-xs text-emerald-700 font-medium mt-0.5">
              Dashboard is successfully authenticated with the Google Analytics Data API. Displaying real-time page views and analytics.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-5`}>
        {filteredKPIs.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200/60 p-6 hover:shadow-md transition-shadow relative">
            {s.isMock && (
              <span className="absolute top-4 right-4 text-[9px] font-bold uppercase tracking-widest bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                Demo
              </span>
            )}
            {!s.isMock && s.label === "Page Views" && (
              <span className="absolute top-4 right-4 text-[9px] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                Live
              </span>
            )}
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2.5 ${s.bg} rounded-xl`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <Sparkline
                data={s.spark}
                color={s.trend === "up" ? "#10b981" : "#f59e0b"}
              />
            </div>
            <p className="text-3xl font-bold text-slate-900 tracking-tight">{formatNumber(s.value)}</p>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">{s.label}</p>
            <div className="flex items-center gap-1 mt-3">
              {s.trend === "up" ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span className={`text-xs font-medium ${s.trend === "up" ? "text-emerald-600" : "text-amber-600"}`}>
                {s.change} {s.period}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">Page Views History</h2>
                {gaData.isMock ? (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">Demo Data</span>
                ) : (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">GA4 Live</span>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">Activity over the last 7 days</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl">
              {gaData.trend === "up" ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {gaData.trend === "up" ? "+" : "-"}{gaData.changePercent}% vs last week
            </div>
          </div>
          <div className="h-[150px] w-full">
            <AreaChart weeklyData={gaData.weeklyViews} weekLabels={gaData.weekLabels} />
          </div>
        </div>

        {/* Donut */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider">Posts by Category</h2>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">Topic distribution analysis</p>
          </div>
          <DonutChart categories={dbData.categories} />
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Posts & Users Tabs */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-6 pt-5 pb-0 border-b border-slate-100">
            <div className="flex gap-6">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-xs font-bold uppercase tracking-widest pb-4 border-b-2 transition-colors cursor-pointer ${
                    activeTab === tab
                      ? "border-accent-600 text-accent-600 font-bold"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <Link href={activeTab === "posts" ? "/admin/posts" : "/admin/users"} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-accent-600 transition-colors pb-4">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {activeTab === "posts" ? (
            <div className="divide-y divide-slate-100">
              {dbData.recentPosts.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 font-medium">No posts published yet.</div>
              ) : dbData.recentPosts.map((post, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/30 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex-shrink-0 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{post.title}</p>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mt-0.5">
                      {post.category?.name || "Uncategorized"} · {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusBadge status={post.published} />
                    <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                      <Link href={`/admin/posts/${post.id}/edit`} className="p-1.5 hover:text-accent-600 text-slate-400 transition-colors"><Pencil className="w-4 h-4" /></Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {dbData.recentUsers.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 font-medium">No users registered yet.</div>
              ) : dbData.recentUsers.map((user, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/30 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex-shrink-0 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{(user.name ?? user.email)[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{user.name ?? "—"}</p>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mt-0.5">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-slate-400">Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[9px] font-bold uppercase tracking-widest">{user.role}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions + Activity */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                    action.primary
                      ? "bg-slate-900 text-white hover:bg-accent-600 shadow-sm"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {action.label}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {dbData.activityFeed.length === 0 ? (
                <div className="text-center text-xs text-slate-400 font-medium py-4">No recent activity</div>
              ) : dbData.activityFeed.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${item.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      {item.action} <span className="font-bold text-slate-800">{item.target}</span>
                    </p>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">{timeAgo(item.time)}</p>
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
