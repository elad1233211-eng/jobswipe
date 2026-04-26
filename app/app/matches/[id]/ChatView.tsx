"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { sendMessageAction, getNewMessagesAction } from "@/app/actions/swipe";

type Msg = {
  id: number;      // negative = optimistic (not yet confirmed by server)
  body: string;
  mine: boolean;
  at: number;
};

const POLL_INTERVAL_MS = 4_000;

export default function ChatView({
  matchId,
  initialMessages,
}: {
  matchId: string;
  initialMessages: Msg[];
}) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Always reflects the latest messages without triggering poll re-registration.
  const messagesRef = useRef<Msg[]>(initialMessages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Scroll to bottom on new messages.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Polling ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(async () => {
      // Only poll confirmed messages (positive IDs) to determine the cursor.
      const maxId = messagesRef.current
        .filter((m) => m.id > 0)
        .reduce((max, m) => Math.max(max, m.id), 0);

      try {
        const fresh = await getNewMessagesAction(matchId, maxId);
        if (fresh.length === 0) return;

        setMessages((prev) => {
          const existingIds = new Set(prev.filter((m) => m.id > 0).map((m) => m.id));
          const truly_new = fresh.filter((m) => !existingIds.has(m.id));
          if (truly_new.length === 0) return prev;

          // Also strip any optimistic duplicates whose body matches an incoming message.
          // (The sender's optimistic stays until replaced below via messageId.)
          return [...prev, ...truly_new];
        });
      } catch {
        // Network blip — silent; next tick will retry.
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [matchId]); // stable — only matchId dependency

  // ── Send ───────────────────────────────────────────────────────────────────
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    const optimisticId = -(Date.now()); // unique negative number
    const optimistic: Msg = {
      id: optimisticId,
      body: trimmed,
      mine: true,
      at: Date.now(),
    };

    setMessages((m) => [...m, optimistic]);
    setText("");
    setError(null);

    startTransition(async () => {
      const res = await sendMessageAction(matchId, trimmed);
      if ("error" in res) {
        setError(res.error);
        // Roll back optimistic
        setMessages((m) => m.filter((x) => x.id !== optimisticId));
      } else {
        // Replace the optimistic entry with the confirmed message ID.
        setMessages((m) =>
          m.map((x) =>
            x.id === optimisticId ? { ...x, id: res.messageId } : x
          )
        );
      }
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 py-8">
            שלח/י הודעה ראשונה כדי לשבור את הקרח 👋
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.mine ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-[75%] px-4 py-2 rounded-2xl transition-opacity ${
                m.mine
                  ? "bubble-mine rounded-br-sm"
                  : "bubble-theirs rounded-bl-sm"
              } ${m.id < 0 ? "opacity-60" : "opacity-100"}`}
            >
              <p className="whitespace-pre-wrap break-words">{m.body}</p>
              <div
                className={`text-[10px] mt-1 flex items-center gap-1 ${
                  m.mine ? "text-white/80" : "text-slate-500"
                }`}
              >
                {new Date(m.at).toLocaleTimeString("he-IL", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {/* Pending indicator for optimistic messages */}
                {m.id < 0 && <span aria-label="שולח">⏳</span>}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="text-center text-sm text-red-600 pb-2 px-4" role="alert">
          {error}
        </div>
      )}

      {/* Composer */}
      <form
        onSubmit={submit}
        className="sticky bottom-16 bg-white border-t border-slate-200 p-3 flex gap-2"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="כתוב הודעה..."
          disabled={pending}
          className="flex-1 border border-slate-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400"
        />
        <button
          type="submit"
          disabled={pending || !text.trim()}
          className="bg-brand-gradient text-white font-semibold px-5 py-2 rounded-full disabled:opacity-50"
        >
          שלח
        </button>
      </form>
    </div>
  );
}
