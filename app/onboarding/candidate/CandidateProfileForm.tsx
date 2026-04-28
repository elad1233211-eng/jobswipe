"use client";

import { useActionState, useState, useRef, useCallback } from "react";
import {
  saveCandidateProfileAction,
  type FormState,
} from "@/app/actions/profile";

const initial: FormState = {};

const EMOJIS = ["👤", "🧑‍🍳", "🚚", "🛒", "🧹", "👷", "🧑‍🔧", "💪", "🧑‍💼", "🧑‍🎓"];
const MAX_PX = 200; // max photo dimension

// ---------- helpers ----------

function resizeToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const ratio = Math.min(MAX_PX / img.width, MAX_PX / img.height, 1);
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("load")); };
    img.src = url;
  });
}

type SkillEntry = { name: string; years: number | "" };

function buildExpJson(entries: SkillEntry[]): string {
  const obj: Record<string, number | null> = {};
  for (const e of entries) {
    obj[e.name] = e.years === "" ? null : e.years;
  }
  return JSON.stringify(obj);
}

function buildSkillsStr(entries: SkillEntry[]): string {
  return entries.map((e) => e.name).join(",");
}

// ---------- component ----------

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
    avatar_b64: string | null;
    skills: SkillEntry[];
    experience_json: string;
  } | null;
}) {
  const [state, action, pending] = useActionState(
    saveCandidateProfileAction,
    initial
  );

  // Photo state
  const [photo, setPhoto] = useState<string | null>(pre?.avatar_b64 ?? null);
  const [emoji, setEmoji] = useState(pre?.avatar_emoji ?? "👤");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await resizeToBase64(file);
      setPhoto(b64);
    } catch {
      // ignore
    }
  }, []);

  // Per-domain skills/experience
  const [skills, setSkills] = useState<SkillEntry[]>(pre?.skills ?? []);
  const [newSkill, setNewSkill] = useState("");

  function addSkill() {
    const name = newSkill.trim();
    if (!name || skills.some((s) => s.name === name)) return;
    setSkills((prev) => [...prev, { name, years: "" }]);
    setNewSkill("");
  }

  function removeSkill(name: string) {
    setSkills((prev) => prev.filter((s) => s.name !== name));
  }

  function updateYears(name: string, val: string) {
    const n = val === "" ? "" : parseInt(val, 10);
    setSkills((prev) =>
      prev.map((s) =>
        s.name === name
          ? { ...s, years: typeof n === "number" && !isNaN(n) ? n : "" }
          : s
      )
    );
  }

  return (
    <form action={action} className="space-y-5">

      {/* ---- Profile photo section ---- */}
      <div>
        <label className="block text-sm font-medium mb-2">תמונת פרופיל</label>

        {/* Hidden fields */}
        <input type="hidden" name="avatar_emoji" value={emoji} />
        <input type="hidden" name="avatar_b64" value={photo ?? ""} />

        <div className="flex items-center gap-4">
          {/* Preview */}
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-200 flex items-center justify-center bg-slate-50 shrink-0">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="תמונת פרופיל" className="w-full h-full object-cover" />
            ) : (
              <span className="text-5xl">{emoji}</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-sm bg-pink-50 text-pink-700 border border-pink-200 px-3 py-1.5 rounded-lg font-medium"
            >
              {photo ? "החלף תמונה" : "העלה תמונה 📷"}
            </button>
            {photo && (
              <button
                type="button"
                onClick={() => setPhoto(null)}
                className="text-xs text-slate-400 underline"
              >
                הסר תמונה
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={handleFile}
            />
          </div>
        </div>

        {/* Emoji fallback — shown only when no photo */}
        {!photo && (
          <div className="mt-3">
            <div className="text-xs text-slate-500 mb-1.5">או בחר/י אייקון</div>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`text-2xl w-10 h-10 flex items-center justify-center rounded-xl border-2 ${
                    emoji === e ? "border-pink-500 bg-pink-50" : "border-slate-200"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ---- Basic info ---- */}
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
          label="שנות ניסיון כולל"
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

      {/* ---- Skills + per-domain experience ---- */}
      <div>
        <label className="block text-sm font-medium mb-2">כישורים וניסיון</label>

        {/* Hidden fields for serialised lists */}
        <input type="hidden" name="skills" value={buildSkillsStr(skills)} />
        <input type="hidden" name="experience_json" value={buildExpJson(skills)} />

        {/* Add skill row */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
            placeholder="הוסף תחום (מלצרות, נהיגה...)"
            className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
          <button
            type="button"
            onClick={addSkill}
            className="bg-pink-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shrink-0"
          >
            הוסף
          </button>
        </div>

        {/* Skill list */}
        {skills.length > 0 && (
          <ul className="space-y-2">
            {skills.map((s) => (
              <li key={s.name} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                <span className="flex-1 text-sm font-medium text-slate-700">{s.name}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={s.years}
                    onChange={(e) => updateYears(s.name, e.target.value)}
                    placeholder="שנים"
                    className="w-16 text-center border border-slate-300 rounded-lg py-1 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />
                  <span className="text-xs text-slate-400">שנים</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeSkill(s.name)}
                  className="text-slate-400 hover:text-red-500 text-lg leading-none shrink-0 px-1"
                  aria-label={`הסר ${s.name}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ---- Availability ---- */}
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
