"use client";

import { useActionState } from "react";
import { requestPasswordResetAction, type AuthState } from "@/app/actions/auth";
import Link from "next/link";

const initial: AuthState = {};

export default function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, initial);

  const sent = state && !state.error && !pending && Object.keys(state).length > 0;

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <div className="text-5xl">📬</div>
        <h2 className="text-xl font-bold text-slate-800">בדוק את האימייל שלך</h2>
        <p className="text-slate-500 text-sm">
          אם הכתובת קיימת במערכת, שלחנו אליה קישור לאיפוס סיסמה.
          <br />
          הקישור בתוקף לשעה אחת.
        </p>
        <Link
          href="/login"
          className="inline-block mt-2 text-pink-500 text-sm font-medium hover:underline"
        >
          חזרה להתחברות
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <p className="text-slate-500 text-sm text-center">
        הכנס את האימייל שלך ונשלח לך קישור לאיפוס הסיסמה.
      </p>
      <div>
        <label className="block text-sm font-medium mb-1">אימייל</label>
        <input
          name="email"
          type="email"
          required
          dir="ltr"
          className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-400"
          placeholder="you@example.com"
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-600 text-center">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-brand-gradient text-white font-semibold py-3 rounded-xl disabled:opacity-60"
      >
        {pending ? "שולח..." : "שלח קישור לאיפוס"}
      </button>

      <p className="text-center text-sm text-slate-500">
        <Link href="/login" className="text-pink-500 font-medium hover:underline">
          חזרה להתחברות
        </Link>
      </p>
    </form>
  );
}
