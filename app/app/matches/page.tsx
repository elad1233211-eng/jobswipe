import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getMatchesForCandidate, getMatchesForEmployer } from "@/lib/domain";
import Avatar from "@/app/components/Avatar";

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
    <div className="p-4 page-enter">
      {matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <div className="w-20 h-20 rounded-full bg-pink-50 flex items-center justify-center text-5xl mb-2">
            💬
          </div>
          <h2 className="text-xl font-bold text-slate-700">אין התאמות עדיין</h2>
          <p className="text-slate-500 text-sm max-w-xs">
            {user.role === "candidate"
              ? "המשך לסוויפ על משרות כדי להגדיל את הסיכוי להתאמה!"
              : "ברגע שמועמד יסמן לייק על אחת מהמשרות שלך, תוכל להגיב כאן."}
          </p>
          {user.role === "candidate" && (
            <Link
              href="/app/feed"
              className="mt-2 bg-brand-gradient text-white px-6 py-2.5 rounded-xl font-semibold text-sm"
            >
              לסוויפ 🔥
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {matches.map((m) => {
            const hasUnread = !m.last_message; // No messages = new match, treat as unread
            return (
              <Link
                key={m.match_id}
                href={`/app/matches/${m.match_id}`}
                className={`flex items-center gap-3 rounded-2xl border p-3 transition-all ${
                  hasUnread
                    ? "bg-pink-50 border-pink-200 hover:border-pink-400"
                    : "bg-white border-slate-100 hover:border-pink-300"
                }`}
              >
                <Avatar
                  name={m.other_party_name}
                  emoji={m.other_party_emoji}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <h3 className={`truncate ${hasUnread ? "font-extrabold text-slate-900" : "font-bold text-slate-800"}`}>
                      {m.other_party_name}
                    </h3>
                    <span className="text-xs text-slate-400 shrink-0 mr-1">
                      {formatTime(m.last_message_at ?? m.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-pink-500 font-medium truncate mb-0.5">
                    {m.job_title}
                    {m.other_party_city ? ` · ${m.other_party_city}` : ""}
                  </p>
                  <p className={`text-sm truncate ${hasUnread ? "text-slate-700 font-medium" : "text-slate-500"}`}>
                    {m.last_message ?? "🎉 יש התאמה! התחילו שיחה"}
                  </p>
                </div>
                {hasUnread && (
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shrink-0" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
