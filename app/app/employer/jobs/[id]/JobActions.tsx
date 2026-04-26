"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import {
  toggleJobActiveAction,
  deleteJobAction,
} from "@/app/actions/profile";

export default function JobActions({
  jobId,
  isActive,
}: {
  jobId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function toggle() {
    startTransition(async () => {
      await toggleJobActiveAction(jobId, !isActive);
      router.refresh();
    });
  }

  function doDelete() {
    startTransition(async () => {
      await deleteJobAction(jobId);
    });
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        onClick={toggle}
        disabled={pending}
        className={`py-2 rounded-xl font-semibold text-sm border-2 transition ${
          isActive
            ? "border-amber-200 bg-amber-50 text-amber-700"
            : "border-green-200 bg-green-50 text-green-700"
        } disabled:opacity-50`}
      >
        {isActive ? "השבת משרה" : "הפעל משרה"}
      </button>
      <a
        href={`/app/employer/jobs/${jobId}/edit`}
        className="py-2 rounded-xl font-semibold text-sm border-2 border-slate-200 bg-slate-50 text-slate-700 text-center"
      >
        עריכה
      </a>
      <button
        onClick={() => (confirmDelete ? doDelete() : setConfirmDelete(true))}
        disabled={pending}
        className="col-span-2 py-2 rounded-xl font-semibold text-sm border-2 border-red-200 bg-red-50 text-red-700 disabled:opacity-50"
      >
        {confirmDelete ? "ללחוץ שוב כדי למחוק לצמיתות ⚠️" : "מחיקת משרה"}
      </button>
    </div>
  );
}
