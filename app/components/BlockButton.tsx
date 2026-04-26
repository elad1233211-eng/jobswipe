"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { blockUserAction, unblockUserAction } from "@/app/actions/safety";

type Props = {
  userId: string;
  mode?: "block" | "unblock";
  onAfterBlock?: string; // optional redirect
  className?: string;
  label?: string;
};

export default function BlockButton({
  userId,
  mode = "block",
  onAfterBlock,
  className,
  label,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  function run() {
    startTransition(async () => {
      if (mode === "block") await blockUserAction(userId);
      else await unblockUserAction(userId);
      if (onAfterBlock) router.push(onAfterBlock);
      else router.refresh();
    });
  }

  const defaultLabel =
    mode === "block"
      ? confirming
        ? "ללחוץ שוב לאישור חסימה ⚠️"
        : "חסימת משתמש"
      : "ביטול חסימה";

  const defaultCls =
    mode === "block"
      ? "text-xs text-slate-500 hover:text-red-600 underline-offset-2 hover:underline disabled:opacity-50"
      : "text-sm px-3 py-1 rounded-lg bg-slate-100 text-slate-700 disabled:opacity-50";

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (mode === "block" && !confirming) {
          setConfirming(true);
          return;
        }
        run();
      }}
      className={className || defaultCls}
    >
      {label || defaultLabel}
    </button>
  );
}
