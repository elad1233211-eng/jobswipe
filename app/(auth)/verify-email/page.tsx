"use client";

import { useActionState } from "react";
import { resendVerificationAction, type VerifyState } from "@/app/actions/verify";
import Link from "next/link";

const init: VerifyState = {};

export default function VerifyEmailPage() {
  const [state, action, pending] = useActionState(resendVerificationAction, init);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-sm w-full text-center space-y-4 shadow-sm">
        <div className="text-5xl">📬</div>
        <h1 className="text-xl font-bold text-slate-900">בדוק את תיבת הדואר</h1>
        <p className="text-slate-600 text-sm leading-relaxed">
          שלחנו לך מייל עם קישור לאימות החשבון.
          <br />
          לחץ על הקישור במייל כדי להמשיך.
        </p>

        {state.ok && (
          <p className="text-green-600 text-sm bg-green-50 rounded-lg p-3">
            ✅ נשלח מחדש! בדוק את תיבת הדואר שלך.
          </p>
        )}
        {state.error && (
          <p className="text-red-600 text-sm bg-red-50 rounded-lg p-3">
            {state.error}
          </p>
        )}

        <form action={action}>
          <button
            type="submit"
            disabled={pending}
            className="w-full py-2 px-4 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition"
          >
            {pending ? "שולח..." : "שלח מחדש"}
          </button>
        </form>

        {/* Dev helper: log file hint */}
        {process.env.NODE_ENV === "development" && (
          <p className="text-xs text-slate-400 mt-2">
            במצב dev — הקישור מודפס לקונסול ונשמר ב-{" "}
            <code className="font-mono">data/dev-emails.log</code>
          </p>
        )}

        <Link href="/app/feed" className="block text-sm text-slate-400 hover:text-slate-600">
          המשך בלי אימות →
        </Link>
      </div>
    </div>
  );
}
