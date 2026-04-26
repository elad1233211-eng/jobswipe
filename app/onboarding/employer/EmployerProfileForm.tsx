"use client";

import { useActionState, useState } from "react";
import {
  saveEmployerProfileAction,
  type FormState,
} from "@/app/actions/profile";

const initial: FormState = {};

const EMOJIS = ["🏢", "🍽️", "☕", "🏬", "🚚", "🧹", "🏗️", "🛒", "🏨", "💇"];

export default function EmployerProfileForm({
  initial: pre,
}: {
  initial: {
    company_name: string;
    contact_name: string;
    city: string;
    description: string;
    logo_emoji: string;
  } | null;
}) {
  const [state, action, pending] = useActionState(
    saveEmployerProfileAction,
    initial
  );
  const [emoji, setEmoji] = useState(pre?.logo_emoji ?? "🏢");

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">לוגו</label>
        <input type="hidden" name="logo_emoji" value={emoji} />
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`text-3xl w-12 h-12 flex items-center justify-center rounded-xl border-2 ${
                emoji === e
                  ? "border-violet-500 bg-violet-50"
                  : "border-slate-200"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <Field
        label="שם העסק"
        name="company_name"
        required
        defaultValue={pre?.company_name}
      />
      <Field
        label="איש/אשת קשר"
        name="contact_name"
        defaultValue={pre?.contact_name}
      />
      <Field label="עיר" name="city" required defaultValue={pre?.city} />

      <div>
        <label className="block text-sm font-medium mb-1">
          תיאור קצר על העסק
        </label>
        <textarea
          name="description"
          defaultValue={pre?.description}
          rows={3}
          maxLength={500}
          className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-400"
          placeholder="אנחנו מסעדה שף קטנה במרכז ת״א..."
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-600 text-center">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-brand-gradient text-white font-semibold py-3 rounded-xl disabled:opacity-60"
      >
        {pending ? "שומר..." : "שמור והמשך"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-400"
      />
    </div>
  );
}
