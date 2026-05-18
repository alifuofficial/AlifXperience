import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const postSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional(),
  // Accept both absolute URLs and relative paths (e.g. /uploads/...)
  coverImage: z.string().optional().transform((v) => v?.trim() || null),
  // Zod v4 removed .cuid() — use plain string with min length
  categoryId: z.string().min(1, "Category is required"),
  published: z.boolean().default(false),
  authorId: z.string().optional(),
});

function zodError(e: any): string {
  // Zod v4 flattens errors differently — handle both v3 and v4 shapes
  const issues = e?.issues ?? e?.errors;
  return issues?.[0]?.message ?? "Validation error";
}

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { name: true, email: true } },
        category: { select: { name: true, slug: true } },
      },
    });
    return NextResponse.json(posts);
  } catch {
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: zodError(parsed.error) }, { status: 422 });
    }
    const data = parsed.data;

    const authorId = (session.user as any).id ?? data.authorId;
    if (!authorId) return NextResponse.json({ error: "Author not found" }, { status: 400 });

    // If this is an existing draft (id provided), update instead
    if (body.id) {
      const post = await prisma.post.update({
        where: { id: body.id },
        data: {
          title: data.title,
          slug: data.slug,
          content: data.content,
          excerpt: data.excerpt ?? null,
          coverImage: data.coverImage ?? null,
          published: data.published,
          categoryId: data.categoryId,
          updatedAt: new Date(),
        },
      });
      return NextResponse.json(post);
    }

    // Ensure slug uniqueness
    const existing = await prisma.post.findUnique({ where: { slug: data.slug } });
    if (existing) {
      return NextResponse.json({ error: "A post with this slug already exists" }, { status: 409 });
    }

    const post = await prisma.post.create({
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt ?? null,
        coverImage: data.coverImage ?? null,
        published: data.published,
        authorId,
        categoryId: data.categoryId,
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (e: any) {
    console.error("[POST /api/posts]", e);
    return NextResponse.json({ error: e?.message ?? "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "Post ID required" }, { status: 400 });

    const parsed = postSchema.omit({ authorId: true }).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: zodError(parsed.error) }, { status: 422 });
    }
    const data = parsed.data;

    // Slug uniqueness excluding self
    const existing = await prisma.post.findFirst({
      where: { slug: data.slug, NOT: { id: body.id } },
    });
    if (existing) {
      return NextResponse.json({ error: "Slug already in use by another post" }, { status: 409 });
    }

    const post = await prisma.post.update({
      where: { id: body.id },
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt ?? null,
        coverImage: data.coverImage ?? null,
        published: data.published,
        categoryId: data.categoryId,
        updatedAt: new Date(),
      },
    });
    return NextResponse.json(post);
  } catch (e: any) {
    console.error("[PUT /api/posts]", e);
    return NextResponse.json({ error: e?.message ?? "Internal server error" }, { status: 500 });
  }
}
