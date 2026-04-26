"use client";

import { useActionState } from "react";
import {
  createJobAction,
  updateJobAction,
  type FormState,
} from "@/app/actions/profile";

const initial: FormState = {};

const CATEGORIES = [
  "מלצרות ושירות",
  "מטבח ובישול",
  "ניקיון ואחזקה",
  "שליחויות ומשלוחים",
  "קופה וקמעונאות",
  "מחסן ולוגיסטיקה",
  "בנייה ושיפוצים",
  "אבטחה",
  "יופי וטיפוח",
  "אחר",
];

const SHIFTS = ["משמרות בוקר", "משמרות ערב", "לילה", "גמיש", "מלא"];

export type JobFormDefaults = {
  title?: string;
  category?: string;
  city?: string;
  hourly_wage?: number | null;
  hours_per_week?: number | null;
  shift_type?: string | null;
  description?: string | null;
  requirements?: string[];
};

export default function JobForm({
  mode,
  jobId,
  defaults,
}: {
  mode: "create" | "edit";
  jobId?: string;
  defaults?: JobFormDefaults;
}) {
  const action =
    mode === "edit" && jobId
      ? updateJobAction.bind(null, jobId)
      : createJobAction;
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-4">
      <Field
        label="כותרת המשרה"
        name="title"
        required
        placeholder="מלצר/ית לסוף שבוע"
        defaultValue={defaults?.title}
      />

      <div>
        <label className="block text-sm font-medium mb-1">קטגוריה</label>
        <select
          name="category"
          required
          defaultValue={defaults?.category ?? ""}
          className="w-full border border-slate-300 rounded-xl px-4 py-3"
        >
          <option value="" disabled>
            בחר קטגוריה...
          </option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <Field
        label="עיר"
        name="city"
        required
        placeholder="תל אביב"
        defaultValue={defaults?.city}
      />

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="שכר שעתי (₪)"
          name="hourly_wage"
          type="number"
          placeholder="45"
          defaultValue={defaults?.hourly_wage ?? ""}
        />
        <Field
          label="שעות בשבוע"
          name="hours_per_week"
          type="number"
          placeholder="30"
          defaultValue={defaults?.hours_per_week ?? ""}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">סוג משמרות</label>
        <select
          name="shift_type"
          defaultValue={defaults?.shift_type ?? ""}
          className="w-full border border-slate-300 rounded-xl px-4 py-3"
        >
          <option value="">—</option>
          {SHIFTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">תיאור המשרה</label>
        <textarea
          name="description"
          defaultValue={defaults?.description ?? ""}
          rows={4}
          maxLength={1000}
          className="w-full border border-slate-300 rounded-xl px-4 py-3"
          placeholder="מחפשים מלצר/ית אנרגטי/ת לסופי שבוע..."
        />
      </div>

      <Field
        label="דרישות (מופרדות בפסיק)"
        name="requirements"
        placeholder="ניסיון קודם, גיל 18+, זמינות לסופי שבוע"
        defaultValue={defaults?.requirements?.join(", ") ?? ""}
      />

      {state.error && (
        <p className="text-sm text-red-600 text-center">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-brand-gradient text-white font-semibold py-3 rounded-xl disabled:opacity-60"
      >
        {pending
          ? mode === "edit"
            ? "שומר..."
            : "מפרסם..."
          : mode === "edit"
          ? "שמור שינויים"
          : "פרסם משרה"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number | null;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? ""}
        className="w-full border border-slate-300 rounded-xl px-4 py-3"
      />
    </div>
  );
}
