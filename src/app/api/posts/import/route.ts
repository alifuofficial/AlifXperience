import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { XMLParser } from "fast-xml-parser";
import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import { Readable } from "stream";
import * as ftp from "basic-ftp";

const SETTINGS_PATH = path.join(process.cwd(), "data", "settings.json");

async function readSettings() {
  try {
    const raw = await readFile(SETTINGS_PATH, "utf-8");
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

async function downloadAndSaveImage(imageUrl: string, originalFilename: string): Promise<string | null> {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) {
      console.warn(`[import-download] Failed to fetch image: ${imageUrl}, status: ${res.status}`);
      return null;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    
    // Determine mimetype and extension
    const mimeType = res.headers.get("content-type") || "image/png";
    const ext = originalFilename.split(".").pop()?.toLowerCase() ?? "png";
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    
    const settings = await readSettings();
    const ftpEnabled = settings.ftpEnabled === "true";
    
    if (ftpEnabled) {
      const ftpHost = settings.ftpHost?.trim();
      const ftpPort = parseInt(settings.ftpPort || "21", 10);
      const ftpUser = settings.ftpUser?.trim();
      const ftpPass = settings.ftpPass?.trim();
      const ftpRemotePath = settings.ftpRemotePath?.trim() || "/";
      const ftpPublicUrl = settings.ftpPublicUrl?.trim() || "";
      
      if (!ftpHost || !ftpUser || !ftpPass) {
        throw new Error("FTP credentials incomplete in settings");
      }
      
      const client = new ftp.Client();
      client.ftp.verbose = false;
      
      await client.access({
        host: ftpHost,
        port: ftpPort,
        user: ftpUser,
        password: ftpPass,
        secure: false,
      });
      
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);
      
      const remoteFilePath = path.posix.join(ftpRemotePath, unique);
      await client.uploadFrom(stream, remoteFilePath);
      client.close();
      
      const baseUrl = ftpPublicUrl.replace(/\/$/, "");
      const returnedUrl = `${baseUrl}/${unique}`;
      
      // Register in Database
      await prisma.media.create({
        data: {
          name: originalFilename,
          filename: unique,
          url: returnedUrl,
          mimeType,
          size: buffer.length,
          storageType: "FTP",
        },
      });
      
      return returnedUrl;
    } else {
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }
      
      await writeFile(path.join(uploadDir, unique), buffer);
      const returnedUrl = `/uploads/${unique}`;
      
      // Register in Database
      await prisma.media.create({
        data: {
          name: originalFilename,
          filename: unique,
          url: returnedUrl,
          mimeType,
          size: buffer.length,
          storageType: "LOCAL",
        },
      });
      
      return returnedUrl;
    }
  } catch (err) {
    console.error(`[import-download] Error downloading image ${imageUrl}:`, err);
    return null;
  }
}

// Helper to extract text safely from fast-xml-parser nodes
function getXmlText(node: any): string {
  if (node === null || node === undefined) return "";
  if (typeof node === "object") {
    if (node["#text"] !== undefined) return String(node["#text"]);
    return String(node.text ?? "");
  }
  return String(node);
}

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

    // Attachment map to store { wpPostId -> attachmentUrl }
    const attachmentMap: Record<string, string> = {};
    for (const item of rawItems) {
      if (item === null || item === undefined) continue;
      const postType = getXmlText(item["wp:post_type"] ?? item.post_type ?? "post");
      if (postType === "attachment") {
        const wpPostId = getXmlText(item["wp:post_id"] ?? item.post_id);
        const attachmentUrl = getXmlText(item["wp:attachment_url"] ?? item.attachment_url ?? item.guid);
        if (wpPostId && attachmentUrl) {
          attachmentMap[wpPostId] = attachmentUrl;
        }
      }
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
      if (item === null || item === undefined) continue;
      
      // Standard WXR filters: post_type should be 'post'
      const postType = getXmlText(item["wp:post_type"] ?? item.post_type ?? "post");
      if (postType !== "post") {
        continue; // Skip attachments, custom menus, pages, etc.
      }

      // Title & slug extraction
      const title = getXmlText(item.title ?? "Untitled Post").trim();
      let rawSlug = getXmlText(item["wp:post_name"] ?? item.post_name ?? item.slug);
      if (!rawSlug || rawSlug.trim() === "") {
        rawSlug = slugify(title);
      }
      let slug = slugify(rawSlug);
      if (!slug) slug = `post-${Date.now()}`;

      // Content & Description
      const content = getXmlText(item["content:encoded"] ?? item.content ?? item["content"] ?? "");
      const description = getXmlText(item["excerpt:encoded"] ?? item.description ?? item.excerpt ?? "").substring(0, 190);

      // Status translation
      const wpStatus = getXmlText(item["wp:status"] ?? item.status ?? "publish").toLowerCase().trim();
      const published = wpStatus === "publish" || wpStatus === "published";

      // Created Date
      let createdAt = new Date();
      const postDate = getXmlText(item["wp:post_date"] ?? item.pubDate ?? item.date);
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

        let catName = "";
        for (const cat of categories) {
          if (cat === null || cat === undefined) continue;
          
          if (typeof cat === "object") {
            const domain = cat["@_domain"] ?? cat.domain;
            if (domain === "category") {
              catName = getXmlText(cat).trim();
              break;
            }
          } else {
            catName = String(cat).trim();
            break;
          }
        }

        if (catName && catName !== "Uncategorized") {
          const catSlug = slugify(catName) || "uncategorized";
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

      // Extract and download featured cover image
      let thumbnailId = "";
      let postMeta = item["wp:postmeta"] ?? item.postmeta;
      if (postMeta) {
        if (!Array.isArray(postMeta)) {
          postMeta = [postMeta];
        }
        for (const meta of postMeta) {
          if (meta === null || meta === undefined) continue;
          const key = getXmlText(meta["wp:meta_key"] ?? meta.meta_key);
          if (key === "_thumbnail_id") {
            thumbnailId = getXmlText(meta["wp:meta_value"] ?? meta.meta_value);
            break;
          }
        }
      }

      let coverImage: string | null = null;
      if (thumbnailId && attachmentMap[thumbnailId]) {
        const originalImageUrl = attachmentMap[thumbnailId];
        const filename = originalImageUrl.split("/").pop()?.split("?")[0] ?? "featured.jpg";
        const savedUrl = await downloadAndSaveImage(originalImageUrl, filename);
        if (savedUrl) {
          coverImage = savedUrl;
        }
      }

      // Extract, download, and rewrite inline content images
      let updatedContent = content;
      const imgRegex = /<img[^>]+src=["']([^"']+)["']/g;
      let match;
      const imageUrlsToDownload: string[] = [];
      
      imgRegex.lastIndex = 0;
      while ((match = imgRegex.exec(content)) !== null) {
        const url = match[1];
        if (url && !imageUrlsToDownload.includes(url)) {
          imageUrlsToDownload.push(url);
        }
      }
      
      for (const oldUrl of imageUrlsToDownload) {
        if (oldUrl.startsWith("/uploads/") || oldUrl.startsWith("data:") || oldUrl.startsWith("content:")) {
          continue;
        }
        const filename = oldUrl.split("/").pop()?.split("?")[0] ?? "image.png";
        const savedUrl = await downloadAndSaveImage(oldUrl, filename);
        if (savedUrl) {
          updatedContent = updatedContent.replaceAll(oldUrl, savedUrl);
        }
      }

      // 6. Create the post in the database
      await prisma.post.create({
        data: {
          title,
          slug: finalSlug,
          excerpt: description || title,
          content: updatedContent,
          coverImage,
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
