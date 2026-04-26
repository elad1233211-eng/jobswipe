import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getMatchesForCandidate, getMatchesForEmployer } from "@/lib/domain";

function formatTime(ms: number | null): string {
  if (!ms) return "";
  const d = new Date(ms);
  const today = new Date();
  if (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  ) {
    return d.toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" });
}

export default async function MatchesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const matches =
    user.role === "candidate"
      ? getMatchesForCandidate(user.id)
      : getMatchesForEmployer(user.id);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">ההתאמות שלי</h1>
      {matches.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <div className="text-5xl mb-3">💬</div>
          <p>עדיין אין התאמות.</p>
          <p className="text-sm mt-1">
            {user.role === "candidate"
              ? "המשך לסוויפ על משרות כדי להגדיל את הסיכוי!"
              : "ברגע שמישהו יסמן לך לייק, יופיע כאן."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {matches.map((m) => (
            <Link
              key={m.match_id}
              href={`/app/matches/${m.match_id}`}
              className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 p-3 hover:border-pink-400 transition"
            >
              <div className="text-4xl">{m.other_party_emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold truncate">{m.other_party_name}</h3>
                  <span className="text-xs text-slate-400 mr-2">
                    {formatTime(m.last_message_at ?? m.created_at)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate">
                  {m.job_title}
                  {m.other_party_city ? ` · ${m.other_party_city}` : ""}
                </p>
                <p className="text-sm text-slate-600 truncate">
                  {m.last_message ?? "התחילו את השיחה 👋"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
