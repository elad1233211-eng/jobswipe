"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  upsertCandidateProfile,
  upsertEmployerProfile,
  createJob,
  setJobActive,
  updateJob,
  deleteJob,
} from "@/lib/domain";
import { validateJobText } from "@/lib/moderation";

export type FormState = { error?: string; ok?: boolean };

const candidateSchema = z.object({
  full_name: z.string().min(2, "נא להזין שם מלא"),
  age: z.coerce.number().int().min(14).max(99).optional().or(z.literal("")),
  city: z.string().min(1, "נא להזין עיר"),
  bio: z.string().max(500).optional().or(z.literal("")),
  experience_years: z.coerce
    .number()
    .int()
    .min(0)
    .max(60)
    .optional()
    .or(z.literal("")),
  min_hourly_wage: z.coerce
    .number()
    .int()
    .min(0)
    .max(1000)
    .optional()
    .or(z.literal("")),
  available_immediately: z.string().optional(),
  avatar_emoji: z.string().optional(),
  skills: z.string().optional(),
});

export async function saveCandidateProfileAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  if (user.role !== "candidate") return { error: "פעולה לא מורשית" };

  const parsed = candidateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "קלט לא תקין" };
  }
  const d = parsed.data;

  upsertCandidateProfile(user.id, {
    full_name: d.full_name,
    age: d.age === "" || d.age === undefined ? null : Number(d.age),
    city: d.city,
    bio: d.bio || null,
    experience_years:
      d.experience_years === "" || d.experience_years === undefined
        ? null
        : Number(d.experience_years),
    min_hourly_wage:
      d.min_hourly_wage === "" || d.min_hourly_wage === undefined
        ? null
        : Number(d.min_hourly_wage),
    available_immediately: d.available_immediately === "on",
    avatar_emoji: d.avatar_emoji || "👤",
    skills: (d.skills || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  });

  redirect("/app/feed");
}

const employerSchema = z.object({
  company_name: z.string().min(2, "נא להזין שם עסק"),
  contact_name: z.string().optional().or(z.literal("")),
  city: z.string().min(1, "נא להזין עיר"),
  description: z.string().max(500).optional().or(z.literal("")),
  logo_emoji: z.string().optional(),
});

export async function saveEmployerProfileAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  if (user.role !== "employer") return { error: "פעולה לא מורשית" };

  const parsed = employerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "קלט לא תקין" };
  }
  const d = parsed.data;
  upsertEmployerProfile(user.id, {
    company_name: d.company_name,
    contact_name: d.contact_name || null,
    city: d.city,
    description: d.description || null,
    logo_emoji: d.logo_emoji || "🏢",
  });

  redirect("/app/employer");
}

const jobSchema = z.object({
  title: z.string().min(2, "נא להזין תפקיד"),
  category: z.string().min(1, "נא לבחור קטגוריה"),
  city: z.string().min(1, "נא להזין עיר"),
  hourly_wage: z.coerce.number().int().min(0).max(1000).optional().or(z.literal("")),
  hours_per_week: z.coerce.number().int().min(0).max(80).optional().or(z.literal("")),
  shift_type: z.string().optional(),
  description: z.string().max(1000).optional().or(z.literal("")),
  requirements: z.string().optional(),
});

export async function createJobAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  if (user.role !== "employer") return { error: "פעולה לא מורשית" };

  const parsed = jobSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "קלט לא תקין" };
  }
  const d = parsed.data;

  const titleCheck = validateJobText("title", d.title);
  if (!titleCheck.ok) return { error: titleCheck.error };
  const descCheck = validateJobText("description", d.description || "");
  if (!descCheck.ok) return { error: descCheck.error };

  createJob(user.id, {
    title: titleCheck.text,
    category: d.category,
    city: d.city,
    hourly_wage:
      d.hourly_wage === "" || d.hourly_wage === undefined ? null : Number(d.hourly_wage),
    hours_per_week:
      d.hours_per_week === "" || d.hours_per_week === undefined
        ? null
        : Number(d.hours_per_week),
    shift_type: d.shift_type || null,
    description: descCheck.text || null,
    requirements: (d.requirements || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  });

  redirect("/app/employer");
}

export async function toggleJobActiveAction(
  jobId: string,
  active: boolean
): Promise<void> {
  const user = await requireUser();
  if (user.role !== "employer") return;
  setJobActive(jobId, user.id, active);
  revalidatePath("/app/employer");
  revalidatePath(`/app/employer/jobs/${jobId}`);
}

export async function updateJobAction(
  jobId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  if (user.role !== "employer") return { error: "פעולה לא מורשית" };

  const parsed = jobSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "קלט לא תקין" };
  }
  const d = parsed.data;

  const titleCheck = validateJobText("title", d.title);
  if (!titleCheck.ok) return { error: titleCheck.error };
  const descCheck = validateJobText("description", d.description || "");
  if (!descCheck.ok) return { error: descCheck.error };

  updateJob(jobId, user.id, {
    title: titleCheck.text,
    category: d.category,
    city: d.city,
    hourly_wage:
      d.hourly_wage === "" || d.hourly_wage === undefined ? null : Number(d.hourly_wage),
    hours_per_week:
      d.hours_per_week === "" || d.hours_per_week === undefined
        ? null
        : Number(d.hours_per_week),
    shift_type: d.shift_type || null,
    description: descCheck.text || null,
    requirements: (d.requirements || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  });
  revalidatePath("/app/employer");
  revalidatePath(`/app/employer/jobs/${jobId}`);
  redirect(`/app/employer/jobs/${jobId}`);
}

export async function deleteJobAction(jobId: string): Promise<void> {
  const user = await requireUser();
  if (user.role !== "employer") return;
  deleteJob(jobId, user.id);
  revalidatePath("/app/employer");
  redirect("/app/employer");
}
