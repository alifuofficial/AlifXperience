import { prisma } from "@/lib/prisma";
import PostsManagerClient from "./PostsManagerClient";

export const dynamic = "force-dynamic";

async function getPosts() {
  return prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true } },
      category: { select: { name: true } },
    },
  });
}

export default async function AdminPostsPage() {
  const posts = await getPosts();
  const allUsers = await prisma.user.findMany({ select: { id: true, name: true, email: true } });
  
  const userMap: Record<string, string> = {};
  allUsers.forEach((u) => {
    userMap[u.id] = u.name || u.email;
  });

  // Serialize models so they can be securely processed inside the Client Component
  const serializedPosts = posts.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    coverImage: p.coverImage,
    published: p.published,
    createdAt: p.createdAt.toISOString(),
    category: { name: p.category?.name || "General" },
    author: { name: p.author?.name || null },
    coAuthorsJson: p.coAuthorsJson,
    views: p.views,
  }));

  return <PostsManagerClient initialPosts={serializedPosts} userMap={userMap} />;
}
