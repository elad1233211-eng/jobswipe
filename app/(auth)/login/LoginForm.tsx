"use client";

import { useActionState } from "react";
import { loginAction, type AuthState } from "@/app/actions/auth";

const initial: AuthState = {};

export default function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);
  return (
    <form action={action} className="space-y-4">
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
        {pending ? "מתחבר..." : "התחבר"}
      </button>
    </form>
  );
}
