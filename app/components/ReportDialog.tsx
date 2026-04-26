"use client";

import { useState, useTransition } from "react";
import { reportAction } from "@/app/actions/safety";

const REASONS: { value: string; label: string }[] = [
  { value: "spam", label: "ספאם / פרסומת" },
  { value: "harassment", label: "הטרדה / איומים" },
  { value: "fake", label: "פרופיל או משרה מזויפים" },
  { value: "inappropriate", label: "תוכן פוגעני / מיני" },
  { value: "discrimination", label: "אפליה פסולה" },
  { value: "other", label: "אחר" },
];

type Props = {
  targetKind: "user" | "job";
  targetId: string;
  buttonLabel?: string;
  className?: string;
};

export default function ReportDialog({
  targetKind,
  targetId,
  buttonLabel = "דיווח",
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState(REASONS[0].value);
  const [details, setDetails] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    const fd = new FormData();
    fd.set("targetKind", targetKind);
    fd.set("targetId", targetId);
    fd.set("reason", reason);
    if (details.trim()) fd.set("details", details.trim());
    startTransition(async () => {
      const res = await reportAction(null, fd);
      if ("error" in res) setError(res.error);
      else setDone(true);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setDone(false);
          setError(null);
        }}
        className={
          className ||
          "text-xs text-slate-500 hover:text-red-600 underline-offset-2 hover:underline"
        }
      >
        {buttonLabel}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-title"
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {done ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-2">🙏</div>
                <h2 className="font-bold text-lg mb-1">תודה על הדיווח</h2>
                <p className="text-sm text-slate-600">
                  הדיווח נקלט וייבדק על ידי הצוות.
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-4 px-4 py-2 rounded-xl bg-slate-100"
                >
                  סגירה
                </button>
              </div>
            ) : (
              <>
                <h2 id="report-title" className="font-bold text-lg">
                  דיווח על {targetKind === "job" ? "משרה" : "משתמש"}
                </h2>

                <label className="block text-sm">
                  <span className="font-semibold">סיבה</span>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-1 w-full border border-slate-300 rounded-xl p-2"
                  >
                    {REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm">
                  <span className="font-semibold">פרטים (אופציונלי)</span>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    maxLength={500}
                    rows={3}
                    className="mt-1 w-full border border-slate-300 rounded-xl p-2"
                    placeholder="מה קרה?"
                  />
                  <span className="text-xs text-slate-400">
                    {details.length}/500
                  </span>
                </label>

                {error && (
                  <p className="text-sm text-red-600" role="alert">
                    {error}
                  </p>
                )}

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700"
                  >
                    ביטול
                  </button>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={pending}
                    className="px-4 py-2 rounded-xl bg-red-500 text-white font-semibold disabled:opacity-50"
                  >
                    {pending ? "שולח…" : "שלח דיווח"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
