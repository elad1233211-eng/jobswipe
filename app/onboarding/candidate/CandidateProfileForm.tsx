"use client";

import { useActionState, useState } from "react";
import {
  saveCandidateProfileAction,
  type FormState,
} from "@/app/actions/profile";

const initial: FormState = {};

const EMOJIS = ["👤", "🧑‍🍳", "🚚", "🛒", "🧹", "👷", "🧑‍🔧", "💪", "🧑‍💼", "🧑‍🎓"];

export default function CandidateProfileForm({
  initial: pre,
}: {
  initial: {
    full_name: string;
    age: number | "";
    city: string;
    bio: string;
    experience_years: number | "";
    min_hourly_wage: number | "";
    available_immediately: boolean;
    avatar_emoji: string;
    skills: string;
  } | null;
}) {
  const [state, action, pending] = useActionState(
    saveCandidateProfileAction,
    initial
  );
  const [emoji, setEmoji] = useState(pre?.avatar_emoji ?? "👤");

  return (
    <form action={action} className="space-y-4">
      {/* Emoji picker */}
      <div>
        <label className="block text-sm font-medium mb-2">תמונת פרופיל</label>
        <input type="hidden" name="avatar_emoji" value={emoji} />
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`text-3xl w-12 h-12 flex items-center justify-center rounded-xl border-2 ${
                emoji === e
                  ? "border-pink-500 bg-pink-50"
                  : "border-slate-200"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <Field label="שם מלא" name="full_name" required defaultValue={pre?.full_name} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="גיל" name="age" type="number" defaultValue={pre?.age} />
        <Field label="עיר" name="city" required defaultValue={pre?.city} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">קצת עליי</label>
        <textarea
          name="bio"
          defaultValue={pre?.bio}
          rows={3}
          maxLength={500}
          className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-400"
          placeholder="אני אחראי, עם ניסיון קצר במלצרות..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="שנות ניסיון"
          name="experience_years"
          type="number"
          defaultValue={pre?.experience_years}
        />
        <Field
          label="שכר שעתי מינימלי (₪)"
          name="min_hourly_wage"
          type="number"
          defaultValue={pre?.min_hourly_wage}
        />
      </div>

      <Field
        label="תחומים / כישורים (מופרדים בפסיק)"
        name="skills"
        defaultValue={pre?.skills}
        placeholder="מלצרות, קופה, שירות לקוחות"
      />

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          name="available_immediately"
          defaultChecked={pre?.available_immediately ?? true}
          className="w-5 h-5 accent-pink-500"
        />
        <span>זמין/ה להתחיל עבודה מיד</span>
      </label>

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
  type = "text",
  defaultValue,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number | null;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-400"
      />
    </div>
  );
}
