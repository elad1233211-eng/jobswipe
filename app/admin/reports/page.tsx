import { listReportsForAdmin } from "@/lib/domain";
import {
  reviewReportAction,
} from "@/app/actions/admin";

export default function AdminReportsPage() {
  const open = listReportsForAdmin("open");
  const recent = listReportsForAdmin("reviewed", 20);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">🚨 דוחות</h1>

      <section>
        <h2 className="text-lg font-semibold text-slate-300 mb-3">
          פתוחים ({open.length})
        </h2>
        {open.length === 0 ? (
          <p className="text-slate-500 text-sm">אין דוחות פתוחים 🎉</p>
        ) : (
          <div className="space-y-3">
            {open.map((r) => (
              <div
                key={r.id}
                className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="text-sm">
                    <span className="text-slate-400">מדווח:</span>{" "}
                    <span className="text-white font-medium">{r.reporter_email}</span>
                  </div>
                  <span className="text-xs bg-red-900/40 text-red-300 px-2 py-0.5 rounded-full">
                    {r.target_kind === "job" ? "🔖 משרה" : "👤 משתמש"}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-slate-400">יעד:</span>{" "}
                  <span className="text-white">{r.target_display}</span>
                  <span className="text-slate-500 text-xs mr-2">({r.target_id.slice(0, 8)}…)</span>
                </div>
                <div className="text-sm">
                  <span className="text-slate-400">סיבה:</span>{" "}
                  <span className="text-amber-300 font-medium">{r.reason}</span>
                </div>
                {r.details && (
                  <p className="text-sm text-slate-300 bg-slate-700/50 rounded p-2">
                    {r.details}
                  </p>
                )}
                <div className="text-xs text-slate-500">
                  {new Date(r.created_at).toLocaleString("he-IL")}
                </div>
                <div className="flex gap-2 pt-1">
                  <form
                    action={reviewReportAction.bind(null, r.id, "reviewed")}
                  >
                    <button className="text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded-lg">
                      ✅ טופל
                    </button>
                  </form>
                  <form
                    action={reviewReportAction.bind(null, r.id, "dismissed")}
                  >
                    <button className="text-xs bg-slate-600 hover:bg-slate-500 text-white px-3 py-1 rounded-lg">
                      🗑 בטל
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {recent.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-500 mb-3">
            טופלו לאחרונה ({recent.length})
          </h2>
          <div className="space-y-2">
            {recent.map((r) => (
              <div
                key={r.id}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 flex items-center justify-between text-sm opacity-60"
              >
                <span className="text-slate-300">{r.reporter_email} → {r.target_display}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  r.status === "reviewed"
                    ? "bg-green-900/40 text-green-400"
                    : "bg-slate-700 text-slate-400"
                }`}>
                  {r.status === "reviewed" ? "טופל" : "בוטל"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
