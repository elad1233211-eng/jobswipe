"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createSession,
  destroySession,
  loginUser,
  registerUser,
  requireUser,
  hashPassword,
} from "@/lib/auth";
import { deleteAccount, consumePasswordResetToken } from "@/lib/domain";
import { getDb } from "@/lib/db";
import { rateLimit, getClientKey } from "@/lib/rate-limit";
import {
  sendVerificationEmail,
  sendAdminNewUserNotification,
  sendPasswordResetEmail,
} from "@/lib/notifications";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

const signupSchema = z.object({
  email: z.string().email("כתובת אימייל לא תקינה"),
  password: z.string().min(6, "סיסמה חייבת להיות לפחות 6 תווים"),
  role: z.enum(["candidate", "employer"]),
});

const loginSchema = z.object({
  email: z.string().email("כתובת אימייל לא תקינה"),
  password: z.string().min(1, "נדרשת סיסמה"),
});

export type AuthState = {
  error?: string;
};

export async function signupAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  // Rate limit: 5 signup attempts per hour per IP.
  const ip = await getClientKey();
  const rl = rateLimit("signup", ip, 5, HOUR);
  if (!rl.ok) {
    return { error: "יותר מדי ניסיונות הרשמה. נסו שוב בעוד שעה." };
  }

  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "קלט לא תקין" };
  }

  try {
    const user = await registerUser(
      parsed.data.email,
      parsed.data.password,
      parsed.data.role
    );
    await createSession(user);
    // Fire-and-forget notifications — don't block the redirect
    sendVerificationEmail(user.id).catch(() => {});
    sendAdminNewUserNotification({ id: user.id, email: user.email, role: user.role }).catch(() => {});
  } catch (e) {
    const msg = e instanceof Error ? e.message : "שגיאה";
    if (msg === "EMAIL_TAKEN")
      return { error: "כתובת האימייל כבר רשומה במערכת" };
    return { error: "שגיאה בהרשמה. נסה שוב." };
  }

  // Redirect into onboarding for the chosen role
  if (parsed.data.role === "candidate") redirect("/onboarding/candidate");
  else redirect("/onboarding/employer");
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  // Rate limit: 10 login attempts per 15 minutes per IP.
  const ip = await getClientKey();
  const rl = rateLimit("login", ip, 10, 15 * MINUTE);
  if (!rl.ok) {
    return { error: "יותר מדי ניסיונות התחברות. נסו שוב מאוחר יותר." };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "קלט לא תקין" };
  }

  let role: "candidate" | "employer" = "candidate";
  try {
    const user = await loginUser(parsed.data.email, parsed.data.password);
    await createSession(user);
    role = user.role;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "ACCOUNT_DISABLED")
      return { error: "החשבון הושבת. צור קשר עם התמיכה." };
    return { error: "אימייל או סיסמה לא נכונים" };
  }

  redirect(role === "candidate" ? "/app/feed" : "/app/employer");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}

// ---------- Password reset ----------

const resetRequestSchema = z.object({
  email: z.string().email("כתובת אימייל לא תקינה"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, "סיסמה חייבת להיות לפחות 6 תווים"),
});

export async function requestPasswordResetAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  // Rate limit: 3 requests per hour per IP
  const ip = await getClientKey();
  const rl = rateLimit("pw_reset_request", ip, 3, HOUR);
  if (!rl.ok) {
    return { error: "יותר מדי ניסיונות. נסה שוב בעוד שעה." };
  }

  const parsed = resetRequestSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "קלט לא תקין" };
  }

  // Look up user (don't reveal if email exists)
  const db = getDb();
  const row = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(parsed.data.email.trim().toLowerCase()) as { id: string } | undefined;

  if (row) {
    sendPasswordResetEmail(row.id).catch(() => {});
  }

  // Always return success to prevent email enumeration
  return { error: undefined };
}

export async function resetPasswordAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "קלט לא תקין" };
  }

  const userId = consumePasswordResetToken(parsed.data.token);
  if (!userId) {
    return { error: "הקישור אינו תקין או שפג תוקפו. בקש איפוס סיסמה מחדש." };
  }

  const hash = await hashPassword(parsed.data.password);
  const db = getDb();
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, userId);

  redirect("/login?reset=1");
}

export async function deleteAccountAction(): Promise<{ error: string } | never> {
  const user = await requireUser();
  try {
    deleteAccount(user.id);
  } catch {
    return { error: "שגיאה במחיקת החשבון. נסה שוב." };
  }
  await destroySession();
  redirect("/?deleted=1");
}
