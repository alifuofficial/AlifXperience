import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    // 1. Find user by email
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !user.resetCode) {
      return NextResponse.json({ error: "Invalid email or reset code." }, { status: 400 });
    }

    // 2. Validate reset code and expiration time
    if (user.resetCode !== cleanCode) {
      return NextResponse.json({ error: "Invalid reset code." }, { status: 400 });
    }

    if (!user.resetCodeExpires || user.resetCodeExpires < new Date()) {
      return NextResponse.json({ error: "Reset code has expired. Please request a new one." }, { status: 400 });
    }

    // 3. Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Update password and wipe out temporary reset tokens
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetCode: null,
        resetCodeExpires: null,
      },
    });

    return NextResponse.json({ success: true, message: "Your password has been successfully reset. You can now log in." });
  } catch (error: any) {
    console.error("[POST /api/auth/reset-password/verify]", error);
    return NextResponse.json({ error: "Failed to reset password." }, { status: 500 });
  }
}
