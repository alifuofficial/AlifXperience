import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    ] = await Promise.all([
      // Total counts
      prisma.post.count(),
      prisma.user.count(),
      prisma.comment.count(),
      
      // Categories with count
      prisma.category.findMany({
        select: {
          name: true,
          posts: {
            select: { id: true },
          },
        },
      }),

      // Recent Posts
      prisma.post.findMany({
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

      // Recent Users
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),

      // Activity Feed source data (take last 3 comments, 3 users, 3 posts)
      prisma.comment.findMany({
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          createdAt: true,
          content: true,
          post: { select: { title: true } },
        },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          createdAt: true,
          email: true,
        },
      }),
      prisma.post.findMany({
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          createdAt: true,
          title: true,
          published: true,
        },
      }),
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

    return NextResponse.json({
      totalPosts,
      totalUsers,
      totalComments,
      categories: formattedCategories.slice(0, 5),
      recentPosts,
      recentUsers,
      activityFeed: activityFeed.slice(0, 5),
    });
  } catch (error) {
    console.error("[API /api/analytics/overview]", error);
    return NextResponse.json({ error: "Failed to fetch overview stats" }, { status: 500 });
  }
}
