import nodemailer from "nodemailer";
import { readFile } from "fs/promises";
import path from "path";

const SETTINGS_PATH = path.join(process.cwd(), "data", "settings.json");

interface SendMailParams {
  to: string;
  subject: string;
  text: string;
  html: string;
}

async function readSettings() {
  try {
    const raw = await readFile(SETTINGS_PATH, "utf-8");
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

export async function sendEmail({ to, subject, text, html }: SendMailParams): Promise<boolean> {
  try {
    const settings = await readSettings();

    const host = settings.smtpHost?.trim();
    const port = parseInt(settings.smtpPort || "587", 10);
    const user = settings.smtpUser?.trim();
    const pass = settings.smtpPass?.trim();
    const secureType = settings.smtpSecure || "tls";
    const senderEmail = settings.smtpSenderEmail?.trim();
    const senderName = settings.smtpSenderName?.trim() || "NEXUS Tech";

    // If SMTP host or user is missing, we consider mail disabled
    if (!host || !user || !pass) {
      console.log(`[SMTP Mailer Simulator] Mail to <${to}> subject "${subject}": SMTP not configured. Logged content:\n${text}`);
      return false;
    }

    const secure = secureType === "ssl";

    // Transporter
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false, // Prevents certificate verification issues on custom servers
      },
    });

    const fromAddress = senderEmail ? `"${senderName}" <${senderEmail}>` : `"${senderName}" <${user}>`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      html,
    });

    console.log(`[SMTP Mailer] Message sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("[SMTP Mailer Error]", error);
    return false;
  }
}
