import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import {
  getCandidateProfile,
  getEmployerProfile,
  countUnseenMatches,
} from "@/lib/domain";
import { logoutAction } from "@/app/actions/auth";
import VerifyBanner from "@/app/components/VerifyBanner";
import PushPrompt from "@/app/components/PushPrompt";
import MatchBadge from "@/app/components/MatchBadge";

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
      {/* Push permission prompt (shown once, client-side only) */}
      <PushPrompt />
      {/* Email verification banner */}
      {!user.email_verified_at && <VerifyBanner />}
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <Link href={isCandidate ? "/app/feed" : "/app/employer"} className="flex items-center gap-2">
          <span className="text-2xl">💼❤️</span>
          <span className="font-bold">JobSwipe</span>
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-sm text-slate-500 hover:text-red-500"
          >
            יציאה
          </button>
        </form>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col pb-20">{children}</div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t border-slate-200 flex justify-around py-2 z-10">
        {isCandidate ? (
          <>
            <NavLink href="/app/feed" emoji="🔥" label="גלו משרות" />
            <NavLink href="/app/history" emoji="📋" label="היסטוריה" />
            <NavLinkWithBadge
              href="/app/matches"
              emoji="💬"
              label="הודעות"
              initialBadge={unseenMatches}
            />
            <NavLink href="/app/profile" emoji="👤" label="פרופיל" />
          </>
        ) : (
          <>
            <NavLink href="/app/employer" emoji="🏢" label="המשרות שלי" />
            <NavLinkWithBadge
              href="/app/matches"
              emoji="💬"
              label="הודעות"
              initialBadge={unseenMatches}
            />
            <NavLink href="/app/profile" emoji="⚙️" label="הגדרות" />
          </>
        )}
      </nav>
    </div>
  );
}

function NavLink({
  href,
  emoji,
  label,
}: {
  href: string;
  emoji: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="relative flex flex-col items-center text-xs text-slate-600 hover:text-pink-600 px-3 py-1"
    >
      <span className="text-2xl">{emoji}</span>
      <span>{label}</span>
    </Link>
  );
}

/** Nav link whose badge count is kept live via client-side polling. */
function NavLinkWithBadge({
  href,
  emoji,
  label,
  initialBadge,
}: {
  href: string;
  emoji: string;
  label: string;
  initialBadge: number;
}) {
  return (
    <Link
      href={href}
      className="relative flex flex-col items-center text-xs text-slate-600 hover:text-pink-600 px-3 py-1"
    >
      <span className="text-2xl">{emoji}</span>
      <span>{label}</span>
      <MatchBadge initial={initialBadge} />
    </Link>
  );
}
