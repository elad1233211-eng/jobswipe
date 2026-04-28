"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/app/feed":     "גלה משרות",
  "/app/history":  "היסטוריית סוויפים",
  "/app/matches":  "הודעות",
  "/app/profile":  "פרופיל",
  "/app/employer": "המשרות שלי",
};

export default function AppHeader({
  homeHref,
  logoutAction,
}: {
  homeHref: string;
  logoutAction: () => Promise<void>;
}) {
  const pathname = usePathname();

  // Find longest matching prefix
  const title =
    PAGE_TITLES[pathname] ??
    Object.entries(PAGE_TITLES)
      .filter(([k]) => pathname.startsWith(k))
      .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ??
    "JobSwipe";

  return (
    <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-100 px-4 py-3 flex items-center justify-between">
      <Link href={homeHref} className="flex items-center gap-2 shrink-0">
        <span className="text-xl">💼❤️</span>
      </Link>

      <h1 className="text-base font-bold text-slate-800 absolute left-1/2 -translate-x-1/2">
        {title}
      </h1>

      <form action={logoutAction}>
        <button
          type="submit"
          className="text-sm text-slate-400 hover:text-red-500 transition-colors"
        >
          יציאה
        </button>
      </form>
    </header>
  );
}
