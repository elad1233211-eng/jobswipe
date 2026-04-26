import { getPlatformStats } from "@/lib/domain";

export default function AdminDashboard() {
  const s = getPlatformStats();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">📊 לוח בקרה</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="משתמשים" value={s.total_users} emoji="👥" />
        <StatCard label="מועמדים" value={s.total_candidates} emoji="🧑‍💼" />
        <StatCard label="מעסיקים" value={s.total_employers} emoji="🏢" />
        <StatCard label="משרות" value={s.total_jobs} sub={`${s.active_jobs} פעילות`} emoji="💼" />
        <StatCard label="סוויפים" value={s.total_swipes} emoji="👆" />
        <StatCard label="התאמות" value={s.total_matches} emoji="🎉" highlight />
        <StatCard label="הודעות" value={s.total_messages} emoji="💬" />
        <StatCard
          label="דוחות פתוחים"
          value={s.open_reports}
          emoji="🚨"
          highlight={s.open_reports > 0}
        />
        <StatCard
          label="לא אומתו"
          value={s.unverified_users}
          emoji="📧"
        />
      </div>

      {s.open_reports > 0 && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm">
          ⚠️ יש <strong>{s.open_reports}</strong> דוחות פתוחים הממתינים לטיפול.{" "}
          <a href="/admin/reports" className="underline">עבור לדוחות →</a>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  emoji,
  sub,
  highlight,
}: {
  label: string;
  value: number;
  emoji: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 border ${
        highlight
          ? "bg-pink-900/30 border-pink-700"
          : "bg-slate-800 border-slate-700"
      }`}
    >
      <div className="text-2xl mb-1">{emoji}</div>
      <div className={`text-3xl font-bold ${highlight ? "text-pink-400" : "text-white"}`}>
        {value.toLocaleString()}
      </div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}
