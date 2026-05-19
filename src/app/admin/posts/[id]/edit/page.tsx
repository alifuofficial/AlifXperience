import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EditPostClient from "./EditPostClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
  });

  if (!post) {
    notFound();
  }

  // Pre-serialize any non-serializable fields (like Date fields) to avoid Next.js serialization warnings
  const serializedPost = {
    ...post,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };

  return <EditPostClient initialPost={serializedPost} />;
}
