"use server";

import { requireUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { sendVerificationEmail } from "@/lib/notifications";

export type VerifyState = { ok?: true; error?: string };

/**
 * Resend verification email for the current user.
 * Rate-limited to 3 times per hour per user.
 */
export async function resendVerificationAction(
  _prev: VerifyState,
  _formData: FormData
): Promise<VerifyState> {
  const user = await requireUser();

  if (user.email_verified_at) {
    return { ok: true }; // already verified
  }

  const rl = rateLimit("resend_verification", user.id, 3, 60 * 60 * 1000);
  if (!rl.ok) {
    return { error: "שלחנו כבר מספר מיילים. נסה שוב בעוד שעה." };
  }

  try {
    await sendVerificationEmail(user.id);
    return { ok: true };
  } catch {
    return { error: "שגיאה בשליחת האימייל. נסה שוב מאוחר יותר." };
  }
}
