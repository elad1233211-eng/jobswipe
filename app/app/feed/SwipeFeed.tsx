"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { swipeJobAction, undoSwipeAction } from "@/app/actions/swipe";
import ReportDialog from "@/app/components/ReportDialog";

type Job = {
  id: string;
  title: string;
  category: string;
  city: string;
  hourly_wage: number | null;
  hours_per_week: number | null;
  shift_type: string | null;
  description: string | null;
  requirements: string[];
  company_name: string;
  logo_emoji: string;
};

export default function SwipeFeed({ jobs }: { jobs: Job[] }) {
  const [stack, setStack] = useState(jobs);
  const [lastSwiped, setLastSwiped] = useState<Job | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [matchInfo, setMatchInfo] = useState<{
    matchId: string;
    company: string;
    title: string;
  } | null>(null);
  const [, startTransition] = useTransition();

  const current = stack[stack.length - 1];

  function handleSwipe(direction: "like" | "pass") {
    if (!current) return;
    const jobId = current.id;
    const job = current;
    setStack((prev) => prev.slice(0, -1));
    setLastSwiped(job);
    setCanUndo(false); // disable until server confirms

    startTransition(async () => {
      try {
        const res = await swipeJobAction(jobId, direction);
        if (res.matched && res.matchId) {
          setMatchInfo({ matchId: res.matchId, company: job.company_name, title: job.title });
          setCanUndo(false); // can't undo a match
        } else {
          setCanUndo(true); // show undo button
        }
      } catch {
        setStack((prev) => [...prev, job]);
        setCanUndo(false);
      }
    });
  }

  function handleUndo() {
    if (!lastSwiped || !canUndo) return;
    const job = lastSwiped;
    setCanUndo(false);
    setLastSwiped(null);

    startTransition(async () => {
      const restored = await undoSwipeAction();
      if (restored) {
        // Push back the card (use our local copy for richer type)
        setStack((prev) => [...prev, job]);
      }
    });
  }

  if (!current) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-xl font-bold mb-2">עברת על כל המשרות!</h2>
        <p className="text-slate-500 mb-4">חזור מאוחר יותר לעוד משרות חדשות</p>
        <Link
          href="/app/matches"
          className="bg-brand-gradient text-white px-6 py-3 rounded-xl font-semibold"
        >
          ההודעות שלי 💬
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center p-4">
      <div className="w-full max-w-sm flex justify-end mb-1">
        <ReportDialog targetKind="job" targetId={current.id} />
      </div>
      <div className="relative w-full max-w-sm h-[560px] mb-6">
        <AnimatePresence>
          {stack.slice(-3).map((job, idx, arr) => {
            const isTop = idx === arr.length - 1;
            const offset = arr.length - 1 - idx;
            return (
              <SwipeCard
                key={job.id}
                job={job}
                isTop={isTop}
                offset={offset}
                onSwipe={isTop ? handleSwipe : undefined}
              />
            );
          })}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="flex gap-4 items-center">
        {/* Undo — small, shown only after a non-match swipe */}
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          className="w-11 h-11 rounded-full bg-white card-shadow flex items-center justify-center text-xl border-2 border-slate-200 hover:border-amber-400 disabled:opacity-20 transition"
          aria-label="בטל"
          title="בטל סוויפ אחרון"
        >
          ↩️
        </button>

        <button
          onClick={() => handleSwipe("pass")}
          className="w-16 h-16 rounded-full bg-white card-shadow flex items-center justify-center text-3xl border-2 border-slate-200 hover:border-red-400 transition"
          aria-label="דילוג"
        >
          ❌
        </button>
        <button
          onClick={() => handleSwipe("like")}
          className="w-20 h-20 rounded-full bg-brand-gradient card-shadow flex items-center justify-center text-4xl text-white transition hover:scale-105"
          aria-label="לייק"
        >
          ❤️
        </button>
      </div>

      <AnimatePresence>
        {matchInfo && (
          <MatchDialog
            matchInfo={matchInfo}
            onClose={() => setMatchInfo(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SwipeCard({
  job,
  isTop,
  offset,
  onSwipe,
}: {
  job: Job;
  isTop: boolean;
  offset: number;
  onSwipe?: (d: "like" | "pass") => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-18, 0, 18]);
  const likeOpacity = useTransform(x, [40, 140], [0, 1]);
  const passOpacity = useTransform(x, [-140, -40], [1, 0]);

  const scale = 1 - offset * 0.04;
  const yOffset = offset * 10;

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        scale,
        y: yOffset,
        zIndex: 10 - offset,
        touchAction: isTop ? "none" : "auto",
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={(_, info) => {
        if (!onSwipe) return;
        if (info.offset.x > 120) onSwipe("like");
        else if (info.offset.x < -120) onSwipe("pass");
      }}
      initial={{ scale: scale * 0.95, opacity: 0 }}
      animate={{ scale, opacity: 1 }}
      exit={{
        x: x.get() > 0 ? 600 : x.get() < 0 ? -600 : 0,
        opacity: 0,
        transition: { duration: 0.3 },
      }}
    >
      <JobCardInner job={job} likeMV={likeOpacity} passMV={passOpacity} isTop={isTop} />
    </motion.div>
  );
}

function JobCardInner({
  job,
  likeMV,
  passMV,
  isTop,
}: {
  job: Job;
  likeMV: ReturnType<typeof useTransform<number, number>>;
  passMV: ReturnType<typeof useTransform<number, number>>;
  isTop: boolean;
}) {
  return (
    <div
      className="relative w-full h-full bg-white rounded-3xl card-shadow border border-slate-100 overflow-hidden flex flex-col"
      style={{ touchAction: isTop ? "none" : "auto" }}
    >
      {/* Header with gradient */}
      <div className="bg-brand-gradient p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-5xl">{job.logo_emoji}</div>
          <div>
            <div className="text-sm opacity-80">{job.company_name}</div>
            <h2 className="text-2xl font-bold leading-tight">{job.title}</h2>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-3 text-sm">
          <Chip>📍 {job.city}</Chip>
          {job.hourly_wage ? <Chip>💰 {job.hourly_wage} ₪/שעה</Chip> : null}
          {job.hours_per_week ? <Chip>⏱️ {job.hours_per_week} שעות/שבוע</Chip> : null}
          {job.shift_type ? <Chip>🕐 {job.shift_type}</Chip> : null}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-5 overflow-y-auto" style={{ touchAction: isTop ? "none" : "auto" }}>
        <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">
          קטגוריה
        </div>
        <div className="font-semibold mb-4">{job.category}</div>

        {job.description && (
          <>
            <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">
              תיאור
            </div>
            <p className="text-slate-700 mb-4 whitespace-pre-wrap">
              {job.description}
            </p>
          </>
        )}

        {job.requirements.length > 0 && (
          <>
            <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">
              דרישות
            </div>
            <ul className="space-y-1 text-slate-700">
              {job.requirements.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-brand">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Swipe overlays */}
      {isTop && (
        <>
          <motion.div
            style={{ opacity: likeMV }}
            className="absolute top-10 left-6 border-4 border-green-500 text-green-500 font-extrabold text-3xl px-4 py-2 rounded-xl rotate-[-20deg]"
          >
            LIKE
          </motion.div>
          <motion.div
            style={{ opacity: passMV }}
            className="absolute top-10 right-6 border-4 border-red-500 text-red-500 font-extrabold text-3xl px-4 py-2 rounded-xl rotate-[20deg]"
          >
            NOPE
          </motion.div>
        </>
      )}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-white">
      {children}
    </span>
  );
}

function MatchDialog({
  matchInfo,
  onClose,
}: {
  matchInfo: { matchId: string; company: string; title: string };
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50"
    >
      <motion.div
        initial={{ scale: 0.85, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 text-center max-w-sm w-full"
      >
        <div className="text-6xl mb-3">🎉</div>
        <h2 className="text-3xl font-extrabold bg-brand-gradient bg-clip-text text-transparent mb-2">
          יש התאמה!
        </h2>
        <p className="text-slate-600 mb-6">
          {matchInfo.company} מעוניינים בך עבור{" "}
          <span className="font-bold">{matchInfo.title}</span>
        </p>
        <div className="flex flex-col gap-2">
          <Link
            href={`/app/matches/${matchInfo.matchId}`}
            className="bg-brand-gradient text-white font-bold py-3 rounded-xl"
          >
            שלח הודעה 💬
          </Link>
          <button
            onClick={onClose}
            className="text-slate-500 font-semibold py-3"
          >
            המשך לסוויפ
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
