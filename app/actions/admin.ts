"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  updateReportStatus,
  setUserDisabled,
  deleteUserAdmin,
  setJobActive,
} from "@/lib/domain";
import { revalidatePath } from "next/cache";

/** Returns the logged-in user only if they are an admin, else redirects. */
async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!adminEmails.includes(user.email.toLowerCase())) redirect("/");
  return user;
}

export async function reviewReportAction(
  reportId: number,
  status: "reviewed" | "dismissed"
): Promise<void> {
  await requireAdmin();
  updateReportStatus(reportId, status);
  revalidatePath("/admin/reports");
}

export async function toggleUserDisabledAction(
  userId: string,
  disabled: boolean
): Promise<void> {
  await requireAdmin();
  setUserDisabled(userId, disabled);
  revalidatePath("/admin/users");
}

export async function deleteUserAdminAction(userId: string): Promise<void> {
  await requireAdmin();
  deleteUserAdmin(userId);
  revalidatePath("/admin/users");
}

export async function toggleJobActiveAdminAction(
  jobId: string,
  employerId: string,
  active: boolean
): Promise<void> {
  await requireAdmin();
  setJobActive(jobId, employerId, active);
  revalidatePath("/admin/jobs");
}
