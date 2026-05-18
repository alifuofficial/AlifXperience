import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  // 1. Enforce Admin session
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // 2. Fetch all posts with categories and authors
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        author: {
          select: { name: true, email: true },
        },
      },
    });

    const now = new Date().toUTCString();
    
    // 3. Build compliant WXR (WordPress Extended RSS 1.2) XML
    let xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0"
  xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:wfw="http://wellformedweb.org/commentAPI/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:wp="http://wordpress.org/export/1.2/"
>
  <channel>
    <title>NEXUS Blog Export</title>
    <link>https://alifxperience.com</link>
    <description>WordPress Compatible Post Export</description>
    <pubDate>${now}</pubDate>
    <language>en-US</language>
    <wp:wxr_version>1.2</wp:wxr_version>
`;

    for (const post of posts) {
      const pubDate = new Date(post.createdAt).toUTCString();
      const postDateStr = new Date(post.createdAt).toISOString().replace("T", " ").substring(0, 19);
      const authorName = post.author?.name || "admin";
      const categoryName = post.category?.name || "Uncategorized";
      const categorySlug = post.category?.slug || "uncategorized";
      const status = post.published ? "publish" : "draft";
      const postExcerpt = post.excerpt || post.title;

      // Escape helper
      const clean = (str: string | null) => {
        if (!str) return "";
        return str
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&apos;");
      };

      xml += `
    <item>
      <title>${clean(post.title)}</title>
      <link>https://alifxperience.com/${post.slug}</link>
      <pubDate>${pubDate}</pubDate>
      <dc:creator><![CDATA[${authorName}]]></dc:creator>
      <description><![CDATA[${clean(postExcerpt)}]]></description>
      <content:encoded><![CDATA[${post.content || ""}]]></content:encoded>
      <excerpt:encoded><![CDATA[${clean(postExcerpt)}]]></excerpt:encoded>
      <wp:post_id>${post.id.substring(0, 8)}</wp:post_id>
      <wp:post_date><![CDATA[${postDateStr}]]></wp:post_date>
      <wp:post_date_gmt><![CDATA[${postDateStr}]]></wp:post_date_gmt>
      <wp:comment_status><![CDATA[open]]></wp:comment_status>
      <wp:ping_status><![CDATA[open]]></wp:ping_status>
      <wp:post_name><![CDATA[${post.slug}]]></wp:post_name>
      <wp:status><![CDATA[${status}]]></wp:status>
      <wp:post_parent>0</wp:post_parent>
      <wp:menu_order>0</wp:menu_order>
      <wp:post_type><![CDATA[post]]></wp:post_type>
      <wp:post_password><![CDATA[]]></wp:post_password>
      <wp:is_sticky>0</wp:is_sticky>
      <category domain="category" nicename="${categorySlug}"><![CDATA[${clean(categoryName)}]]></category>
    </item>`;
    }

    xml += `
  </channel>
</rss>`;

    // 4. Return as downloadable XML file
    const headers = new Headers();
    headers.set("Content-Type", "application/xml; charset=utf-8");
    headers.set("Content-Disposition", 'attachment; filename="wordpress-wxr-export.xml"');

    return new NextResponse(xml, { status: 200, headers });
  } catch (error: any) {
    console.error("[GET /api/posts/export]", error);
    return NextResponse.json(
      { error: error.message || "Failed to compile export WXR XML." },
      { status: 500 }
    );
  }
}
