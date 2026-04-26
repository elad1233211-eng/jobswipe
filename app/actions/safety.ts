"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import {
  blockUser,
  unblockUser,
  createReport,
  type ReportKind,
} from "@/lib/domain";
import { rateLimit } from "@/lib/rate-limit";

export type ActionResult = { ok: true } | { error: string };

const reportSchema = z.object({
  targetKind: z.enum(["user", "job"]),
  targetId: z.string().min(1),
  reason: z.enum([
    "spam",
    "harassment",
    "fake",
    "inappropriate",
    "discrimination",
    "other",
  ]),
  details: z.string().max(500).optional().nullable(),
});

export async function reportAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser();

  // Rate limit: 20 reports per day per user (prevent abuse by mass reporters).
  const rl = rateLimit("report", user.id, 20, 24 * 60 * 60 * 1000);
  if (!rl.ok) return { error: "יותר מדי דיווחים היום. נסו שוב מחר." };

  const parsed = reportSchema.safeParse({
    targetKind: formData.get("targetKind"),
    targetId: formData.get("targetId"),
    reason: formData.get("reason"),
    details: formData.get("details") || null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "קלט לא תקין" };
  }

  createReport({
    reporterId: user.id,
    targetKind: parsed.data.targetKind as ReportKind,
    targetId: parsed.data.targetId,
    reason: parsed.data.reason,
    details: parsed.data.details ?? null,
  });

  return { ok: true };
}

export async function blockUserAction(blockedId: string): Promise<void> {
  const user = await requireUser();
  if (!blockedId || blockedId === user.id) return;
  blockUser(user.id, blockedId);
  revalidatePath("/app/feed");
  revalidatePath("/app/employer");
  revalidatePath("/app/matches");
  revalidatePath("/app/profile");
}

export async function unblockUserAction(blockedId: string): Promise<void> {
  const user = await requireUser();
  unblockUser(user.id, blockedId);
  revalidatePath("/app/profile");
  revalidatePath("/app/feed");
  revalidatePath("/app/employer");
}
