import { notFound } from "next/navigation";
import Link from "next/link";
import { getCandidateProfile, getUserById } from "@/lib/domain";

export default async function PublicCandidatePage(
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;

  const user = getUserById(id);
  if (!user || user.role !== "candidate") notFound();

  const profile = getCandidateProfile(id);
  if (!profile) notFound();

  const skills: string[] = JSON.parse(profile.skills_json || "[]");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header gradient */}
        <div className="bg-gradient-to-r from-pink-500 to-violet-500 p-6 text-white text-center">
          <div className="text-6xl mb-2">{profile.avatar_emoji}</div>
          <h1 className="text-2xl font-bold">{profile.full_name}</h1>
          {profile.city && (
            <p className="text-pink-100 text-sm mt-1">📍 {profile.city}</p>
          )}
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          {/* Quick stats */}
          <div className="flex flex-wrap gap-3">
            {profile.age && (
              <StatChip emoji="🎂" label={`גיל ${profile.age}`} />
            )}
            {profile.experience_years != null && profile.experience_years > 0 && (
              <StatChip emoji="💼" label={`${profile.experience_years} שנות ניסיון`} />
            )}
            {profile.min_hourly_wage && (
              <StatChip emoji="₪" label={`${profile.min_hourly_wage}+ לשעה`} />
            )}
            <StatChip
              emoji={profile.available_immediately ? "✅" : "⏳"}
              label={profile.available_immediately ? "זמין/ה מיד" : "לא זמין/ה מיד"}
            />
          </div>

          {/* Bio */}
          {profile.bio && (
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">
                קצת עליי
              </h2>
              <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                כישורים
              </h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-pink-50 text-pink-700 text-xs px-3 py-1 rounded-full border border-pink-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="border-t border-slate-100 p-4 text-center">
          <Link
            href="/signup?role=employer"
            className="inline-block bg-pink-500 hover:bg-pink-600 text-white font-medium px-6 py-2 rounded-lg text-sm transition"
          >
            💼 רוצה לגייס? הצטרף ל-JobSwipe
          </Link>
          <p className="text-xs text-slate-400 mt-2">מוצאים עבודה בסוויפ 🇮🇱</p>
        </div>
      </div>

      <Link href="/" className="mt-6 text-sm text-slate-400 hover:text-slate-600">
        ← חזרה לעמוד הראשי
      </Link>
    </div>
  );
}

function StatChip({ emoji, label }: { emoji: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs px-3 py-1 rounded-full">
      <span>{emoji}</span>
      <span>{label}</span>
    </span>
  );
}
