"use server";

import { requireUser } from "@/lib/auth";
import {
  swipeCandidate,
  swipeJob,
  undoLastSwipe,
  sendMessage as sendMessageDomain,
  getMatch,
  getMessages,
  type SwipeResult,
  type JobWithEmployer,
} from "@/lib/domain";
import { revalidatePath } from "next/cache";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeMessage } from "@/lib/moderation";
import { sendMatchEmails } from "@/lib/notifications";
import { sendPushToUser } from "@/lib/push";

export async function swipeJobAction(
  jobId: string,
  direction: "like" | "pass"
): Promise<SwipeResult> {
  const user = await requireUser();
  if (user.role !== "candidate") throw new Error("FORBIDDEN");
  const res = swipeJob(user.id, jobId, direction);
  if (res.matched) {
    revalidatePath("/app/matches");
    if (res.matchId) sendMatchEmails(res.matchId).catch(() => {});
  }
  return res;
}

export async function swipeCandidateAction(
  candidateId: string,
  jobId: string,
  direction: "like" | "pass"
): Promise<SwipeResult> {
  const user = await requireUser();
  if (user.role !== "employer") throw new Error("FORBIDDEN");
  const res = swipeCandidate(user.id, candidateId, jobId, direction);
  if (res.matched) {
    revalidatePath("/app/matches");
    if (res.matchId) sendMatchEmails(res.matchId).catch(() => {});
  }
  return res;
}

/** Undo the candidate's last job swipe (if it didn't create a match). */
export async function undoSwipeAction(): Promise<JobWithEmployer | null> {
  const user = await requireUser();
  if (user.role !== "candidate") return null;
  return undoLastSwipe(user.id);
}

export async function sendMessageAction(
  matchId: string,
  body: string
): Promise<{ ok: true; messageId: number } | { error: string }> {
  const user = await requireUser();

  const rl = rateLimit("send_message", user.id, 30, 60_000);
  if (!rl.ok) return { error: "שליחה מהירה מדי. המתן רגע ונסה שוב." };

  const trimmed = body.trim();
  if (!trimmed) return { error: "הודעה ריקה" };
  if (trimmed.length > 2000) return { error: "הודעה ארוכה מדי" };

  const moderated = sanitizeMessage(trimmed);
  if (moderated.blocked) {
    return { error: "ההודעה מכילה תוכן שאינו מותר. נסחו מחדש." };
  }

  const match = getMatch(matchId, user.id);
  if (!match) return { error: "ההתאמה לא נמצאה" };

  const msg = sendMessageDomain(matchId, user.id, moderated.text);

  // Push notification to the other party (fire-and-forget)
  const otherId =
    match.candidate_id === user.id ? match.employer_id : match.candidate_id;
  sendPushToUser(otherId, {
    title: "💬 הודעה חדשה ב-JobSwipe",
    body: moderated.text.slice(0, 80),
    url: `/app/matches/${matchId}`,
  }).catch(() => {});

  return { ok: true, messageId: msg.id };
}

/**
 * Polling action — returns messages with id > afterId for the given match.
 * Called every ~4 seconds by the chat client.
 */
export type PollMessage = {
  id: number;
  body: string;
  mine: boolean;
  at: number;
};

export async function getNewMessagesAction(
  matchId: string,
  afterId: number
): Promise<PollMessage[]> {
  const user = await requireUser();
  const match = getMatch(matchId, user.id);
  if (!match) return [];

  const all = getMessages(matchId);
  return all
    .filter((m) => m.id > afterId)
    .map((m) => ({
      id: m.id,
      body: m.body,
      mine: m.sender_id === user.id,
      at: m.created_at,
    }));
}
