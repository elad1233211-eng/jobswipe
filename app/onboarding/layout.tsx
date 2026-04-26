import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <div className="flex-1 flex items-start sm:items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-lg bg-white rounded-3xl card-shadow p-6 md:p-8 my-6">
        {children}
      </div>
    </div>
  );
}
