import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getEmployerProfile, getJobsByEmployer } from "@/lib/domain";
import Avatar from "@/app/components/Avatar";

const CATEGORY_COLORS: Record<string, string> = {
  "מסעדנות":   "bg-orange-100 text-orange-700",
  "מלצרות":    "bg-orange-100 text-orange-700",
  "שליחויות":  "bg-blue-100 text-blue-700",
  "לוגיסטיקה": "bg-blue-100 text-blue-700",
  "ניקיון":    "bg-teal-100 text-teal-700",
  "קמעונאות":  "bg-violet-100 text-violet-700",
  "קופאי":     "bg-violet-100 text-violet-700",
  "מחסן":      "bg-amber-100 text-amber-700",
  "שמירה":     "bg-slate-100 text-slate-700",
};

export default async function EmployerHome() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "employer") redirect("/app/feed");

  const emp = getEmployerProfile(user.id);
  if (!emp) redirect("/onboarding/employer");

  const jobs = getJobsByEmployer(user.id);
  const activeJobs = jobs.filter((j) => j.is_active).length;

  return (
    <div className="p-4 space-y-4 page-enter">
      {/* Company card */}
      <div className="bg-brand-gradient rounded-2xl p-5 text-white flex items-center gap-4">
        <Avatar name={emp.company_name} emoji={emp.logo_emoji} size="lg" />
        <div className="min-w-0">
          <h1 className="text-xl font-bold truncate">{emp.company_name}</h1>
          <p className="text-sm opacity-80">{emp.city ?? ""}</p>
          <p className="text-xs opacity-70 mt-1">{activeJobs} משרות פעילות</p>
        </div>
      </div>

      {/* New job CTA */}
      <Link
        href="/app/employer/jobs/new"
        className="flex items-center justify-center gap-2 bg-brand-gradient text-white text-center font-semibold py-3.5 rounded-2xl shadow-md"
      >
        <span className="text-lg">＋</span>
        פרסום משרה חדשה
      </Link>

      {/* Jobs list */}
      <div>
        <h2 className="text-lg font-bold mb-3">המשרות שלך ({jobs.length})</h2>
        {jobs.length === 0 ? (
          <div className="text-center py-16 text-slate-500 space-y-3">
            <div className="text-5xl">📋</div>
            <p className="font-medium">עדיין לא פרסמת משרות</p>
            <p className="text-sm">לחץ על הכפתור למעלה כדי להתחיל!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {jobs.map((j) => {
              const catColor = CATEGORY_COLORS[j.category] ?? "bg-pink-100 text-pink-700";
              return (
                <Link
                  key={j.id}
                  href={`/app/employer/jobs/${j.id}`}
                  className="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 p-4 hover:border-pink-300 hover:shadow-sm transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold truncate">{j.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${j.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                        {j.is_active ? "פעילה" : "מושבתת"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catColor}`}>
                        {j.category}
                      </span>
                      <span className="text-xs text-slate-500">📍 {j.city}</span>
                      {j.hourly_wage ? (
                        <span className="text-xs text-slate-500">💰 {j.hourly_wage} ₪/שעה</span>
                      ) : null}
                    </div>
                  </div>
                  <span className="text-slate-300 text-lg shrink-0">›</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
