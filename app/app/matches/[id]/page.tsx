import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import {
  getMatch,
  getMessages,
  getJob,
  getCandidateProfile,
  getEmployerProfile,
} from "@/lib/domain";
import ChatView from "./ChatView";
import ReportDialog from "@/app/components/ReportDialog";
import BlockButton from "@/app/components/BlockButton";

export default async function MatchChatPage(
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const match = getMatch(id, user.id);
  if (!match) notFound();

  const job = getJob(match.job_id);
  if (!job) notFound();

  const otherId =
    user.id === match.candidate_id ? match.employer_id : match.candidate_id;

  const other =
    user.role === "candidate"
      ? getEmployerProfile(otherId)
      : getCandidateProfile(otherId);

  const otherName =
    other && "company_name" in other
      ? other.company_name
      : other && "full_name" in other
      ? other.full_name
      : "משתמש";
  const otherEmoji =
    other && "logo_emoji" in other
      ? other.logo_emoji
      : other && "avatar_emoji" in other
      ? other.avatar_emoji
      : "👤";

  const messages = getMessages(id).map((m) => ({
    id: m.id,
    body: m.body,
    mine: m.sender_id === user.id,
    at: m.created_at,
  }));

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat header */}
      <div className="sticky top-[57px] bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 z-10">
        <Link href="/app/matches" className="text-slate-500">
          ←
        </Link>
        <div className="text-3xl">{otherEmoji}</div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold truncate">{otherName}</h2>
          <p className="text-xs text-slate-500 truncate">{job.title}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <ReportDialog targetKind="user" targetId={otherId} />
          <BlockButton userId={otherId} onAfterBlock="/app/matches" />
        </div>
      </div>

      <ChatView matchId={id} initialMessages={messages} />
    </div>
  );
}
