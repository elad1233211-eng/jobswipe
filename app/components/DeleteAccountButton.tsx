"use client";

import { useState } from "react";
import { deleteAccountAction } from "@/app/actions/auth";

export default function DeleteAccountButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    if (
      !confirm(
        "האם אתה בטוח שברצונך למחוק את חשבונך לצמיתות?\n\nכל הנתונים, ההתאמות וההיסטוריה יימחקו ולא ניתן יהיה לשחזרם."
      )
    )
      return;

    setPending(true);
    setError("");
    const res = await deleteAccountAction();
    if (res && "error" in res) {
      setError(res.error);
      setPending(false);
    }
    // On success deleteAccountAction redirects — component unmounts
  }

  return (
    <div>
      {error && <p className="text-red-500 text-xs mb-1 text-center">{error}</p>}
      <button
        onClick={handleClick}
        disabled={pending}
        className="w-full text-sm text-red-400 hover:text-red-300 disabled:opacity-50 underline py-1"
      >
        {pending ? "מוחק חשבון..." : "מחק את החשבון שלי לצמיתות"}
      </button>
    </div>
  );
}
