import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getSwipeHistoryForCandidate } from "@/lib/domain";

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "candidate") redirect("/app/employer");

  const history = getSwipeHistoryForCandidate(user.id, 200);
  const likes = history.filter((h) => h.direction === "like");
  const passes = history.filter((h) => h.direction === "pass");

  return (
    <div className="p-4 space-y-5">
      <h1 className="text-xl font-bold">היסטוריית סוויפים</h1>

      {history.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <div className="text-5xl mb-3">🫙</div>
          <p>עדיין לא עשית סוויפ על אף משרה.</p>
          <Link href="/app/feed" className="mt-4 inline-block bg-pink-500 text-white px-5 py-2 rounded-xl text-sm font-medium">
            לפיד המשרות →
          </Link>
        </div>
      )}

      {likes.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            ❤️ לייקתי ({likes.length})
          </h2>
          <div className="space-y-2">
            {likes.map((j) => (
              <JobCard key={`${j.id}-like`} job={j} />
            ))}
          </div>
        </section>
      )}

      {passes.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            👎 דילגתי ({passes.length})
          </h2>
          <div className="space-y-2 opacity-60">
            {passes.map((j) => (
              <JobCard key={`${j.id}-pass`} job={j} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function JobCard({ job }: { job: ReturnType<typeof getSwipeHistoryForCandidate>[number] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
      <span className="text-2xl shrink-0">{job.logo_emoji}</span>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-sm truncate">{job.title}</div>
        <div className="text-xs text-slate-500">
          {job.company_name} · {job.city}
          {job.hourly_wage ? ` · ${job.hourly_wage} ₪/שעה` : ""}
        </div>
      </div>
      <div className="text-xs text-slate-400 shrink-0">
        {new Date(job.swiped_at).toLocaleDateString("he-IL")}
      </div>
    </div>
  );
}
