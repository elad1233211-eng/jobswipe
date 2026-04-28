import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import {
  getFeedForCandidate,
  getJobCategories,
  getJobCities,
} from "@/lib/domain";
import SwipeFeed from "./SwipeFeed";
import FeedFilters from "./FeedFilters";

export default async function FeedPage(props: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "candidate") redirect("/app/employer");

  const sp = (await props.searchParams) ?? {};
  const city = typeof sp.city === "string" ? sp.city : "";
  const category = typeof sp.category === "string" ? sp.category : "";
  const wageStr = typeof sp.wage === "string" ? sp.wage : "";
  const minWage = wageStr ? Number(wageStr) || undefined : undefined;
  const hasFilters = !!(city || category || minWage);

  const jobs = getFeedForCandidate(user.id, { city, category, minWage });
  const allCities = getJobCities();
  const allCategories = getJobCategories();

  return (
    <div className="flex-1 flex flex-col">
      <FeedFilters
        cities={allCities}
        categories={allCategories}
        initial={{ city, category, wage: wageStr }}
      />

      {jobs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="text-6xl mb-4">{hasFilters ? "🔍" : "✨"}</div>
          <h2 className="text-xl font-bold mb-2">
            {hasFilters
              ? "אין משרות שמתאימות לסינון"
              : "אין כרגע משרות חדשות"}
          </h2>
          <p className="text-slate-500 mb-4">
            {hasFilters
              ? "נסה להרחיב את הסינון או לאפס אותו."
              : "כבר עברת על כל המשרות הזמינות. חזור מאוחר יותר!"}
          </p>
          {hasFilters ? (
            <Link
              href="/app/feed"
              className="bg-brand-gradient text-white px-6 py-3 rounded-xl font-semibold"
            >
              איפוס סינון
            </Link>
          ) : (
            <Link
              href="/app/matches"
              className="bg-brand-gradient text-white px-6 py-3 rounded-xl font-semibold"
            >
              ההודעות שלי 💬
            </Link>
          )}
        </div>
      ) : (
        <SwipeFeed
          jobs={jobs.map((j) => ({
            id: j.id,
            title: j.title,
            category: j.category,
            city: j.city,
            hourly_wage: j.hourly_wage,
            hours_per_week: j.hours_per_week,
            shift_type: j.shift_type,
            description: j.description,
            requirements: JSON.parse(j.requirements_json || "[]") as string[],
            company_name: j.company_name,
            logo_emoji: j.logo_emoji,
          }))}
        />
      )}
    </div>
  );
}
