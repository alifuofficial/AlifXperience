import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Locate user in database
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      // Return a generic success to prevent email harvest attacks while keeping UX consistent
      return NextResponse.json({ message: "If this email exists in our records, a secure reset code has been sent." });
    }

    // 2. Generate secure 6-digit numeric code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // Expires in 15 minutes

    // 3. Persist to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetCode,
        resetCodeExpires,
      },
    });

    // 4. Send email containing code
    const emailSubject = "Password Reset Code - AlifXperience";
    const emailText = `Your password reset code is: ${resetCode}\n\nThis code will expire in 15 minutes. If you did not request a password reset, please ignore this email.`;
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px; background-color: #f8fafc;">
        <h2 style="color: #0f172a; margin-bottom: 10px; font-weight: 700; text-align: center;">AlifXperience</h2>
        <p style="color: #334155; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">You have requested a secure password reset. Use the 6-digit code below to reset your password:</p>
        <div style="background-color: #ffffff; border: 2px dashed #3b82f6; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1d4ed8;">${resetCode}</span>
        </div>
        <p style="color: #64748b; font-size: 12px; line-height: 1.5; text-align: center;">This code will expire in <strong>15 minutes</strong>. If you did not make this request, you can safely ignore this message.</p>
      </div>
    `;

    await sendEmail({
      to: normalizedEmail,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
    });

    return NextResponse.json({ message: "If this email exists in our records, a secure reset code has been sent." });
  } catch (error: any) {
    console.error("[POST /api/auth/reset-password/request]", error);
    return NextResponse.json({ error: "Failed to initiate password reset process." }, { status: 500 });
  }
}
