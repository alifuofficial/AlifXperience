import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return new Response(
        `<html>
          <head>
            <title>Unsubscribe failed</title>
            <style>
              body { font-family: system-ui; background-color: #f8fafc; color: #0f172a; text-align: center; padding-top: 100px; }
              .card { max-width: 400px; margin: auto; padding: 32px; background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
              h1 { color: #ef4444; font-size: 20px; font-weight: 800; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Invalid Unsubscribe Request</h1>
              <p>The unsubscribe link is invalid or missing information.</p>
            </div>
          </body>
        </html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    const decodedEmail = decodeURIComponent(email).trim().toLowerCase();

    // Check if subscriber exists
    const sub = await prisma.subscriber.findUnique({
      where: { email: decodedEmail },
    });

    if (!sub) {
      return new Response(
        `<html>
          <head>
            <title>Already Unsubscribed</title>
            <style>
              body { font-family: system-ui; background-color: #f8fafc; color: #0f172a; text-align: center; padding-top: 100px; }
              .card { max-width: 400px; margin: auto; padding: 32px; background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
              h1 { color: #0f172a; font-size: 20px; font-weight: 800; }
              .btn { display: inline-block; background-color: #0f172a; color: white; text-decoration: none; padding: 10px 20px; font-weight: bold; border-radius: 6px; font-size: 12px; margin-top: 16px; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Already Unsubscribed</h1>
              <p>Email <strong>${decodedEmail}</strong> is not on our newsletter list.</p>
              <a href="/" class="btn">Return to Site</a>
            </div>
          </body>
        </html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    // Delete subscriber
    await prisma.subscriber.delete({
      where: { email: decodedEmail },
    });

    return new Response(
      `<html>
        <head>
          <title>Unsubscribed Successfully</title>
          <style>
            body { font-family: system-ui; background-color: #f8fafc; color: #0f172a; text-align: center; padding-top: 100px; }
            .card { max-width: 400px; margin: auto; padding: 32px; background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border-top: 4px solid #10b981; }
            h1 { color: #10b981; font-size: 20px; font-weight: 800; margin-top: 0; }
            p { font-size: 14px; color: #64748b; line-height: 1.6; }
            .btn { display: inline-block; background-color: #0f172a; color: white; text-decoration: none; padding: 10px 20px; font-weight: bold; border-radius: 6px; font-size: 12px; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Unsubscribed Successfully</h1>
            <p>You have been removed from our newsletter list. You will no longer receive any mailing digests from us.</p>
            <p>Email: <strong>${decodedEmail}</strong></p>
            <a href="/" class="btn">Return to Site</a>
          </div>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (error) {
    console.error("[GET /api/newsletter/unsubscribe]", error);
    return new Response("An error occurred during unsubscription.", { status: 500 });
  }
}
