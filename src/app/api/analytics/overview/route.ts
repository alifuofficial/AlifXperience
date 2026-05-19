import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || (role !== "ADMIN" && role !== "AUTHOR")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any)?.id;
  const isAuthor = role === "AUTHOR";

  const postFilter = isAuthor
    ? {
        OR: [
          { authorId: userId },
          { coAuthorsJson: { contains: userId } },
        ],
      }
    : {};

  const commentFilter = isAuthor
    ? {
        post: {
          OR: [
            { authorId: userId },
            { coAuthorsJson: { contains: userId } },
          ],
        },
      }
    : {};

  try {
    const [
      totalPosts,
      totalUsers,
      totalComments,
      categoriesCount,
      recentPosts,
      recentUsers,
      recentCommentsForActivity,
      recentUsersForActivity,
      recentPostsForActivity,
      // Dynamic sparks & trends
      allPosts,
      allUsers,
      allComments,
      allRevenues
    ] = await Promise.all([
      // Total counts
      prisma.post.count({ where: postFilter }),
      isAuthor ? Promise.resolve(0) : prisma.user.count(),
      prisma.comment.count({ where: commentFilter }),
      
      // Categories with count
      prisma.category.findMany({
        select: {
          name: true,
          posts: {
            where: postFilter,
            select: { id: true },
          },
        },
      }),

      // Recent Posts
      prisma.post.findMany({
        where: postFilter,
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          slug: true,
          published: true,
          createdAt: true,
          category: { select: { name: true } },
        },
      }),

      // Recent Users (Admins only)
      isAuthor
        ? Promise.resolve([])
        : prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
              name: true,
              email: true,
              role: true,
              createdAt: true,
            },
          }),

      // Activity Feed source data
      prisma.comment.findMany({
        where: commentFilter,
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          createdAt: true,
          content: true,
          post: { select: { title: true } },
        },
      }),
      isAuthor
        ? Promise.resolve([])
        : prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            take: 3,
            select: {
              createdAt: true,
              email: true,
            },
          }),
      prisma.post.findMany({
        where: postFilter,
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          createdAt: true,
          title: true,
          published: true,
        },
      }),
      // Telemetry lists for in-memory sparklines & trends
      prisma.post.findMany({
        where: postFilter,
        select: { createdAt: true }
      }),
      isAuthor ? Promise.resolve([]) : prisma.user.findMany({
        select: { createdAt: true }
      }),
      prisma.comment.findMany({
        where: commentFilter,
        select: { createdAt: true }
      }),
      isAuthor ? Promise.resolve([]) : prisma.adRevenue.findMany({
        select: { date: true, amount: true }
      })
    ]);

    // Format categories percentage
    const categoriesWithPercent = categoriesCount
      .map((cat) => ({
        label: cat.name,
        value: cat.posts.length,
      }))
      .filter((cat) => cat.value > 0)
      .sort((a, b) => b.value - a.value);

    const totalCategoryPosts = categoriesWithPercent.reduce((acc, curr) => acc + curr.value, 0);

    const formattedCategories = categoriesWithPercent.map((cat) => ({
      label: cat.label,
      value: totalCategoryPosts > 0 ? Math.round((cat.value / totalCategoryPosts) * 100) : 0,
    }));

    // Build standard high-fidelity Activity Feed
    const activityFeed: any[] = [];

    recentCommentsForActivity.forEach((comment) => {
      activityFeed.push({
        action: "New comment on",
        target: comment.post.title,
        time: comment.createdAt.toISOString(),
        dot: "bg-blue-500",
      });
    });

    recentUsersForActivity.forEach((user) => {
      activityFeed.push({
        action: "User registered:",
        target: user.email,
        time: user.createdAt.toISOString(),
        dot: "bg-violet-500",
      });
    });

    recentPostsForActivity.forEach((post) => {
      activityFeed.push({
        action: post.published ? "Post published:" : "Draft saved:",
        target: post.title,
        time: post.createdAt.toISOString(),
        dot: post.published ? "bg-emerald-500" : "bg-amber-500",
      });
    });

    // Sort activity feed by time desc
    activityFeed.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    // ─── Generate Real Weekly Sparklines (Cumulative) ─────────────────────
    const now = new Date();
    const last7DaysDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(now.getDate() - (6 - i));
      d.setHours(23, 59, 59, 999);
      return d;
    });

    const postsSpark = last7DaysDates.map((date) => {
      return allPosts.filter((p) => p.createdAt <= date).length;
    });

    const usersSpark = isAuthor
      ? [0, 0, 0, 0, 0, 0, 0]
      : last7DaysDates.map((date) => {
          return allUsers.filter((u) => u.createdAt <= date).length;
        });

    const commentsSpark = last7DaysDates.map((date) => {
      return allComments.filter((c) => c.createdAt <= date).length;
    });

    const revenueSpark = isAuthor
      ? [0, 0, 0, 0, 0, 0, 0]
      : last7DaysDates.map((date) => {
          return allRevenues.filter((r) => r.date <= date).reduce((sum, r) => sum + r.amount, 0);
        });

    // ─── Calculate Real Weekly Change & Trend Rates ───────────────────────
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(now.getDate() - 14);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const postsLastWeek = allPosts.filter((p) => p.createdAt >= sevenDaysAgo).length;
    const postsPrevWeek = allPosts.filter((p) => p.createdAt >= fourteenDaysAgo && p.createdAt < sevenDaysAgo).length;

    const usersLastWeek = allUsers.filter((u) => u.createdAt >= sevenDaysAgo).length;
    const usersPrevWeek = allUsers.filter((u) => u.createdAt >= fourteenDaysAgo && u.createdAt < sevenDaysAgo).length;

    const commentsLastWeek = allComments.filter((c) => c.createdAt >= sevenDaysAgo).length;
    const commentsPrevWeek = allComments.filter((c) => c.createdAt >= fourteenDaysAgo && c.createdAt < sevenDaysAgo).length;

    const revenueLastWeek = allRevenues.filter((r) => r.date >= sevenDaysAgo).reduce((s, x) => s + x.amount, 0);
    const revenuePrevWeek = allRevenues.filter((r) => r.date >= fourteenDaysAgo && r.date < sevenDaysAgo).reduce((s, x) => s + x.amount, 0);

    const calcChange = (current: number, previous: number) => {
      if (previous === 0) {
        return { percent: current > 0 ? 100 : 0, trend: "up" as const, text: `+${current} this week` };
      }
      const diff = current - previous;
      const percent = Math.round((Math.abs(diff) / previous) * 100);
      return {
        percent,
        trend: diff >= 0 ? ("up" as const) : ("down" as const),
        text: `${diff >= 0 ? "+" : "-"}${percent}% vs last week`
      };
    };

    const postsChange = calcChange(postsLastWeek, postsPrevWeek);
    const usersChange = calcChange(usersLastWeek, usersPrevWeek);
    const commentsChange = calcChange(commentsLastWeek, commentsPrevWeek);
    const revenueChange = calcChange(revenueLastWeek, revenuePrevWeek);

    return NextResponse.json({
      totalPosts,
      totalUsers,
      totalComments,
      categories: formattedCategories.slice(0, 5),
      recentPosts,
      recentUsers,
      activityFeed: activityFeed.slice(0, 5),
      postsSpark,
      usersSpark,
      commentsSpark,
      revenueSpark,
      postsChange,
      usersChange,
      commentsChange,
      revenueChange
    });
  } catch (error) {
    console.error("[API /api/analytics/overview]", error);
    return NextResponse.json({ error: "Failed to fetch overview stats" }, { status: 500 });
  }
}
