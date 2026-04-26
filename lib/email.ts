/**
 * Thin email abstraction.
 *
 * Dev  (no SMTP_HOST): logs to console + appends to data/dev-emails.log
 * Prod (SMTP_HOST set): sends via nodemailer
 */

import fs from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";

export type EmailOptions = {
  to: string;
  subject: string;
  /** Plain-text fallback */
  text: string;
  /** HTML body */
  html: string;
};

export async function sendEmail(opts: EmailOptions): Promise<void> {
  if (process.env.SMTP_HOST) {
    await sendViaSMTP(opts);
    return;
  }
  logEmailDev(opts);
}

// ---------- dev: write to file + console ----------

function logEmailDev(opts: EmailOptions): void {
  const logDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

  const logPath = path.join(logDir, "dev-emails.log");
  const border = "─".repeat(60);
  const entry = [
    border,
    `TO      : ${opts.to}`,
    `SUBJECT : ${opts.subject}`,
    `DATE    : ${new Date().toISOString()}`,
    border,
    opts.text,
    "",
  ].join("\n");

  fs.appendFileSync(logPath, entry, "utf8");
  console.log(
    `\n[📧 DEV EMAIL]\n  To: ${opts.to}\n  Subject: ${opts.subject}\n${opts.text.slice(0, 400)}\n`
  );
}

// ---------- prod: nodemailer ----------

async function sendViaSMTP(opts: EmailOptions): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? "" }
      : undefined,
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "JobSwipe <noreply@jobswipe.co.il>",
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
}
