"use client";

import { useTransition } from "react";
import {
  toggleUserDisabledAction,
  deleteUserAdminAction,
} from "@/app/actions/admin";

type Props = {
  userId: string;
  displayName: string;
  isDisabled: number;
};

export default function AdminUserActions({ userId, displayName, isDisabled }: Props) {
  const [disablePending, startDisable] = useTransition();
  const [deletePending, startDelete] = useTransition();

  return (
    <div className="flex gap-1">
      <button
        onClick={() =>
          startDisable(() => toggleUserDisabledAction(userId, !isDisabled))
        }
        disabled={disablePending}
        className="text-xs bg-amber-700/60 hover:bg-amber-600/80 text-white px-2 py-1 rounded disabled:opacity-50"
      >
        {isDisabled ? "הפעל" : "השבת"}
      </button>
      <button
        onClick={() => {
          if (!confirm(`למחוק לצמיתות את ${displayName}?`)) return;
          startDelete(() => deleteUserAdminAction(userId));
        }}
        disabled={deletePending}
        className="text-xs bg-red-900/60 hover:bg-red-700/80 text-white px-2 py-1 rounded disabled:opacity-50"
      >
        {deletePending ? "..." : "מחק"}
      </button>
    </div>
  );
}
