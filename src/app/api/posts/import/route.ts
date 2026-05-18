import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { XMLParser } from "fast-xml-parser";

// Helper to make an alphanumeric slug from a string
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

export async function POST(req: NextRequest) {
  // 1. Enforce Admin session
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUserEmail = session.user?.email;
  if (!currentUserEmail) {
    return NextResponse.json({ error: "Could not identify current admin user." }, { status: 400 });
  }

  // Find the database ID of the current logged-in admin user
  const adminUser = await prisma.user.findUnique({
    where: { email: currentUserEmail },
  });

  if (!adminUser) {
    return NextResponse.json({ error: "Logged in user does not exist in database." }, { status: 400 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No XML file uploaded." }, { status: 400 });
    }

    const xmlText = await file.text();

    // 2. Configure XML Parser
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      textNodeName: "#text",
      allowBooleanAttributes: true,
      parseAttributeValue: true,
      parseTagValue: true,
    });

    const jsonObj = parser.parse(xmlText);

    // 3. Drill down to item array
    const channel = jsonObj?.rss?.channel;
    if (!channel) {
      return NextResponse.json(
        { error: "Invalid XML format. Must be a valid WordPress/RSS WXR file (missing <channel>)." },
        { status: 400 }
      );
    }

    let rawItems = channel.item;
    if (!rawItems) {
      return NextResponse.json({ success: true, count: 0, message: "No posts found in the XML file." });
    }

    // Standardize to array
    if (!Array.isArray(rawItems)) {
      rawItems = [rawItems];
    }

    let importCount = 0;
    let categoriesCreated = 0;
    const importedTitles: string[] = [];

    // 4. Extract default Category or fetch "Uncategorized"
    let defaultCategory = await prisma.category.findFirst({
      where: { slug: "uncategorized" },
    });
    if (!defaultCategory) {
      defaultCategory = await prisma.category.create({
        data: { name: "Uncategorized", slug: "uncategorized" },
      });
    }

    // 5. Traverse items and parse posts
    for (const item of rawItems) {
      // Standard WXR filters: post_type should be 'post'
      const postType = item["wp:post_type"] ?? item.post_type ?? "post";
      if (postType !== "post") {
        continue; // Skip attachments, custom menus, pages, etc.
      }

      // Title & slug extraction
      const title = String(item.title ?? "Untitled Post").trim();
      let rawSlug = item["wp:post_name"] ?? item.post_name ?? item.slug;
      if (!rawSlug || typeof rawSlug !== "string" || rawSlug.trim() === "") {
        rawSlug = slugify(title);
      }
      let slug = slugify(String(rawSlug));
      if (!slug) slug = `post-${Date.now()}`;

      // Content & Description
      const content = String(item["content:encoded"] ?? item.content ?? item["content"] ?? "");
      const description = String(item["excerpt:encoded"] ?? item.description ?? item.excerpt ?? "").substring(0, 190);

      // Status translation
      const wpStatus = String(item["wp:status"] ?? item.status ?? "publish").toLowerCase();
      const published = wpStatus === "publish";

      // Created Date
      let createdAt = new Date();
      const postDate = item["wp:post_date"] ?? item.pubDate ?? item.date;
      if (postDate) {
        const parsedDate = new Date(postDate);
        if (!isNaN(parsedDate.getTime())) {
          createdAt = parsedDate;
        }
      }

      // Resolve category
      let categoryId = defaultCategory.id;
      let categories = item.category;
      if (categories) {
        if (!Array.isArray(categories)) {
          categories = [categories];
        }

        // Find standard category entry (domain="category")
        const catNode = categories.find(
          (c: any) => c["@_domain"] === "category" || c.domain === "category"
        );

        if (catNode) {
          const catName = String(catNode["#text"] ?? catNode.text ?? catNode).trim();
          const catSlug = slugify(catName) || "uncategorized";

          if (catName && catName !== "Uncategorized") {
            // Find or create category
            let dbCat = await prisma.category.findUnique({
              where: { slug: catSlug },
            });
            if (!dbCat) {
              dbCat = await prisma.category.create({
                data: { name: catName, slug: catSlug },
              });
              categoriesCreated++;
            }
            categoryId = dbCat.id;
          }
        }
      }

      // Solve Slug collisions (ensure unique slug constraint)
      let finalSlug = slug;
      let slugConflict = await prisma.post.findUnique({
        where: { slug: finalSlug },
      });
      let counter = 1;
      while (slugConflict) {
        finalSlug = `${slug}-${counter}`;
        slugConflict = await prisma.post.findUnique({
          where: { slug: finalSlug },
        });
        counter++;
      }

      // 6. Create the post in the database
      await prisma.post.create({
        data: {
          title,
          slug: finalSlug,
          excerpt: description || title,
          content,
          published,
          createdAt,
          updatedAt: createdAt,
          categoryId,
          authorId: adminUser.id,
        },
      });

      importCount++;
      importedTitles.push(title);
    }

    return NextResponse.json({
      success: true,
      importCount,
      categoriesCreated,
      message: `Successfully imported ${importCount} posts and created ${categoriesCreated} categories!`,
      titles: importedTitles.slice(0, 10), // Return up to 10 titles as examples
    });
  } catch (error: any) {
    console.error("[POST /api/posts/import]", error);
    return NextResponse.json(
      { error: error.message || "Failed to process and import WordPress WXR file." },
      { status: 500 }
    );
  }
}
