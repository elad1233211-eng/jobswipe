/**
 * High-level email notification helpers.
 * All functions are fire-and-forget — callers don't await them.
 */

import { sendEmail } from "./email";
import { sendPushToUser } from "./push";
import {
  createVerificationToken,
  getUserById,
  getMatchDetails,
} from "./domain";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

// ---------- Email verification ----------

export async function sendVerificationEmail(userId: string): Promise<void> {
  const user = getUserById(userId);
  if (!user) return;
  if (user.email_verified_at) return; // already verified

  const token = createVerificationToken(userId);
  const verifyUrl = `${APP_URL}/verify-email/${token}`;

  await sendEmail({
    to: user.email,
    subject: "JobSwipe — אמת את כתובת האימייל שלך ✉️",
    text: [
      `שלום!`,
      ``,
      `לחץ על הקישור הבא כדי לאמת את כתובת האימייל שלך ב-JobSwipe:`,
      verifyUrl,
      ``,
      `הקישור בתוקף ל-24 שעות.`,
      `אם לא נרשמת ל-JobSwipe, פשוט תתעלם מהמייל הזה.`,
    ].join("\n"),
    html: buildVerificationHtml(verifyUrl),
  });
}

// ---------- Match notification ----------

export async function sendMatchEmails(matchId: string): Promise<void> {
  const details = getMatchDetails(matchId);
  if (!details) return;

  const { candidateUser, candidateProfile, employerUser, employerProfile, job } =
    details;

  const chatUrl = `${APP_URL}/app/matches/${matchId}`;

  // Push notifications (fire-and-forget, parallel)
  await Promise.allSettled([
    sendPushToUser(details.candidateUser.id, {
      title: `🎉 Match! ${employerProfile.company_name}`,
      body: `מתאים/ה למשרה: ${job.title} ב-${job.city}`,
      url: chatUrl,
    }),
    sendPushToUser(details.employerUser.id, {
      title: `🎉 Match! ${candidateProfile.full_name}`,
      body: `מועמד/ת חדש/ה למשרה: ${job.title}`,
      url: chatUrl,
    }),
  ]);

  // Email to candidate
  await sendEmail({
    to: candidateUser.email,
    subject: `🎉 Match חדש! ${employerProfile.company_name} מעוניינת בך`,
    text: [
      `היי ${candidateProfile.full_name}!`,
      ``,
      `יש לך Match חדש עם ${employerProfile.company_name} על המשרה "${job.title}" ב-${job.city}.`,
      ``,
      `לפתיחת הצ'אט: ${chatUrl}`,
      ``,
      `בהצלחה! 💼❤️`,
      `צוות JobSwipe`,
    ].join("\n"),
    html: buildMatchHtml({
      recipientName: candidateProfile.full_name,
      otherPartyName: employerProfile.company_name,
      otherPartyEmoji: employerProfile.logo_emoji,
      jobTitle: job.title,
      jobCity: job.city,
      chatUrl,
      isCandidate: true,
    }),
  });

  // Email to employer
  await sendEmail({
    to: employerUser.email,
    subject: `🎉 Match חדש! ${candidateProfile.full_name} מתאים/ה למשרה`,
    text: [
      `היי ${employerProfile.contact_name ?? employerProfile.company_name}!`,
      ``,
      `יש לך Match חדש עם ${candidateProfile.full_name} על המשרה "${job.title}".`,
      ``,
      `לפתיחת הצ'אט: ${chatUrl}`,
      ``,
      `בהצלחה! 💼❤️`,
      `צוות JobSwipe`,
    ].join("\n"),
    html: buildMatchHtml({
      recipientName: employerProfile.contact_name ?? employerProfile.company_name,
      otherPartyName: candidateProfile.full_name,
      otherPartyEmoji: candidateProfile.avatar_emoji,
      jobTitle: job.title,
      jobCity: job.city,
      chatUrl,
      isCandidate: false,
    }),
  });
}

// ---------- HTML builders ----------

function buildVerificationHtml(verifyUrl: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="utf-8"/></head>
<body style="font-family:sans-serif;background:#f8fafc;padding:24px;direction:rtl">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;border:1px solid #e2e8f0">
    <h1 style="color:#ec4899;margin-top:0">💼❤️ JobSwipe</h1>
    <h2 style="color:#1e293b">אמת את האימייל שלך</h2>
    <p style="color:#475569">לחץ על הכפתור כדי לאמת את כתובת האימייל שלך ולהפעיל את חשבונך.</p>
    <a href="${verifyUrl}"
       style="display:inline-block;background:#ec4899;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
      אמת אימייל
    </a>
    <p style="color:#94a3b8;font-size:13px">הקישור בתוקף ל-24 שעות.<br/>
       אם לא נרשמת ל-JobSwipe, תתעלם מהמייל הזה.</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
    <p style="color:#94a3b8;font-size:12px">JobSwipe — מוצאים עבודה בסוויפ 🇮🇱</p>
  </div>
</body>
</html>`;
}

function buildMatchHtml(opts: {
  recipientName: string;
  otherPartyName: string;
  otherPartyEmoji: string;
  jobTitle: string;
  jobCity: string;
  chatUrl: string;
  isCandidate: boolean;
}): string {
  const { recipientName, otherPartyName, otherPartyEmoji, jobTitle, jobCity, chatUrl, isCandidate } = opts;
  const headline = isCandidate
    ? `${otherPartyEmoji} ${otherPartyName} מעוניינת בך`
    : `${otherPartyEmoji} ${otherPartyName} מתאים/ה למשרה`;

  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="utf-8"/></head>
<body style="font-family:sans-serif;background:#f8fafc;padding:24px;direction:rtl">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;border:1px solid #e2e8f0">
    <h1 style="color:#ec4899;margin-top:0">🎉 Match חדש!</h1>
    <p style="color:#1e293b;font-size:18px">היי ${recipientName}!</p>
    <h2 style="color:#ec4899">${headline}</h2>
    <p style="color:#475569">
      המשרה: <strong>${jobTitle}</strong> · ${jobCity}
    </p>
    <a href="${chatUrl}"
       style="display:inline-block;background:#ec4899;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
      פתח את הצ'אט עכשיו
    </a>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
    <p style="color:#94a3b8;font-size:12px">JobSwipe — מוצאים עבודה בסוויפ 🇮🇱</p>
  </div>
</body>
</html>`;
}
