import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const submissionsFilePath = path.join(process.cwd(), "data", "contact_submissions.json");

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing submission ID" }, { status: 400 });
    }

    if (!fs.existsSync(submissionsFilePath)) {
      return NextResponse.json({ error: "No submissions exist yet" }, { status: 404 });
    }

    const fileContent = fs.readFileSync(submissionsFilePath, "utf8");
    let submissions = JSON.parse(fileContent || "[]");

    const exists = submissions.some((sub: any) => sub.id === id);
    if (!exists) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Filter out the requested submission
    submissions = submissions.filter((sub: any) => sub.id !== id);

    fs.writeFileSync(submissionsFilePath, JSON.stringify(submissions, null, 2), "utf8");

    return NextResponse.json({ success: true, message: "Submission deleted successfully" });
  } catch (err: any) {
    console.error("Delete contact submission error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
