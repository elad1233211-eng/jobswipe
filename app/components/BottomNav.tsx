"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import MatchBadge from "./MatchBadge";

type NavItem = {
  href: string;
  icon: string;
  label: string;
  badge?: boolean;
};

const CANDIDATE_ITEMS: NavItem[] = [
  { href: "/app/feed",    icon: "🔥", label: "משרות" },
  { href: "/app/history", icon: "📋", label: "היסטוריה" },
  { href: "/app/matches", icon: "💬", label: "הודעות", badge: true },
  { href: "/app/profile", icon: "👤", label: "פרופיל" },
];

const EMPLOYER_ITEMS: NavItem[] = [
  { href: "/app/employer", icon: "🏢", label: "המשרות" },
  { href: "/app/matches",  icon: "💬", label: "הודעות", badge: true },
  { href: "/app/profile",  icon: "⚙️", label: "הגדרות" },
];

export default function BottomNav({
  role,
  unseenMatches,
}: {
  role: "candidate" | "employer";
  unseenMatches: number;
}) {
  const pathname = usePathname();
  const items = role === "candidate" ? CANDIDATE_ITEMS : EMPLOYER_ITEMS;

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white/95 backdrop-blur border-t border-slate-200 flex justify-around py-1 z-10">
      {items.map((item) => {
        // Active: exact match OR prefix for nested routes
        const isActive =
          pathname === item.href ||
          (item.href !== "/app/feed" &&
            item.href !== "/app/history" &&
            item.href !== "/app/profile" &&
            pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center text-xs px-3 py-2 rounded-xl transition-colors ${
              isActive
                ? "text-pink-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {/* Icon with active bg pill */}
            <span
              className={`text-2xl mb-0.5 leading-none transition-transform ${
                isActive ? "scale-110" : ""
              }`}
            >
              {item.icon}
            </span>

            {/* Label */}
            <span className={`font-medium ${isActive ? "font-bold" : ""}`}>
              {item.label}
            </span>

            {/* Active dot indicator */}
            {isActive && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-pink-500" />
            )}

            {/* Unread badge */}
            {item.badge && <MatchBadge initial={unseenMatches} />}
          </Link>
        );
      })}
    </nav>
  );
}
