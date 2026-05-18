import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/mailer";

const SETTINGS_PATH = path.join(process.cwd(), "data", "settings.json");

async function readSettings() {
  try {
    const raw = await readFile(SETTINGS_PATH, "utf-8");
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Read admin settings
    const settings = await readSettings();
    const allowRegistration = settings.allowRegistration !== "false"; // Default true
    const defaultUserRole = settings.defaultUserRole || "USER"; // Default USER

    if (!allowRegistration) {
      return NextResponse.json(
        { error: "Public user registration is currently disabled by the site administrator." },
        { status: 403 }
      );
    }

    // 2. Parse request parameters
    const { name, email, password } = await req.json();

    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    // 3. Check for existing user
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    // 4. Hash password and create user record
    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name: name?.trim() || null,
        email: email.toLowerCase().trim(),
        password: hash,
        role: defaultUserRole === "ADMIN" ? "ADMIN" : "USER",
      },
    });

    // 5. Optionally send welcome email via SMTP
    const siteName = settings.siteName || "NEXUS";
    const siteUrl = settings.siteUrl || "https://alifxperience.com";

    const emailSubject = `Welcome to ${siteName}!`;
    const textContent = `Hello ${name || "there"},\n\nWelcome to ${siteName}! Your account has been successfully created under the email address ${email}.\n\nExplore our latest articles here: ${siteUrl}\n\nBest regards,\nThe ${siteName} Editorial Team`;
    const htmlContent = `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #f1f5f9; rounded-xl: 12px; background-color: #ffffff;">
        <h2 style="color: #0f172a; font-size: 20px; font-weight: 700; margin-bottom: 16px;">Welcome to ${siteName}! 👋</h2>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 16px;">Hello <strong>${name || "there"}</strong>,</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">Your account has been successfully created under the email address <strong>${email}</strong>. You are now subscribed to receive our latest high-quality technology articles, newsletters, and community comments!</p>
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${siteUrl}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; font-size: 13px; font-weight: 700; text-decoration: none; border-radius: 6px; display: inline-block; text-transform: uppercase; letter-spacing: 0.1em;">Explore NEXUS</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">This is an automated message sent from the ${siteName} platform. Please do not reply directly.</p>
      </div>
    `;

    // Attempt sending, will fallback to server log simulator if SMTP is not configured
    await sendEmail({
      to: user.email,
      subject: emailSubject,
      text: textContent,
      html: htmlContent,
    });

    return NextResponse.json(
      {
        message: "Registration successful!",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/auth/signup]", error);
    return NextResponse.json(
      { error: "Internal server error during registration." },
      { status: 500 }
    );
  }
}
