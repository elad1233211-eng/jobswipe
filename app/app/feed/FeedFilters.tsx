"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function FeedFilters({
  cities,
  categories,
  initial,
}: {
  cities: string[];
  categories: string[];
  initial: { city: string; category: string; wage: string };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [city, setCity] = useState(initial.city);
  const [category, setCategory] = useState(initial.category);
  const [wage, setWage] = useState(initial.wage);
  const [, startTransition] = useTransition();

  const activeCount =
    (initial.city ? 1 : 0) +
    (initial.category ? 1 : 0) +
    (initial.wage ? 1 : 0);

  function apply() {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (category) params.set("category", category);
    if (wage) params.set("wage", wage);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/app/feed?${qs}` : "/app/feed");
      setOpen(false);
    });
  }

  function reset() {
    setCity("");
    setCategory("");
    setWage("");
    startTransition(() => {
      router.push("/app/feed");
      setOpen(false);
    });
  }

  return (
    <div className="px-4 pt-3 pb-2 border-b border-slate-100 bg-white sticky top-[57px] z-10">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-sm font-semibold text-slate-600"
      >
        <span>
          🔧 סינון{" "}
          {activeCount > 0 && (
            <span className="bg-pink-500 text-white text-xs rounded-full px-2 py-0.5 mr-1">
              {activeCount}
            </span>
          )}
        </span>
        <span className="text-slate-400">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="space-y-3 mt-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">עיר</label>
            <input
              list="city-list"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="כל הערים"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
            <datalist id="city-list">
              {cities.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">קטגוריה</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">כל הקטגוריות</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">
              שכר שעתי מינימלי (₪)
            </label>
            <input
              type="number"
              min={0}
              max={1000}
              value={wage}
              onChange={(e) => setWage(e.target.value)}
              placeholder="0"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={apply}
              className="flex-1 bg-brand-gradient text-white font-semibold py-2 rounded-lg text-sm"
            >
              החל סינון
            </button>
            <button
              onClick={reset}
              className="px-4 border border-slate-300 text-slate-600 font-semibold py-2 rounded-lg text-sm"
            >
              איפוס
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
