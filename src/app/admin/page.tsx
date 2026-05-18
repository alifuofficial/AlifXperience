"use client";

import { useState, useEffect } from "react";
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
  const pad = { t: 10, b: 24, l: 10, r: 10 };

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
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#areaGrad)" />
      <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="white" stroke="#3b82f6" strokeWidth="2" />
      ))}
      {weekLabels.map((label, i) => {
        const x = pad.l + (i / (weekLabels.length - 1 || 1)) * (w - pad.l - pad.r);
        return (
          <text key={i} x={x} y={h - 4} textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="Inter, sans-serif" fontWeight="600">
            {label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Inline SVG Donut Chart ────────────────────────────────────────────────────
const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#e2e8f0"];

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
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="16" />
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
              strokeWidth="16"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              strokeLinecap="round"
            />
          );
          cumulative += cat.value;
          return segment;
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="18" fontWeight="700" fill="#0f172a" fontFamily="Inter, sans-serif">
          {categories.length}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="8" fontWeight="600" fill="#94a3b8" fontFamily="Inter, sans-serif" letterSpacing="1">
          TOP TOPICS
        </text>
      </svg>
      <div className="space-y-2 flex-1">
        {displayCategories.map((cat, i) => (
          <div key={cat.label} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: categories.length > 0 ? COLORS[i % COLORS.length] : "#e2e8f0" }} />
            <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wide truncate max-w-[100px]">{cat.label}</span>
            <span className="ml-auto text-[10px] font-bold text-brand-900">{cat.value}%</span>
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
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: boolean }) {
  return status ? (
    <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700">
      Published
    </span>
  ) : (
    <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-brand-100 text-brand-500">
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
        if (gaRes.ok) setGaData(await gaRes.json());
        if (revRes.ok) setRevenueData(await revRes.json());
      } catch (error) {
        console.error("Dashboard fetch error", error);
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
      label: "Total Posts",
      value: dbData.totalPosts,
      spark: [10, 15, 20, 22, dbData.totalPosts],
      change: `+${dbData.recentPosts.length}`,
      period: "recent",
      trend: "up",
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Registered Users",
      value: dbData.totalUsers,
      spark: [2, 5, 8, 12, dbData.totalUsers],
      change: `+${dbData.recentUsers.length}`,
      period: "recent",
      trend: "up",
      icon: Users,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Page Views",
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
      spark: [5, 12, 10, 18, dbData.totalComments],
      change: `+${dbData.totalComments}`,
      period: "all-time",
      trend: "up",
      icon: MessageSquare,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Ad Revenue",
      value: revenueData?.totalRevenue || 0,
      spark: [100, 150, 200, revenueData?.totalRevenue || 250],
      change: `+$${revenueData?.monthRevenue || 0}`,
      period: "this month",
      trend: "up",
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-accent-600 mb-1">Dashboard</p>
          <h1 className="text-3xl font-bold text-brand-900 tracking-tight">Good morning, Admin 👋</h1>
          <p className="text-brand-400 text-sm mt-1">Here's what's happening with AlifXperience today.</p>
        </div>
        <Link
          href="/admin/posts/new"
          className="flex items-center gap-2 bg-brand-900 hover:bg-accent-600 text-white text-[10px] font-bold uppercase tracking-widest px-5 py-3 rounded transition-all duration-300"
        >
          <Plus className="w-4 h-4" />
          New Post
        </Link>
      </div>

      {/* GA Mock Alert Indicator if needed */}
      {gaData.isMock && (
        <div className="flex items-center justify-between gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Demo Mode (Mock Analytics)</p>
              <p className="text-xs text-amber-600 font-medium mt-0.5">
                The Page Views card is displaying mock demo data. Set up Google Cloud service account keys to activate real Google Analytics reporting.
              </p>
            </div>
          </div>
          <Link
            href="/admin/settings"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-100 border border-amber-200 text-amber-700 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all"
          >
            <SettingsIcon className="w-3.5 h-3.5" /> Setup API
          </Link>
        </div>
      )}

      {/* GA Live Active Indicator */}
      {!gaData.isMock && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 animate-pulse" />
          <div>
            <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Google Analytics Live</p>
            <p className="text-xs text-emerald-600 font-medium mt-0.5">
              Dashboard is successfully authenticated with the Google Analytics Data API. Displaying real-time page views and analytics.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-brand-100/60 p-5 hover:shadow-md hover:shadow-brand-900/5 transition-all relative">
            {s.isMock && (
              <span className="absolute top-3 right-3 text-[7px] font-extrabold uppercase tracking-wider bg-amber-500 text-white px-1.5 py-0.5 rounded shadow-sm">
                Demo
              </span>
            )}
            {!s.isMock && s.label === "Page Views" && (
              <span className="absolute top-3 right-3 text-[7px] font-extrabold uppercase tracking-wider bg-emerald-500 text-white px-1.5 py-0.5 rounded shadow-sm">
                Live
              </span>
            )}
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2 ${s.bg} rounded-lg`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <Sparkline
                data={s.spark}
                color={s.trend === "up" ? "#10b981" : "#f59e0b"}
              />
            </div>
            <p className="text-2xl font-bold text-brand-900 tracking-tight">{formatNumber(s.value)}</p>
            <p className="text-[9px] font-bold text-brand-400 uppercase tracking-widest mt-0.5">{s.label}</p>
            <div className="flex items-center gap-1 mt-3">
              {s.trend === "up" ? (
                <TrendingUp className="w-3 h-3 text-emerald-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-amber-500" />
              )}
              <span className={`text-[9px] font-bold ${s.trend === "up" ? "text-emerald-600" : "text-amber-600"}`}>
                {s.change} {s.period}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Area Chart */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-brand-100/60 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-brand-900 uppercase tracking-wider">Page Views</h2>
                {gaData.isMock ? (
                  <span className="text-[8px] font-bold uppercase text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">Demo Data</span>
                ) : (
                  <span className="text-[8px] font-bold uppercase text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded">GA4 API Live</span>
                )}
              </div>
              <p className="text-[9px] font-bold text-brand-400 uppercase tracking-widest mt-0.5">This week</p>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded">
              {gaData.trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {gaData.trend === "up" ? "+" : "-"}{gaData.changePercent}% vs last week
            </div>
          </div>
          <div className="h-[140px]">
            <AreaChart weeklyData={gaData.weeklyViews} weekLabels={gaData.weekLabels} />
          </div>
        </div>

        {/* Donut */}
        <div className="bg-white rounded-xl border border-brand-100/60 p-6">
          <div className="mb-6">
            <h2 className="text-sm font-bold text-brand-900 uppercase tracking-wider">By Category</h2>
            <p className="text-[9px] font-bold text-brand-400 uppercase tracking-widest mt-0.5">Post distribution</p>
          </div>
          <DonutChart categories={dbData.categories} />
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Posts & Users Tabs */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-brand-100/60 overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-5 pb-0">
            <div className="flex gap-4">
              {(["posts", "users"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-[10px] font-bold uppercase tracking-widest pb-3 border-b-2 transition-colors ${
                    activeTab === tab
                      ? "border-accent-600 text-accent-600"
                      : "border-transparent text-brand-300 hover:text-brand-600"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <Link href={`/admin/${activeTab}`} className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-brand-400 hover:text-accent-600 transition-colors">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {activeTab === "posts" ? (
            <div className="divide-y divide-brand-50">
              {dbData.recentPosts.length === 0 ? (
                <div className="p-8 text-center text-xs text-brand-300 font-medium">No posts published yet.</div>
              ) : dbData.recentPosts.map((post, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-3 hover:bg-brand-50/40 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-brand-100 flex-shrink-0 flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5 text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-brand-900 truncate">{post.title}</p>
                    <p className="text-[9px] font-bold text-brand-300 uppercase tracking-wider mt-0.5">
                      {post.category?.name || "Uncategorized"} · {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusBadge status={post.published} />
                    <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                      <Link href={`/admin/posts/${post.id}/edit`} className="p-1 hover:text-accent-600 text-brand-300 transition-colors"><Pencil className="w-3.5 h-3.5" /></Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-brand-50">
              {dbData.recentUsers.length === 0 ? (
                <div className="p-8 text-center text-xs text-brand-300 font-medium">No users registered yet.</div>
              ) : dbData.recentUsers.map((user, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-3 hover:bg-brand-50/40 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-400 to-indigo-500 flex-shrink-0 flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">{(user.name ?? user.email)[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-brand-900">{user.name ?? "—"}</p>
                    <p className="text-[9px] font-bold text-brand-300 uppercase tracking-wider mt-0.5">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[9px] font-bold text-brand-400">Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    <span className="px-2 py-0.5 bg-brand-100 text-brand-500 rounded text-[8px] font-bold uppercase tracking-wider">{user.role}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions + Activity */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-brand-100/60 p-5">
            <h2 className="text-[10px] font-bold text-brand-900 uppercase tracking-wider mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: "New Post", href: "/admin/posts/new", primary: true },
                { label: "Manage Categories", href: "/admin/categories", primary: false },
                { label: "Settings & Analytics", href: "/admin/settings", primary: false },
                { label: "User Management", href: "/admin/users", primary: false },
              ].map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className={`flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                    action.primary
                      ? "bg-brand-900 text-white hover:bg-accent-600"
                      : "bg-brand-50 text-brand-600 hover:bg-brand-100"
                  }`}
                >
                  {action.label}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white rounded-xl border border-brand-100/60 p-5">
            <h2 className="text-[10px] font-bold text-brand-900 uppercase tracking-wider mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {dbData.activityFeed.length === 0 ? (
                <div className="text-center text-xs text-brand-300 font-medium py-4">No recent activity</div>
              ) : dbData.activityFeed.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${item.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-brand-500 font-medium leading-tight truncate">
                      {item.action} <span className="font-bold text-brand-900">{item.target}</span>
                    </p>
                    <p className="text-[9px] font-bold text-brand-300 uppercase tracking-wider mt-0.5">{timeAgo(item.time)}</p>
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
