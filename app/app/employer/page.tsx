import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getEmployerProfile, getJobsByEmployer } from "@/lib/domain";

export default async function EmployerHome() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "employer") redirect("/app/feed");

  const emp = getEmployerProfile(user.id);
  if (!emp) redirect("/onboarding/employer");

  const jobs = getJobsByEmployer(user.id);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="text-4xl">{emp.logo_emoji}</div>
        <div>
          <h1 className="text-xl font-bold">{emp.company_name}</h1>
          <p className="text-sm text-slate-500">{emp.city}</p>
        </div>
      </div>

      <Link
        href="/app/employer/jobs/new"
        className="block bg-brand-gradient text-white text-center font-semibold py-3 rounded-xl"
      >
        + פרסום משרה חדשה
      </Link>

      <div>
        <h2 className="text-lg font-bold mb-3">המשרות שלך ({jobs.length})</h2>
        {jobs.length === 0 ? (
          <p className="text-slate-500 text-center py-10">
            עדיין לא פרסמת משרות. נסה לפרסם אחת כדי להתחיל!
          </p>
        ) : (
          <div className="space-y-3">
            {jobs.map((j) => (
              <Link
                key={j.id}
                href={`/app/employer/jobs/${j.id}`}
                className="block bg-white rounded-2xl border border-slate-200 p-4 hover:border-violet-400 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold">{j.title}</h3>
                    <p className="text-sm text-slate-500">
                      {j.category} · {j.city}
                      {j.hourly_wage ? ` · ${j.hourly_wage} ₪/שעה` : ""}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      j.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {j.is_active ? "פעילה" : "מושבתת"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
