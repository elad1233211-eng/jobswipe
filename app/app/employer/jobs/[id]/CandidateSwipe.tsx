"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { swipeCandidateAction } from "@/app/actions/swipe";
import ReportDialog from "@/app/components/ReportDialog";

export type Candidate = {
  user_id: string;
  full_name: string;
  age: number | null;
  city: string | null;
  bio: string | null;
  experience_years: number | null;
  min_hourly_wage: number | null;
  available_immediately: boolean;
  avatar_emoji: string;
  skills: string[];
};

export default function CandidateSwipe({
  jobId,
  candidates,
}: {
  jobId: string;
  candidates: Candidate[];
}) {
  const [stack, setStack] = useState(candidates);
  const [matchInfo, setMatchInfo] = useState<{
    matchId: string;
    name: string;
  } | null>(null);
  const [, startTransition] = useTransition();
  const current = stack[stack.length - 1];

  function handleSwipe(direction: "like" | "pass") {
    if (!current) return;
    const c = current;
    setStack((prev) => prev.slice(0, -1));
    startTransition(async () => {
      try {
        const res = await swipeCandidateAction(c.user_id, jobId, direction);
        if (res.matched && res.matchId) {
          setMatchInfo({ matchId: res.matchId, name: c.full_name });
        }
      } catch {
        setStack((prev) => [...prev, c]);
      }
    });
  }

  if (!current) {
    return (
      <div className="text-center py-8 text-slate-500">
        סיימת לעבור על כל המועמדים!
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-sm flex justify-end mb-1">
        <ReportDialog targetKind="user" targetId={current.user_id} />
      </div>
      <div className="relative w-full max-w-sm h-[480px] mb-4">
        <AnimatePresence>
          {stack.slice(-3).map((c, idx, arr) => {
            const isTop = idx === arr.length - 1;
            const offset = arr.length - 1 - idx;
            return (
              <SwipeCard
                key={c.user_id}
                candidate={c}
                isTop={isTop}
                offset={offset}
                onSwipe={isTop ? handleSwipe : undefined}
              />
            );
          })}
        </AnimatePresence>
      </div>

      <div className="flex gap-6 items-center">
        <button
          onClick={() => handleSwipe("pass")}
          className="w-14 h-14 rounded-full bg-white card-shadow flex items-center justify-center text-2xl border-2 border-slate-200 hover:border-red-400"
          aria-label="דילוג"
        >
          ❌
        </button>
        <button
          onClick={() => handleSwipe("like")}
          className="w-16 h-16 rounded-full bg-brand-gradient card-shadow flex items-center justify-center text-3xl text-white hover:scale-105"
          aria-label="לייק"
        >
          ❤️
        </button>
      </div>

      <AnimatePresence>
        {matchInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50"
          >
            <motion.div
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-3xl p-8 text-center max-w-sm w-full"
            >
              <div className="text-6xl mb-3">🎉</div>
              <h2 className="text-3xl font-extrabold bg-brand-gradient bg-clip-text text-transparent mb-2">
                יש התאמה!
              </h2>
              <p className="text-slate-600 mb-6">
                התאמה עם <span className="font-bold">{matchInfo.name}</span>
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  href={`/app/matches/${matchInfo.matchId}`}
                  className="bg-brand-gradient text-white font-bold py-3 rounded-xl"
                >
                  שלח הודעה 💬
                </Link>
                <button
                  onClick={() => setMatchInfo(null)}
                  className="text-slate-500 font-semibold py-3"
                >
                  המשך
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SwipeCard({
  candidate,
  isTop,
  offset,
  onSwipe,
}: {
  candidate: Candidate;
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
      <div className="relative w-full h-full bg-white rounded-3xl card-shadow border border-slate-100 overflow-hidden flex flex-col">
        <div className="bg-brand-gradient p-6 text-white flex items-center gap-4">
          <div className="text-6xl">{candidate.avatar_emoji}</div>
          <div>
            <h2 className="text-2xl font-bold">{candidate.full_name}</h2>
            <div className="text-sm opacity-90">
              {candidate.age ? `גיל ${candidate.age} · ` : ""}
              {candidate.city ?? ""}
            </div>
            {candidate.available_immediately && (
              <div className="text-xs mt-1 bg-white/20 px-2 py-1 rounded-full inline-block">
                זמין/ה להתחיל מיד ✨
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {candidate.bio && (
            <div>
              <div className="text-xs text-slate-400 uppercase mb-1">קצת עליי</div>
              <p className="text-slate-700 whitespace-pre-wrap">{candidate.bio}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {candidate.experience_years !== null && (
              <Stat
                label="ניסיון"
                value={`${candidate.experience_years} שנים`}
              />
            )}
            {candidate.min_hourly_wage !== null && (
              <Stat
                label="שכר מינימלי"
                value={`${candidate.min_hourly_wage} ₪/שעה`}
              />
            )}
          </div>

          {candidate.skills.length > 0 && (
            <div>
              <div className="text-xs text-slate-400 uppercase mb-1">כישורים</div>
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map((s, i) => (
                  <span
                    key={i}
                    className="bg-pink-50 text-pink-700 text-sm px-3 py-1 rounded-full"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {isTop && (
          <>
            <motion.div
              style={{ opacity: likeOpacity }}
              className="absolute top-10 left-6 border-4 border-green-500 text-green-500 font-extrabold text-3xl px-4 py-2 rounded-xl rotate-[-20deg]"
            >
              LIKE
            </motion.div>
            <motion.div
              style={{ opacity: passOpacity }}
              className="absolute top-10 right-6 border-4 border-red-500 text-red-500 font-extrabold text-3xl px-4 py-2 rounded-xl rotate-[20deg]"
            >
              NOPE
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
