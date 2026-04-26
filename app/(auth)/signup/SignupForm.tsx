"use client";

import { useActionState, useState } from "react";
import { signupAction, type AuthState } from "@/app/actions/auth";

const initial: AuthState = {};

export default function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, initial);
  const [role, setRole] = useState<"candidate" | "employer">("candidate");

  return (
    <form action={action} className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-2">אני...</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setRole("candidate")}
            className={`py-3 rounded-xl font-semibold border-2 transition ${
              role === "candidate"
                ? "border-pink-500 bg-pink-50 text-pink-700"
                : "border-slate-200 text-slate-500"
            }`}
          >
            מחפש/ת עבודה
          </button>
          <button
            type="button"
            onClick={() => setRole("employer")}
            className={`py-3 rounded-xl font-semibold border-2 transition ${
              role === "employer"
                ? "border-violet-500 bg-violet-50 text-violet-700"
                : "border-slate-200 text-slate-500"
            }`}
          >
            מעסיק/ה
          </button>
        </div>
        <input type="hidden" name="role" value={role} />
      </div>

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

      <div>
        <label className="block text-sm font-medium mb-1">סיסמה</label>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-400"
          placeholder="לפחות 6 תווים"
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
        {pending ? "נרשם..." : "הירשם"}
      </button>
    </form>
  );
}
