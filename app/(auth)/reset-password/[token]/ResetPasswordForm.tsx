"use client";

import { useActionState } from "react";
import { resetPasswordAction, type AuthState } from "@/app/actions/auth";

const initial: AuthState = {};

export default function ResetPasswordForm({ token }: { token: string }) {
  const boundAction = resetPasswordAction.bind(null);
  const [state, action, pending] = useActionState(boundAction, initial);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <div>
        <label className="block text-sm font-medium mb-1">סיסמה חדשה</label>
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
        {pending ? "שומר..." : "שמור סיסמה חדשה"}
      </button>
    </form>
  );
}
