import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  getCandidateProfile,
  getEmployerProfile,
  countUnseenMatches,
} from "@/lib/domain";
import { logoutAction } from "@/app/actions/auth";
import VerifyBanner from "@/app/components/VerifyBanner";
import PushPrompt from "@/app/components/PushPrompt";
import BottomNav from "@/app/components/BottomNav";
import AppHeader from "@/app/components/AppHeader";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Force onboarding if profile is missing
  if (user.role === "candidate" && !getCandidateProfile(user.id)) {
    redirect("/onboarding/candidate");
  }
  if (user.role === "employer" && !getEmployerProfile(user.id)) {
    redirect("/onboarding/employer");
  }

  const isCandidate = user.role === "candidate";
  const unseenMatches = countUnseenMatches(user.id);

  return (
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full bg-white min-h-screen">
      <PushPrompt />
      {!user.email_verified_at && <VerifyBanner />}

      <AppHeader
        homeHref={isCandidate ? "/app/feed" : "/app/employer"}
        logoutAction={logoutAction}
      />

      {/* Content */}
      <div className="flex-1 flex flex-col pb-20">{children}</div>

      <BottomNav
        role={user.role}
        unseenMatches={unseenMatches}
      />
    </div>
  );
}
