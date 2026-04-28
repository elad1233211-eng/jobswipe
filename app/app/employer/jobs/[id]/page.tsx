import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getJob } from "@/lib/domain";
import { getDb, type CandidateRow } from "@/lib/db";
import CandidateSwipe from "./CandidateSwipe";
import JobActions from "./JobActions";
import JobStats from "./JobStats";

export default async function JobDetail(
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "employer") redirect("/app/feed");

  const job = getJob(id);
  if (!job || job.employer_id !== user.id) notFound();

  // candidates who liked THIS job, that the employer hasn't responded to yet
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT c.*
       FROM swipes s
       JOIN candidates c ON c.user_id = s.from_user_id
       WHERE s.target_kind = 'job'
         AND s.direction = 'like'
         AND s.target_id = ?
         AND NOT EXISTS (
           SELECT 1 FROM swipes s2
           WHERE s2.from_user_id = ?
             AND s2.target_kind = 'candidate'
             AND s2.target_id = s.from_user_id
         )
       ORDER BY s.created_at DESC`
    )
    .all(id, user.id) as CandidateRow[];

  const candidates = rows.map((c) => ({
    user_id: c.user_id,
    full_name: c.full_name,
    age: c.age,
    city: c.city,
    bio: c.bio,
    experience_years: c.experience_years,
    min_hourly_wage: c.min_hourly_wage,
    available_immediately: !!c.available_immediately,
    avatar_emoji: c.avatar_emoji,
    avatar_b64: c.avatar_b64 ?? null,
    skills: JSON.parse(c.skills_json || "[]") as string[],
    experience_json: c.experience_json ?? "{}",
  }));

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/app/employer" className="text-slate-500">
          ← חזרה
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">{job.title}</h1>
            <p className="text-sm text-slate-500">
              {job.category} · {job.city}
              {job.hourly_wage ? ` · ${job.hourly_wage} ₪/שעה` : ""}
            </p>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
              job.is_active
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {job.is_active ? "פעילה" : "מושבתת"}
          </span>
        </div>
        {job.description && (
          <p className="text-sm text-slate-700 whitespace-pre-wrap">
            {job.description}
          </p>
        )}
        <JobActions jobId={job.id} isActive={!!job.is_active} />
        <JobStats jobId={job.id} />
      </div>

      <div>
        <h2 className="text-lg font-bold mb-2">
          מועמדים שסימנו לייק ({candidates.length})
        </h2>
        {candidates.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            עדיין אין מועמדים שסימנו לייק על המשרה הזו.
            <br />
            נסה שוב מאוחר יותר!
          </div>
        ) : (
          <CandidateSwipe jobId={job.id} candidates={candidates} />
        )}
      </div>
    </div>
  );
}
