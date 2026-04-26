import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCandidateProfile } from "@/lib/domain";
import CandidateProfileForm from "./CandidateProfileForm";

export default async function CandidateOnboarding() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "candidate") redirect("/onboarding/employer");

  const existing = getCandidateProfile(user.id);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">ספר/י לנו עליך</h1>
      <p className="text-slate-500 mb-6">
        זה אמור לקחת כ-דקה. אפשר לערוך הכל בהמשך.
      </p>
      <CandidateProfileForm
        initial={
          existing
            ? {
                full_name: existing.full_name,
                age: existing.age ?? "",
                city: existing.city ?? "",
                bio: existing.bio ?? "",
                experience_years: existing.experience_years ?? "",
                min_hourly_wage: existing.min_hourly_wage ?? "",
                available_immediately: !!existing.available_immediately,
                avatar_emoji: existing.avatar_emoji ?? "👤",
                skills: JSON.parse(existing.skills_json || "[]").join(", "),
              }
            : null
        }
      />
    </div>
  );
}
