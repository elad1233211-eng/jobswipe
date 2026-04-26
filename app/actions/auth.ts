"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createSession,
  destroySession,
  loginUser,
  registerUser,
  requireUser,
} from "@/lib/auth";
import { deleteAccount } from "@/lib/domain";
import { rateLimit, getClientKey } from "@/lib/rate-limit";
import { sendVerificationEmail } from "@/lib/notifications";

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
    // Fire-and-forget: send verification email in the background
    sendVerificationEmail(user.id).catch(() => {});
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
