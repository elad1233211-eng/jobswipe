import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  getCandidateProfile,
  getEmployerProfile,
  listBlockedUsers,
} from "@/lib/domain";
import { logoutAction } from "@/app/actions/auth";
import BlockButton from "@/app/components/BlockButton";
import DeleteAccountButton from "@/app/components/DeleteAccountButton";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const blocked = listBlockedUsers(user.id);

  if (user.role === "candidate") {
    const p = getCandidateProfile(user.id);
    if (!p) redirect("/onboarding/candidate");
    const skills = JSON.parse(p.skills_json || "[]") as string[];
    const expMap: Record<string, number | null> = JSON.parse(p.experience_json || "{}");
    return (
      <div className="p-4 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-200 mx-auto mb-2 flex items-center justify-center bg-slate-50">
            {p.avatar_b64 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.avatar_b64} alt={p.full_name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-5xl">{p.avatar_emoji}</span>
            )}
          </div>
          <h1 className="text-xl font-bold">{p.full_name}</h1>
          <p className="text-slate-500">
            {p.age ? `גיל ${p.age} · ` : ""}
            {p.city ?? ""}
          </p>
          {p.available_immediately ? (
            <span className="inline-block mt-2 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
              זמין/ה להתחיל מיד
            </span>
          ) : null}
        </div>

        <InfoRow label="אימייל" value={user.email} />
        {p.bio && <InfoRow label="קצת עליי" value={p.bio} />}
        {p.experience_years !== null && (
          <InfoRow label="שנות ניסיון" value={String(p.experience_years)} />
        )}
        {p.min_hourly_wage !== null && (
          <InfoRow label="שכר שעתי מינימלי" value={`${p.min_hourly_wage} ₪`} />
        )}
        {skills.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="text-xs text-slate-500 mb-2">כישורים וניסיון</div>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => {
                const yrs = expMap[s];
                return (
                  <span
                    key={s}
                    className="bg-pink-50 text-pink-700 text-sm px-3 py-1 rounded-full"
                  >
                    {s}{yrs != null ? ` · ${yrs} שנים` : ""}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <Link
          href="/onboarding/candidate"
          className="block bg-white border border-slate-200 text-center py-3 rounded-xl font-semibold"
        >
          עריכת פרופיל
        </Link>

        <BlockedSection blocked={blocked} />

        <LegalLinks />

        <form action={logoutAction}>
          <button className="w-full bg-red-50 text-red-600 border border-red-100 py-3 rounded-xl font-semibold">
            יציאה
          </button>
        </form>

        <div className="text-center pb-2">
          <DeleteAccountButton />
        </div>
      </div>
    );
  }

  // Employer
  const e = getEmployerProfile(user.id);
  if (!e) redirect("/onboarding/employer");
  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
        <div className="text-6xl mb-2">{e.logo_emoji}</div>
        <h1 className="text-xl font-bold">{e.company_name}</h1>
        <p className="text-slate-500">
          {e.contact_name ? `${e.contact_name} · ` : ""}
          {e.city ?? ""}
        </p>
      </div>
      <InfoRow label="אימייל" value={user.email} />
      {e.description && <InfoRow label="תיאור" value={e.description} />}

      <Link
        href="/onboarding/employer"
        className="block bg-white border border-slate-200 text-center py-3 rounded-xl font-semibold"
      >
        עריכת פרטי העסק
      </Link>

      <BlockedSection blocked={blocked} />

      <LegalLinks />

      <form action={logoutAction}>
        <button className="w-full bg-red-50 text-red-600 border border-red-100 py-3 rounded-xl font-semibold">
          יציאה
        </button>
      </form>

      <div className="text-center pb-2">
        <DeleteAccountButton />
      </div>
    </div>
  );
}

function BlockedSection({
  blocked,
}: {
  blocked: { user_id: string; display_name: string; avatar_emoji: string }[];
}) {
  if (blocked.length === 0) return null;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className="text-xs text-slate-500 mb-2">משתמשים חסומים</div>
      <ul className="space-y-2">
        {blocked.map((b) => (
          <li
            key={b.user_id}
            className="flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-2xl shrink-0">{b.avatar_emoji}</span>
              <span className="truncate">{b.display_name}</span>
            </div>
            <BlockButton userId={b.user_id} mode="unblock" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function LegalLinks() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 text-sm">
      <div className="text-xs text-slate-500 mb-2">מידע משפטי</div>
      <ul className="space-y-1">
        <li>
          <Link href="/legal/privacy" className="text-slate-700 hover:text-pink-600">
            מדיניות פרטיות
          </Link>
        </li>
        <li>
          <Link href="/legal/terms" className="text-slate-700 hover:text-pink-600">
            תנאי שימוש
          </Link>
        </li>
        <li>
          <Link href="/legal/accessibility" className="text-slate-700 hover:text-pink-600">
            הצהרת נגישות
          </Link>
        </li>
      </ul>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="whitespace-pre-wrap">{value}</div>
    </div>
  );
}
