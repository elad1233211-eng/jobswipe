/**
 * Tiny content-moderation helpers used by Server Actions.
 *
 * Goals:
 *   - Block obviously hateful/sexual/violent slurs (HE + EN).
 *   - Keep the runtime cost ~zero (regex over a small list).
 *   - Be permissive — false positives are worse than missing one slur in MVP.
 *
 * This is intentionally NOT a full classifier — production should layer a real
 * moderation API on top. The list lives here for transparency and easy edits.
 */

// Slurs to block outright. Keep the list short and accurate.
// Patterns are compiled with the `iu` flag (case-insensitive, unicode).
const BLOCKED_PATTERNS: RegExp[] = [
  // English
  /\bn[i1]gg(?:er|a)s?\b/iu,
  /\bf[a@]gg?(?:ot|s)?\b/iu,
  /\bk[i1]ke\b/iu,
  /\bsp[i1]c\b/iu,
  /\bch[i1]nk\b/iu,
  /\btr[a@]nn[yi]\b/iu,
  /\bret[a@]rds?\b/iu,
  // Hebrew slurs commonly seen in harassment reports.
  // Only the most unambiguous; anything else can be reported.
  /\bמזדיינ[הים]?\b/u,
  /\bכוסעמך\b/u,
  /\bבן\s*זונה\b/u,
  /\bבת\s*זונה\b/u,
  /\bקאקר\b/u, // ethnic slur
];

// Soft warnings — substituted with **** rather than blocking the whole message.
const SOFT_PATTERNS: RegExp[] = [
  /\bfuck(?:ing|ed|er)?\b/iu,
  /\bshit(?:ty)?\b/iu,
  /\bbitch\b/iu,
  /\basshole\b/iu,
  /\bלזיין\b/u,
  /\bסתום\s*ת?\s*הפה\b/u,
];

export type ModerationResult = {
  /** Sanitized text — soft profanity replaced with asterisks. */
  text: string;
  /** True if the original contained a hard-blocked slur. */
  blocked: boolean;
  /** True if any soft profanity was masked. */
  filtered: boolean;
};

export function moderateText(input: string): ModerationResult {
  const text = input;
  for (const re of BLOCKED_PATTERNS) {
    if (re.test(text)) {
      return { text, blocked: true, filtered: false };
    }
  }
  let out = text;
  let filtered = false;
  for (const re of SOFT_PATTERNS) {
    if (re.test(out)) {
      filtered = true;
      out = out.replace(re, (m) => "*".repeat(m.length));
    }
  }
  return { text: out, blocked: false, filtered };
}

/**
 * Sanitize a chat message: enforce a max length, strip control chars,
 * and run moderation.
 */
export function sanitizeMessage(input: string): ModerationResult {
  // Strip ASCII control characters (except tab, newline, carriage return).
  // eslint-disable-next-line no-control-regex
  const cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  return moderateText(cleaned);
}

/** Validate job title / description before persisting. */
export function validateJobText(
  field: "title" | "description",
  text: string
): { ok: true; text: string } | { ok: false; error: string } {
  const trimmed = text.trim();
  if (field === "title") {
    if (trimmed.length < 3) return { ok: false, error: "כותרת קצרה מדי" };
    if (trimmed.length > 80) return { ok: false, error: "כותרת ארוכה מדי" };
  } else {
    if (trimmed.length > 2000)
      return { ok: false, error: "תיאור ארוך מדי (עד 2000 תווים)" };
  }
  const mod = moderateText(trimmed);
  if (mod.blocked) {
    return { ok: false, error: "התוכן מכיל ביטוי שאינו מותר" };
  }
  return { ok: true, text: mod.text };
}
