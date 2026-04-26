"use client";

import { useEffect } from "react";

// Next.js 16: error boundaries receive `unstable_retry` (was `reset` pre-15).
export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[JobSwipe] route error:", error);
  }, [error]);

  return (
    <main className="flex-1 flex flex-col items-center justify-center text-center p-8 max-w-lg mx-auto">
      <div className="text-6xl mb-4">😬</div>
      <h1 className="text-2xl font-bold mb-2">משהו השתבש</h1>
      <p className="text-slate-600 mb-2">
        אנחנו מצטערים, התרחשה תקלה. נסו שוב או חזרו מאוחר יותר.
      </p>
      {error.digest && (
        <p className="text-xs text-slate-400 mb-6 font-mono">
          קוד תקלה: {error.digest}
        </p>
      )}
      <button
        onClick={() => unstable_retry()}
        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 text-white font-semibold"
      >
        ניסיון נוסף
      </button>
    </main>
  );
}
