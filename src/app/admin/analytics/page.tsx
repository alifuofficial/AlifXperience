import { prisma } from "@/lib/prisma";
import { TrendingUp, FileText, Users, MessageSquare, Eye, BarChart2, FolderTree } from "lucide-react";

// ─── Data Fetching ─────────────────────────────────────────────────────────────
async function getAnalytics() {
  const [
    totalPosts, publishedPosts, draftPosts,
    totalUsers, totalComments,
    postsByCategory, recentPosts, recentComments,
    allPosts,
  ] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { published: true } }),
    prisma.post.count({ where: { published: false } }),
    prisma.user.count(),
    prisma.comment.count(),
    prisma.category.findMany({
      include: { _count: { select: { posts: true } } },
      orderBy: { posts: { _count: "desc" } },
    }),
    prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { title: true, slug: true, published: true, createdAt: true, category: { select: { name: true } }, _count: { select: { comments: true } } },
    }),
    prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { author: { select: { name: true, email: true } }, post: { select: { title: true, slug: true } } },
    }),
    prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
  ]);

  // Build last 12 weeks of post counts
  const now = new Date();
  const weeks: { label: string; count: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - i * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const label = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const count = allPosts.filter((p) => p.createdAt >= weekStart && p.createdAt < weekEnd).length;
    weeks.push({ label, count });
  }

  return {
    totalPosts, publishedPosts, draftPosts,
    totalUsers, totalComments,
    postsByCategory, recentPosts, recentComments, weeks,
    publishRate: totalPosts > 0 ? Math.round((publishedPosts / totalPosts) * 100) : 0,
  };
}

// ─── SVG Area Chart ────────────────────────────────────────────────────────────
function AreaChart({ data }: { data: { label: string; count: number }[] }) {
  const W = 600; const H = 140; const padX = 8; const padY = 16;
  const max = Math.max(...data.map((d) => d.count), 1);
  const pts = data.map((d, i) => {
    const x = padX + (i / (data.length - 1)) * (W - padX * 2);
    const y = padY + (1 - d.count / max) * (H - padY * 2);
    return { x, y, ...d };
  });
  const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `M${pts[0].x},${H - padY} ${pts.map((p) => `L${p.x},${p.y}`).join(" ")} L${pts[pts.length - 1].x},${H - padY} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-32" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#areaGrad)" />
      <polyline points={polyline} fill="none" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.count > 0 ? 3 : 2} fill={p.count > 0 ? "#2563eb" : "#e2e8f0"} />
      ))}
    </svg>
  );
}

// ─── Donut Chart ───────────────────────────────────────────────────────────────
const COLORS = ["#2563eb", "#7c3aed", "#0891b2", "#059669", "#d97706", "#dc2626", "#db2777"];

function DonutChart({ data, total }: { data: { name: string; count: number }[]; total: number }) {
  const R = 52; const CX = 70; const CY = 70; const stroke = 22;
  const circumference = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <svg width="140" height="140" viewBox="0 0 140 140" className="flex-shrink-0">
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
        {data.map((d, i) => {
          const pct = total > 0 ? d.count / total : 0;
          const dash = pct * circumference;
          const gap = circumference - dash;
          const el = (
            <circle
              key={i} cx={CX} cy={CY} r={R} fill="none"
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${CX} ${CY})`}
            />
          );
          offset += dash;
          return el;
        })}
        <text x={CX} y={CY - 6} textAnchor="middle" className="text-brand-900" fontSize="18" fontWeight="700" fill="#0f172a">{total}</text>
        <text x={CX} y={CY + 10} textAnchor="middle" fontSize="8" fontWeight="700" fill="#94a3b8" letterSpacing="1">POSTS</text>
      </svg>
      <div className="flex-1 space-y-2">
        {data.slice(0, 6).map((d, i) => (
          <div key={d.name} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="text-[10px] font-bold text-brand-700 flex-1 truncate">{d.name}</span>
            <span className="text-[10px] font-bold text-brand-400">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Bar Chart (horizontal) ─────────────────────────────────────────────────────
function HBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2.5">
      {data.map((d, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-brand-500 uppercase tracking-wider truncate max-w-[60%]">{d.label}</span>
            <span className="text-[9px] font-bold text-brand-700">{d.value}</span>
          </div>
          <div className="h-1.5 bg-brand-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(d.value / max) * 100}%`, background: COLORS[i % COLORS.length] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, accent = false }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-5 flex items-start gap-4 ${accent ? "bg-accent-600 border-accent-600 text-white" : "bg-white border-brand-100/60"}`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${accent ? "bg-white/15" : "bg-accent-600/5"}`}>
        <Icon className={`w-5 h-5 ${accent ? "text-white" : "text-accent-600"}`} />
      </div>
      <div>
        <p className={`text-2xl font-bold leading-none ${accent ? "text-white" : "text-brand-900"}`}>{value}</p>
        <p className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${accent ? "text-white/60" : "text-brand-400"}`}>{label}</p>
        {sub && <p className={`text-[9px] font-medium mt-1 ${accent ? "text-white/50" : "text-brand-300"}`}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default async function AnalyticsPage() {
  const data = await getAnalytics();

  const categoryDonut = data.postsByCategory.map((c) => ({ name: c.name, count: c._count.posts }));
  const categoryBar = data.postsByCategory.slice(0, 6).map((c) => ({ label: c.name, value: c._count.posts }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-accent-600 mb-0.5">Reports</p>
        <h1 className="text-2xl font-bold text-brand-900 tracking-tight">Analytics</h1>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Posts" value={data.totalPosts} sub={`${data.publishRate}% published`} icon={FileText} accent />
        <StatCard label="Published" value={data.publishedPosts} sub={`${data.draftPosts} drafts`} icon={TrendingUp} />
        <StatCard label="Total Users" value={data.totalUsers} sub="registered accounts" icon={Users} />
        <StatCard label="Comments" value={data.totalComments} sub="all time" icon={MessageSquare} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Area chart */}
        <div className="bg-white rounded-xl border border-brand-100/60 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-brand-900">Publishing Activity</h2>
              <p className="text-[9px] text-brand-400 font-medium mt-0.5">Posts published over the last 12 weeks</p>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-accent-600">
              <BarChart2 className="w-3.5 h-3.5" /> Weekly
            </div>
          </div>
          <AreaChart data={data.weeks} />
          {/* X-axis labels */}
          <div className="flex justify-between mt-2 px-2">
            {data.weeks.filter((_, i) => i % 3 === 0).map((w) => (
              <span key={w.label} className="text-[8px] font-bold text-brand-300 uppercase tracking-wider">{w.label}</span>
            ))}
          </div>
        </div>

        {/* Donut chart */}
        <div className="bg-white rounded-xl border border-brand-100/60 p-5">
          <div className="mb-5">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-brand-900">By Category</h2>
            <p className="text-[9px] text-brand-400 font-medium mt-0.5">Post distribution</p>
          </div>
          {categoryDonut.length > 0
            ? <DonutChart data={categoryDonut} total={data.publishedPosts} />
            : <p className="text-xs text-brand-300 font-medium text-center py-8">No published posts yet</p>
          }
        </div>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Recent posts table */}
        <div className="bg-white rounded-xl border border-brand-100/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-brand-100/60 flex items-center justify-between">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-brand-900">Recent Content</h2>
            <span className="text-[9px] font-bold text-brand-300 uppercase tracking-wider">Last 6 posts</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-50">
                <th className="px-5 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-brand-400">Title</th>
                <th className="px-5 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-brand-400">Category</th>
                <th className="px-5 py-2.5 text-center text-[9px] font-bold uppercase tracking-widest text-brand-400">
                  <MessageSquare className="w-3 h-3 inline" />
                </th>
                <th className="px-5 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-brand-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {data.recentPosts.length === 0 ? (
                <tr><td colSpan={4} className="py-10 text-center text-xs text-brand-300 font-medium">No posts yet</td></tr>
              ) : data.recentPosts.map((post, i) => (
                <tr key={i} className="hover:bg-brand-50/40 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-[11px] font-bold text-brand-900 line-clamp-1 max-w-[220px]">{post.title}</p>
                    <p className="text-[9px] text-brand-300 font-medium mt-0.5">
                      {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-[9px] font-bold text-accent-700 bg-accent-50 px-2 py-0.5 rounded uppercase tracking-wider">
                      {post.category.name}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="text-[10px] font-bold text-brand-500">{post._count.comments}</span>
                  </td>
                  <td className="px-5 py-3">
                    {post.published
                      ? <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Live</span>
                      : <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Draft</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Category bar chart */}
          <div className="bg-white rounded-xl border border-brand-100/60 p-5">
            <div className="flex items-center gap-2 mb-4">
              <FolderTree className="w-3.5 h-3.5 text-accent-600" />
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-brand-900">Top Categories</h2>
            </div>
            {categoryBar.length > 0
              ? <HBarChart data={categoryBar} />
              : <p className="text-xs text-brand-300 font-medium text-center py-4">No categories yet</p>
            }
          </div>

          {/* Publish ratio */}
          <div className="bg-white rounded-xl border border-brand-100/60 p-5">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-brand-900 mb-4">Publish Rate</h2>
            <div className="flex items-end gap-3">
              <p className="text-4xl font-bold text-brand-900">{data.publishRate}%</p>
              <p className="text-[9px] font-bold text-brand-400 uppercase tracking-wider mb-1.5">of posts live</p>
            </div>
            <div className="mt-3 h-2 bg-brand-100 rounded-full overflow-hidden">
              <div className="h-full bg-accent-600 rounded-full transition-all" style={{ width: `${data.publishRate}%` }} />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[9px] font-bold text-emerald-600">{data.publishedPosts} published</span>
              <span className="text-[9px] font-bold text-amber-500">{data.draftPosts} drafts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent comments */}
      {data.recentComments.length > 0 && (
        <div className="bg-white rounded-xl border border-brand-100/60 p-5">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-brand-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-accent-600" /> Recent Comments
          </h2>
          <div className="space-y-3">
            {data.recentComments.map((c) => (
              <div key={c.id} className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-400 to-indigo-500 flex-shrink-0 flex items-center justify-center">
                  <span className="text-white text-[9px] font-bold">
                    {(c.author.name ?? c.author.email)[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-[10px] font-bold text-brand-900">{c.author.name ?? c.author.email}</span>
                    <span className="text-[9px] text-brand-300 font-medium">on</span>
                    <span className="text-[10px] font-bold text-accent-600 truncate max-w-[180px]">{c.post.title}</span>
                    <span className="text-[9px] font-bold text-brand-300 ml-auto">
                      {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p className="text-xs text-brand-500 leading-relaxed line-clamp-1">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
