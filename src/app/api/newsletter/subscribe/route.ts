import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check if already subscribed
    const existing = await prisma.subscriber.findUnique({
      where: { email: trimmedEmail },
    });

    if (existing) {
      return NextResponse.json({ message: "You are already subscribed to our newsletter!" }, { status: 200 });
    }

    // Save subscriber
    await prisma.subscriber.create({
      data: { email: trimmedEmail },
    });

    return NextResponse.json({ message: "Successfully subscribed to our newsletter!" }, { status: 200 });
  } catch (error: any) {
    console.error("Newsletter Subscription Error:", error);
    return NextResponse.json({ error: "Failed to process subscription. Please try again." }, { status: 500 });
  }
}
