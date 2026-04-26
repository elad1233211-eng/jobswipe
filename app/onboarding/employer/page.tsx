import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getEmployerProfile } from "@/lib/domain";
import EmployerProfileForm from "./EmployerProfileForm";

export default async function EmployerOnboarding() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "employer") redirect("/onboarding/candidate");

  const existing = getEmployerProfile(user.id);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">פרטי העסק</h1>
      <p className="text-slate-500 mb-6">
        שנייה אחת ונסיים. המידע יוצג למועמדים רלוונטיים.
      </p>
      <EmployerProfileForm
        initial={
          existing
            ? {
                company_name: existing.company_name,
                contact_name: existing.contact_name ?? "",
                city: existing.city ?? "",
                description: existing.description ?? "",
                logo_emoji: existing.logo_emoji ?? "🏢",
              }
            : null
        }
      />
    </div>
  );
}
