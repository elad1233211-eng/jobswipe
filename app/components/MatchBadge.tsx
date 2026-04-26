"use client";

/**
 * Polls /api/badge every 30 s and keeps the unseen-match count fresh
 * without a full page reload. Accepts the SSR-rendered initial value so
 * the first paint is instant.
 */

import { useEffect, useState } from "react";

export default function MatchBadge({ initial }: { initial: number }) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    const refresh = () =>
      fetch("/api/badge")
        .then((r) => r.json())
        .then((d: { unseen: number }) => setCount(d.unseen))
        .catch(() => {});

    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, []);

  if (count <= 0) return null;
  return (
    <span className="absolute top-0 left-2 bg-pink-500 text-white text-[10px] min-w-[18px] h-[18px] rounded-full px-1 flex items-center justify-center font-bold">
      {count > 99 ? "99+" : count}
    </span>
  );
}
