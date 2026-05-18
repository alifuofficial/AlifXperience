import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readFile } from "fs/promises";
import path from "path";
import nodemailer from "nodemailer";

// Helper to load SMTP settings
async function loadSmtpSettings() {
  try {
    const filePath = path.join(process.cwd(), "data", "settings.json");
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// ─── ADMIN ONLY: GET SUBSCRIBERS LIST ─────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized: Please sign in as an admin." }, { status: 401 });
    }

    const subscribers = await prisma.subscriber.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(subscribers);
  } catch (error: any) {
    console.error("[GET /api/newsletter] Error:", error);
    return NextResponse.json({ error: `Server error: ${error.message || error}` }, { status: 500 });
  }
}

// ─── ADMIN ONLY: DELETE SUBSCRIBER ────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Subscriber ID is required" }, { status: 400 });
    }

    await prisma.subscriber.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Subscriber removed successfully" });
  } catch (error) {
    console.error("[DELETE /api/newsletter]", error);
    return NextResponse.json({ error: "Failed to remove subscriber." }, { status: 500 });
  }
}

// ─── ADMIN ONLY: SEND NEWSLETTER ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { subject, body } = await req.json();

    if (!subject?.trim() || !body?.trim()) {
      return NextResponse.json({ error: "Subject and content body are required." }, { status: 400 });
    }

    const settings = await loadSmtpSettings();

    // Check if SMTP is configured
    if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPass) {
      return NextResponse.json(
        {
          error:
            "SMTP credentials have not been configured yet. Please go to Admin Settings -> Email & Auth to configure your mail credentials before sending newsletters.",
        },
        { status: 400 }
      );
    }

    // Fetch all active subscribers
    const subscribers = await prisma.subscriber.findMany();

    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: "You do not have any newsletter subscribers yet." },
        { status: 400 }
      );
    }

    const senderEmail = settings.smtpSenderEmail || settings.smtpUser;
    const senderName = settings.smtpSenderName || "NEXUS Tech";

    // Setup nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: parseInt(settings.smtpPort || "587"),
      secure: settings.smtpSecure === "ssl", // true for port 465 SSL, false for 587 STARTTLS
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPass,
      },
    });

    let successCount = 0;
    let failCount = 0;

    // Send newsletter emails in concurrent batches of 8 to prevent gateway timeouts
    const batchSize = 8;
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (sub) => {
          try {
            const unsubscribeLink = `${
              settings.siteUrl || "http://localhost:3000"
            }/api/newsletter/unsubscribe?email=${encodeURIComponent(sub.email)}`;

            // Premium HTML email template wrapper
            const htmlContent = `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>${subject}</title>
                  <style>
                    body {
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                      background-color: #f8fafc;
                      color: #0f172a;
                      margin: 0;
                      padding: 0;
                    }
                    .container {
                      max-width: 600px;
                      margin: 40px auto;
                      background: #ffffff;
                      border: 1px border #e2e8f0;
                      border-radius: 12px;
                      overflow: hidden;
                      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
                    }
                    .header {
                      background-color: #0f172a;
                      padding: 32px;
                      text-align: center;
                    }
                    .logo {
                      font-weight: 900;
                      font-size: 24px;
                      letter-spacing: 0.1em;
                      color: #ffffff;
                      text-transform: uppercase;
                      text-decoration: none;
                    }
                    .content {
                      padding: 40px 32px;
                      line-height: 1.7;
                      font-size: 15px;
                      color: #334155;
                    }
                    .footer {
                      background-color: #f1f5f9;
                      padding: 24px 32px;
                      text-align: center;
                      font-size: 11px;
                      color: #64748b;
                      border-t: 1px solid #e2e8f0;
                    }
                    .footer a {
                      color: #0f172a;
                      text-decoration: underline;
                    }
                    h1 {
                      font-size: 22px;
                      color: #0f172a;
                      margin-top: 0;
                      margin-bottom: 20px;
                      font-weight: 800;
                    }
                    p {
                      margin: 0 0 20px 0;
                    }
                    .btn {
                      display: inline-block;
                      background-color: #0f172a;
                      color: #ffffff !important;
                      text-decoration: none;
                      padding: 12px 24px;
                      font-weight: bold;
                      font-size: 12px;
                      text-transform: uppercase;
                      letter-spacing: 0.05em;
                      border-radius: 6px;
                      margin-top: 10px;
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <a href="${settings.siteUrl || "#"}" class="logo">${senderName}</a>
                    </div>
                    <div class="content">
                      <h1>${subject}</h1>
                      ${body.trim().startsWith("<") ? body : body.replace(/\n/g, "<br>")}
                    </div>
                    <div class="footer">
                      <p>You received this email because you subscribed to the ${senderName} newsletter.</p>
                      <p>
                        <a href="${unsubscribeLink}" target="_blank">Unsubscribe</a> | 
                        <a href="${settings.siteUrl || "#"}" target="_blank">Visit Website</a>
                      </p>
                      <p>© ${new Date().getFullYear()} ${senderName}. All rights reserved.</p>
                    </div>
                  </div>
                </body>
              </html>
            `;

            await transporter.sendMail({
              from: `"${senderName}" <${senderEmail}>`,
              to: sub.email,
              subject: subject,
              html: htmlContent,
            });

            successCount++;
          } catch (err) {
            console.error(`Failed to send email to ${sub.email}:`, err);
            failCount++;
          }
        })
      );
    }

    return NextResponse.json({
      message: `Newsletter sent successfully!`,
      details: `Delivered: ${successCount} emails, Failed: ${failCount} emails.`,
      successCount,
      failCount,
    });
  } catch (error: any) {
    console.error("[POST /api/newsletter/send]", error);
    return NextResponse.json({ error: "An unexpected error occurred while sending." }, { status: 500 });
  }
}
