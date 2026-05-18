import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

const submissionsFilePath = path.join(process.cwd(), "data", "contact_submissions.json");

// Ensure data folder and file exists
const ensureSubmissionsFile = () => {
  const dir = path.dirname(submissionsFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(submissionsFilePath)) {
    fs.writeFileSync(submissionsFilePath, JSON.stringify([], null, 2), "utf8");
  }
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, topic, message } = body;

    // Validation
    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    ensureSubmissionsFile();

    // Read current submissions
    const fileContent = fs.readFileSync(submissionsFilePath, "utf8");
    const submissions = JSON.parse(fileContent || "[]");

    // Add new submission
    const newSubmission = {
      id: `contact-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      name: name.trim(),
      email: email.trim(),
      phone: (phone || "").trim(),
      topic,
      message: message.trim(),
      createdAt: new Date().toISOString()
    };

    submissions.push(newSubmission);

    // Save back to file
    fs.writeFileSync(submissionsFilePath, JSON.stringify(submissions, null, 2), "utf8");

    console.log("New contact submission saved:", newSubmission);

    // Automatically subscribe the user to the newsletter
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const existingSub = await prisma.subscriber.findUnique({
        where: { email: trimmedEmail }
      });
      if (!existingSub) {
        await prisma.subscriber.create({
          data: { email: trimmedEmail }
        });
        console.log(`Automatically registered contact email as subscriber: ${trimmedEmail}`);
      }
    } catch (subErr) {
      console.error("Auto-subscription on contact submission failed:", subErr);
    }

    return NextResponse.json({ success: true, submission: newSubmission });
  } catch (err: any) {
    console.error("Contact form submission failure:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    ensureSubmissionsFile();
    const fileContent = fs.readFileSync(submissionsFilePath, "utf8");
    const submissions = JSON.parse(fileContent || "[]");

    // Return descending by timestamp
    const sorted = [...submissions].reverse();

    return NextResponse.json(sorted);
  } catch (err) {
    console.error("Failed to retrieve contact submissions:", err);
    return NextResponse.json({ error: "Failed to read contact data" }, { status: 500 });
  }
}
