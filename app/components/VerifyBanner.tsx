"use client";

import { useActionState } from "react";
import { resendVerificationAction, type VerifyState } from "@/app/actions/verify";

const init: VerifyState = {};

/**
 * Sticky amber banner shown when the user's email is not yet verified.
 * Includes a one-click resend button.
 */
export default function VerifyBanner() {
  const [state, action, pending] = useActionState(resendVerificationAction, init);

  if (state.ok) {
    return (
      <div className="bg-green-50 border-b border-green-200 px-4 py-2 text-center text-sm text-green-700">
        ✅ מייל אימות נשלח! בדוק את תיבת הדואר שלך.
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex flex-wrap items-center justify-center gap-2 text-sm text-amber-800">
      <span>📧 כתובת האימייל שלך לא אומתה עדיין.</span>
      {state.error && (
        <span className="text-red-600 text-xs">{state.error}</span>
      )}
      <form action={action} className="inline">
        <button
          type="submit"
          disabled={pending}
          className="underline font-medium hover:no-underline disabled:opacity-50 cursor-pointer"
        >
          {pending ? "שולח..." : "שלח מייל אימות"}
        </button>
      </form>
    </div>
  );
}
