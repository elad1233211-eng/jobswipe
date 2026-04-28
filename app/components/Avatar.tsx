/**
 * Avatar — shows a real photo if available, otherwise a colored circle with initials.
 * Used in Matches list, chat header, etc.
 */

const PALETTE = [
  "from-pink-400 to-rose-500",
  "from-violet-400 to-purple-500",
  "from-blue-400 to-indigo-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-cyan-400 to-sky-500",
];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return Math.abs(h);
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({
  name,
  photo,
  emoji,
  size = "md",
}: {
  name: string;
  photo?: string | null;
  emoji?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = size === "sm" ? "w-10 h-10 text-sm" : size === "lg" ? "w-16 h-16 text-xl" : "w-12 h-12 text-base";

  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo}
        alt={name}
        className={`${sizeClass} rounded-2xl object-cover shrink-0 border border-slate-100`}
      />
    );
  }

  // Colored gradient circle with initials
  const gradient = PALETTE[hashName(name) % PALETTE.length];
  return (
    <div
      className={`${sizeClass} rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 text-white font-bold`}
      aria-label={name}
    >
      {emoji ? <span className="text-xl leading-none">{emoji}</span> : initials(name)}
    </div>
  );
}
