import { getJobStats } from "@/lib/domain";

export default function JobStats({ jobId }: { jobId: string }) {
  const s = getJobStats(jobId);

  // Don't render if there's been zero activity yet — keeps the UI clean.
  if (s.total_swipes === 0 && s.matches === 0) {
    return (
      <p className="text-xs text-slate-400 text-center py-2">
        עדיין אין נתוני פעילות למשרה זו.
      </p>
    );
  }

  return (
    <div>
      <h3 className="text-xs text-slate-500 uppercase mb-2">פעילות</h3>
      <div className="grid grid-cols-4 gap-2">
        <StatCard emoji="👁" label="ראו" value={s.total_swipes} />
        <StatCard
          emoji="❤️"
          label="לייק"
          value={s.likes}
          sub={s.total_swipes > 0 ? `${s.like_rate}%` : undefined}
        />
        <StatCard emoji="👎" label="דילגו" value={s.passes} />
        <StatCard emoji="🎉" label="התאמות" value={s.matches} highlight />
      </div>
    </div>
  );
}

function StatCard({
  emoji,
  label,
  value,
  sub,
  highlight,
}: {
  emoji: string;
  label: string;
  value: number;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-3 text-center ${
        highlight && value > 0
          ? "bg-pink-50 border border-pink-200"
          : "bg-slate-50 border border-slate-100"
      }`}
    >
      <div className="text-xl mb-1">{emoji}</div>
      <div
        className={`text-lg font-bold leading-none ${
          highlight && value > 0 ? "text-pink-600" : "text-slate-800"
        }`}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[10px] text-slate-500 mt-0.5">{sub}</div>
      )}
      <div className="text-[10px] text-slate-500 mt-1">{label}</div>
    </div>
  );
}
