import { randomUUID, randomBytes } from "node:crypto";
import {
  getDb,
  type CandidateRow,
  type EmployerRow,
  type JobRow,
  type MatchRow,
  type MessageRow,
  type ReportRow,
  type UserRow,
} from "./db";

// ---------- Candidate profile ----------

export function getCandidateProfile(userId: string): CandidateRow | null {
  const db = getDb();
  return (
    (db
      .prepare("SELECT * FROM candidates WHERE user_id = ?")
      .get(userId) as CandidateRow | undefined) ?? null
  );
}

export type CandidateProfileInput = {
  full_name: string;
  age?: number | null;
  city?: string | null;
  bio?: string | null;
  experience_years?: number | null;
  min_hourly_wage?: number | null;
  available_immediately?: boolean;
  avatar_emoji?: string;
  avatar_b64?: string | null;
  skills?: string[];
  /** JSON-serialised map of {"תחום": years | null} */
  experience_json?: string;
};

export function upsertCandidateProfile(
  userId: string,
  input: CandidateProfileInput
): void {
  const db = getDb();
  const now = Date.now();
  const existing = getCandidateProfile(userId);
  const skills = JSON.stringify(input.skills ?? []);
  const expJson = input.experience_json ?? "{}";
  if (existing) {
    // Only overwrite avatar_b64 if caller explicitly supplied a non-undefined value
    const avatarB64 =
      input.avatar_b64 !== undefined ? input.avatar_b64 : existing.avatar_b64;
    db.prepare(
      `UPDATE candidates SET
        full_name=?, age=?, city=?, bio=?, experience_years=?,
        min_hourly_wage=?, available_immediately=?, avatar_emoji=?, avatar_b64=?,
        skills_json=?, experience_json=?, updated_at=?
       WHERE user_id=?`
    ).run(
      input.full_name,
      input.age ?? null,
      input.city ?? null,
      input.bio ?? null,
      input.experience_years ?? null,
      input.min_hourly_wage ?? null,
      input.available_immediately ? 1 : 0,
      input.avatar_emoji ?? existing.avatar_emoji ?? "👤",
      avatarB64,
      skills,
      expJson,
      now,
      userId
    );
  } else {
    db.prepare(
      `INSERT INTO candidates
        (user_id, full_name, age, city, bio, experience_years,
         min_hourly_wage, available_immediately, avatar_emoji, avatar_b64,
         skills_json, experience_json, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      userId,
      input.full_name,
      input.age ?? null,
      input.city ?? null,
      input.bio ?? null,
      input.experience_years ?? null,
      input.min_hourly_wage ?? null,
      input.available_immediately === false ? 0 : 1,
      input.avatar_emoji ?? "👤",
      input.avatar_b64 ?? null,
      skills,
      expJson,
      now
    );
  }
}

// ---------- Employer profile ----------

export function getEmployerProfile(userId: string): EmployerRow | null {
  const db = getDb();
  return (
    (db
      .prepare("SELECT * FROM employers WHERE user_id = ?")
      .get(userId) as EmployerRow | undefined) ?? null
  );
}

export type EmployerProfileInput = {
  company_name: string;
  contact_name?: string | null;
  city?: string | null;
  description?: string | null;
  logo_emoji?: string;
};

export function upsertEmployerProfile(
  userId: string,
  input: EmployerProfileInput
): void {
  const db = getDb();
  const now = Date.now();
  const existing = getEmployerProfile(userId);
  if (existing) {
    db.prepare(
      `UPDATE employers SET
        company_name=?, contact_name=?, city=?, description=?, logo_emoji=?, updated_at=?
       WHERE user_id=?`
    ).run(
      input.company_name,
      input.contact_name ?? null,
      input.city ?? null,
      input.description ?? null,
      input.logo_emoji ?? "🏢",
      now,
      userId
    );
  } else {
    db.prepare(
      `INSERT INTO employers
        (user_id, company_name, contact_name, city, description, logo_emoji, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      userId,
      input.company_name,
      input.contact_name ?? null,
      input.city ?? null,
      input.description ?? null,
      input.logo_emoji ?? "🏢",
      now
    );
  }
}

// ---------- Jobs ----------

export type JobInput = {
  title: string;
  category: string;
  city: string;
  hourly_wage?: number | null;
  hours_per_week?: number | null;
  shift_type?: string | null;
  description?: string | null;
  requirements?: string[];
};

export function createJob(employerId: string, input: JobInput): JobRow {
  const db = getDb();
  const id = randomUUID();
  const now = Date.now();
  db.prepare(
    `INSERT INTO jobs
      (id, employer_id, title, category, city, hourly_wage, hours_per_week,
       shift_type, description, requirements_json, is_active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
  ).run(
    id,
    employerId,
    input.title,
    input.category,
    input.city,
    input.hourly_wage ?? null,
    input.hours_per_week ?? null,
    input.shift_type ?? null,
    input.description ?? null,
    JSON.stringify(input.requirements ?? []),
    now
  );
  return db.prepare("SELECT * FROM jobs WHERE id=?").get(id) as JobRow;
}

export type JobStats = {
  total_swipes: number; // anyone who swiped (like or pass) = "saw" the job
  likes: number;
  passes: number;
  matches: number;
  like_rate: number; // 0–100 percent
};

export function getJobStats(jobId: string): JobStats {
  const db = getDb();
  const swipeRow = db
    .prepare(
      `SELECT
         COUNT(*) AS total_swipes,
         SUM(CASE WHEN direction = 'like' THEN 1 ELSE 0 END) AS likes,
         SUM(CASE WHEN direction = 'pass' THEN 1 ELSE 0 END) AS passes
       FROM swipes
       WHERE target_kind = 'job' AND target_id = ?`
    )
    .get(jobId) as { total_swipes: number; likes: number; passes: number };

  const matchRow = db
    .prepare("SELECT COUNT(*) AS matches FROM matches WHERE job_id = ?")
    .get(jobId) as { matches: number };

  const total = swipeRow.total_swipes ?? 0;
  const likes = swipeRow.likes ?? 0;
  const passes = swipeRow.passes ?? 0;
  const matches = matchRow.matches ?? 0;

  return {
    total_swipes: total,
    likes,
    passes,
    matches,
    like_rate: total > 0 ? Math.round((likes / total) * 100) : 0,
  };
}

export function getJobsByEmployer(employerId: string): JobRow[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT * FROM jobs WHERE employer_id=? ORDER BY created_at DESC"
    )
    .all(employerId) as JobRow[];
}

export function getJob(id: string): JobRow | null {
  const db = getDb();
  return (
    (db.prepare("SELECT * FROM jobs WHERE id=?").get(id) as
      | JobRow
      | undefined) ?? null
  );
}

export function setJobActive(
  jobId: string,
  employerId: string,
  active: boolean
): void {
  const db = getDb();
  db.prepare(
    "UPDATE jobs SET is_active=? WHERE id=? AND employer_id=?"
  ).run(active ? 1 : 0, jobId, employerId);
}

export function updateJob(
  jobId: string,
  employerId: string,
  input: JobInput
): void {
  const db = getDb();
  db.prepare(
    `UPDATE jobs SET
       title=?, category=?, city=?, hourly_wage=?, hours_per_week=?,
       shift_type=?, description=?, requirements_json=?
     WHERE id=? AND employer_id=?`
  ).run(
    input.title,
    input.category,
    input.city,
    input.hourly_wage ?? null,
    input.hours_per_week ?? null,
    input.shift_type ?? null,
    input.description ?? null,
    JSON.stringify(input.requirements ?? []),
    jobId,
    employerId
  );
}

export function deleteJob(jobId: string, employerId: string): void {
  const db = getDb();
  db.prepare("DELETE FROM jobs WHERE id=? AND employer_id=?").run(
    jobId,
    employerId
  );
}

// ---------- Feed (swipe candidates) ----------

export type JobWithEmployer = JobRow & {
  company_name: string;
  logo_emoji: string;
};

export type FeedFilters = {
  city?: string;
  category?: string;
  minWage?: number;
};

export function getFeedForCandidate(
  candidateId: string,
  filters: FeedFilters = {}
): JobWithEmployer[] {
  const db = getDb();
  const where: string[] = [
    "j.is_active = 1",
    `j.id NOT IN (
       SELECT target_id FROM swipes
       WHERE from_user_id = ? AND target_kind = 'job'
     )`,
    // Exclude employers the candidate blocked, or who blocked the candidate.
    `j.employer_id NOT IN (
       SELECT blocked_id FROM blocks WHERE blocker_id = ?
       UNION
       SELECT blocker_id FROM blocks WHERE blocked_id = ?
     )`,
  ];
  const params: (string | number)[] = [candidateId, candidateId, candidateId];

  if (filters.city && filters.city.trim()) {
    where.push("j.city LIKE ?");
    params.push(`%${filters.city.trim()}%`);
  }
  if (filters.category && filters.category.trim()) {
    where.push("j.category = ?");
    params.push(filters.category.trim());
  }
  if (typeof filters.minWage === "number" && filters.minWage > 0) {
    where.push("(j.hourly_wage IS NULL OR j.hourly_wage >= ?)");
    params.push(filters.minWage);
  }

  return db
    .prepare(
      `SELECT j.*, e.company_name, e.logo_emoji
       FROM jobs j
       JOIN employers e ON e.user_id = j.employer_id
       WHERE ${where.join(" AND ")}
       ORDER BY j.created_at DESC
       LIMIT 100`
    )
    .all(...params) as JobWithEmployer[];
}

export function getJobCategories(): string[] {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT DISTINCT category FROM jobs WHERE is_active = 1 ORDER BY category"
    )
    .all() as { category: string }[];
  return rows.map((r) => r.category);
}

export function getJobCities(): string[] {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT DISTINCT city FROM jobs WHERE is_active = 1 ORDER BY city"
    )
    .all() as { city: string }[];
  return rows.map((r) => r.city);
}

export type CandidateWithSwipe = CandidateRow & {
  job_id: string;
  job_title: string;
};

export function getFeedForEmployer(employerId: string): CandidateWithSwipe[] {
  // Show candidates who liked any of this employer's jobs but the employer
  // hasn't responded yet. That's the highest-signal feed.
  const db = getDb();
  return db
    .prepare(
      `SELECT c.*, s.target_id AS job_id, j.title AS job_title
       FROM swipes s
       JOIN jobs j ON j.id = s.target_id
       JOIN candidates c ON c.user_id = s.from_user_id
       WHERE s.target_kind = 'job'
         AND s.direction = 'like'
         AND j.employer_id = ?
         AND NOT EXISTS (
           SELECT 1 FROM swipes s2
           WHERE s2.from_user_id = ?
             AND s2.target_kind = 'candidate'
             AND s2.target_id = s.from_user_id
         )
         AND s.from_user_id NOT IN (
           SELECT blocked_id FROM blocks WHERE blocker_id = ?
           UNION
           SELECT blocker_id FROM blocks WHERE blocked_id = ?
         )
       ORDER BY s.created_at DESC
       LIMIT 100`
    )
    .all(employerId, employerId, employerId, employerId) as CandidateWithSwipe[];
}

// ---------- Swipes + Matching ----------

export type SwipeResult = {
  matched: boolean;
  matchId?: string;
  jobId?: string;
};

export function swipeJob(
  candidateId: string,
  jobId: string,
  direction: "like" | "pass"
): SwipeResult {
  const db = getDb();
  const now = Date.now();

  const job = getJob(jobId);
  if (!job) throw new Error("JOB_NOT_FOUND");

  db.prepare(
    `INSERT OR IGNORE INTO swipes
      (from_user_id, target_kind, target_id, direction, created_at)
     VALUES (?, 'job', ?, ?, ?)`
  ).run(candidateId, jobId, direction, now);

  if (direction !== "like") return { matched: false };

  // Has the employer already "liked" this candidate?
  const employerLike = db
    .prepare(
      `SELECT 1 FROM swipes
       WHERE from_user_id = ?
         AND target_kind = 'candidate'
         AND target_id = ?
         AND direction = 'like'`
    )
    .get(job.employer_id, candidateId);

  if (!employerLike) return { matched: false };

  return createMatch(candidateId, job.employer_id, jobId);
}

export function swipeCandidate(
  employerId: string,
  candidateId: string,
  jobId: string,
  direction: "like" | "pass"
): SwipeResult {
  const db = getDb();
  const now = Date.now();

  const job = getJob(jobId);
  if (!job) throw new Error("JOB_NOT_FOUND");
  if (job.employer_id !== employerId) throw new Error("FORBIDDEN");

  db.prepare(
    `INSERT OR IGNORE INTO swipes
      (from_user_id, target_kind, target_id, direction, created_at)
     VALUES (?, 'candidate', ?, ?, ?)`
  ).run(employerId, candidateId, direction, now);

  if (direction !== "like") return { matched: false };

  // Check if the candidate already liked THIS specific job
  const candidateLike = db
    .prepare(
      `SELECT 1 FROM swipes
       WHERE from_user_id = ?
         AND target_kind = 'job'
         AND target_id = ?
         AND direction = 'like'`
    )
    .get(candidateId, jobId);

  if (!candidateLike) return { matched: false };

  return createMatch(candidateId, employerId, jobId);
}

function createMatch(
  candidateId: string,
  employerId: string,
  jobId: string
): SwipeResult {
  const db = getDb();
  const now = Date.now();

  const existing = db
    .prepare(
      "SELECT id FROM matches WHERE candidate_id=? AND job_id=?"
    )
    .get(candidateId, jobId) as { id: string } | undefined;
  if (existing) {
    return { matched: true, matchId: existing.id, jobId };
  }

  const id = randomUUID();
  db.prepare(
    `INSERT INTO matches (id, candidate_id, employer_id, job_id, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, candidateId, employerId, jobId, now);
  return { matched: true, matchId: id, jobId };
}

// ---------- Matches listing ----------

export type MatchListItem = {
  match_id: string;
  job_id: string;
  job_title: string;
  other_party_name: string;
  other_party_emoji: string;
  other_party_city: string | null;
  last_message: string | null;
  last_message_at: number | null;
  created_at: number;
};

export function getMatchesForCandidate(candidateId: string): MatchListItem[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT
         m.id AS match_id,
         m.job_id,
         j.title AS job_title,
         e.company_name AS other_party_name,
         e.logo_emoji AS other_party_emoji,
         e.city AS other_party_city,
         m.created_at,
         (SELECT body FROM messages WHERE match_id = m.id ORDER BY created_at DESC LIMIT 1) AS last_message,
         (SELECT created_at FROM messages WHERE match_id = m.id ORDER BY created_at DESC LIMIT 1) AS last_message_at
       FROM matches m
       JOIN jobs j ON j.id = m.job_id
       JOIN employers e ON e.user_id = m.employer_id
       WHERE m.candidate_id = ?
       ORDER BY COALESCE(last_message_at, m.created_at) DESC`
    )
    .all(candidateId) as MatchListItem[];
}

export function getMatchesForEmployer(employerId: string): MatchListItem[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT
         m.id AS match_id,
         m.job_id,
         j.title AS job_title,
         c.full_name AS other_party_name,
         c.avatar_emoji AS other_party_emoji,
         c.city AS other_party_city,
         m.created_at,
         (SELECT body FROM messages WHERE match_id = m.id ORDER BY created_at DESC LIMIT 1) AS last_message,
         (SELECT created_at FROM messages WHERE match_id = m.id ORDER BY created_at DESC LIMIT 1) AS last_message_at
       FROM matches m
       JOIN jobs j ON j.id = m.job_id
       JOIN candidates c ON c.user_id = m.candidate_id
       WHERE m.employer_id = ?
       ORDER BY COALESCE(last_message_at, m.created_at) DESC`
    )
    .all(employerId) as MatchListItem[];
}

/**
 * Counts matches where the user has not yet seen the latest activity.
 * Heuristic: matches where the last message is from the other party,
 * OR where there are no messages at all.
 */
export function countUnseenMatches(userId: string): number {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT COUNT(*) AS n
       FROM matches m
       WHERE (m.candidate_id = ? OR m.employer_id = ?)
         AND (
           NOT EXISTS (SELECT 1 FROM messages WHERE match_id = m.id)
           OR (
             SELECT sender_id FROM messages WHERE match_id = m.id
             ORDER BY created_at DESC LIMIT 1
           ) != ?
         )`
    )
    .get(userId, userId, userId) as { n: number };
  return row.n;
}

export function getMatch(
  matchId: string,
  userId: string
): MatchRow | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT * FROM matches
       WHERE id = ? AND (candidate_id = ? OR employer_id = ?)`
    )
    .get(matchId, userId, userId) as MatchRow | undefined;
  return row ?? null;
}

// ---------- Messages ----------

export function getMessages(matchId: string): MessageRow[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT * FROM messages WHERE match_id=? ORDER BY created_at ASC"
    )
    .all(matchId) as MessageRow[];
}

export function sendMessage(
  matchId: string,
  senderId: string,
  body: string
): MessageRow {
  const db = getDb();
  const now = Date.now();
  const info = db
    .prepare(
      "INSERT INTO messages (match_id, sender_id, body, created_at) VALUES (?, ?, ?, ?)"
    )
    .run(matchId, senderId, body, now);
  return {
    id: info.lastInsertRowid as number,
    match_id: matchId,
    sender_id: senderId,
    body,
    created_at: now,
  };
}

// ---------- Reports ----------

export type ReportKind = "user" | "job";

export function createReport(input: {
  reporterId: string;
  targetKind: ReportKind;
  targetId: string;
  reason: string;
  details?: string | null;
}): void {
  const db = getDb();
  // Dedup: ignore if an open report for the same (reporter, target) already exists
  const exists = db
    .prepare(
      `SELECT 1 FROM reports
       WHERE reporter_id = ? AND target_kind = ? AND target_id = ? AND status = 'open'`
    )
    .get(input.reporterId, input.targetKind, input.targetId);
  if (exists) return;

  db.prepare(
    `INSERT INTO reports (reporter_id, target_kind, target_id, reason, details, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'open', ?)`
  ).run(
    input.reporterId,
    input.targetKind,
    input.targetId,
    input.reason,
    input.details ?? null,
    Date.now()
  );
}

export function listOpenReports(limit = 100): ReportRow[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT * FROM reports WHERE status = 'open' ORDER BY created_at DESC LIMIT ?"
    )
    .all(limit) as ReportRow[];
}

// ---------- Blocks ----------

/** Create a one-way block. Idempotent. */
export function blockUser(blockerId: string, blockedId: string): void {
  if (blockerId === blockedId) return;
  const db = getDb();
  db.prepare(
    `INSERT OR IGNORE INTO blocks (blocker_id, blocked_id, created_at)
     VALUES (?, ?, ?)`
  ).run(blockerId, blockedId, Date.now());
}

export function unblockUser(blockerId: string, blockedId: string): void {
  const db = getDb();
  db.prepare(
    "DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?"
  ).run(blockerId, blockedId);
}

export function isBlockedEitherWay(a: string, b: string): boolean {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT 1 AS x FROM blocks
       WHERE (blocker_id = ? AND blocked_id = ?)
          OR (blocker_id = ? AND blocked_id = ?)
       LIMIT 1`
    )
    .get(a, b, b, a) as { x: number } | undefined;
  return !!row;
}

export type BlockedUserRow = {
  user_id: string;
  display_name: string;
  avatar_emoji: string;
  role: "candidate" | "employer";
  created_at: number;
};

// ---------- Email verification ----------

/** 24-hour token TTL */
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Create (or replace) a verification token for the given user.
 * Returns the URL-safe hex token.
 */
export function createVerificationToken(userId: string): string {
  const db = getDb();
  const token = randomBytes(32).toString("hex");
  const expiresAt = Date.now() + VERIFY_TTL_MS;
  db.prepare(
    `INSERT INTO email_verifications (user_id, token, expires_at)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET token=excluded.token, expires_at=excluded.expires_at`
  ).run(userId, token, expiresAt);
  return token;
}

/**
 * Validate token, mark user verified, delete token row.
 * Returns the verified user id on success, null otherwise.
 */
export function verifyEmailToken(token: string): string | null {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT user_id, expires_at FROM email_verifications WHERE token = ?"
    )
    .get(token) as { user_id: string; expires_at: number } | undefined;

  if (!row) return null;
  if (Date.now() > row.expires_at) {
    db.prepare("DELETE FROM email_verifications WHERE token = ?").run(token);
    return null;
  }

  db.prepare(
    "UPDATE users SET email_verified_at = ? WHERE id = ?"
  ).run(Date.now(), row.user_id);
  db.prepare("DELETE FROM email_verifications WHERE token = ?").run(token);
  return row.user_id;
}

/** Get a user by id (convenience for notifications layer). */
export function getUserById(userId: string): UserRow | null {
  const db = getDb();
  return (
    (db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(userId) as UserRow | undefined) ?? null
  );
}

/** Full match details used by email notifications. */
export type MatchDetails = {
  match: MatchRow;
  candidateUser: UserRow;
  candidateProfile: CandidateRow;
  employerUser: UserRow;
  employerProfile: EmployerRow;
  job: JobRow;
};

export function getMatchDetails(matchId: string): MatchDetails | null {
  const db = getDb();
  const match = db
    .prepare("SELECT * FROM matches WHERE id = ?")
    .get(matchId) as MatchRow | undefined;
  if (!match) return null;

  const candidateUser = getUserById(match.candidate_id);
  const employerUser = getUserById(match.employer_id);
  const candidateProfile = getCandidateProfile(match.candidate_id);
  const employerProfile = getEmployerProfile(match.employer_id);
  const job = getJob(match.job_id);

  if (!candidateUser || !employerUser || !candidateProfile || !employerProfile || !job)
    return null;

  return { match, candidateUser, candidateProfile, employerUser, employerProfile, job };
}

/** Return users the given user has blocked, with a nice display name. */
export function listBlockedUsers(blockerId: string): BlockedUserRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT
         u.id AS user_id,
         u.role,
         COALESCE(c.full_name, e.company_name, u.email) AS display_name,
         COALESCE(c.avatar_emoji, e.logo_emoji, '🙈') AS avatar_emoji,
         b.created_at
       FROM blocks b
       JOIN users u ON u.id = b.blocked_id
       LEFT JOIN candidates c ON c.user_id = u.id
       LEFT JOIN employers e ON e.user_id = u.id
       WHERE b.blocker_id = ?
       ORDER BY b.created_at DESC`
    )
    .all(blockerId) as BlockedUserRow[];
}

// ---------- Undo last swipe ----------

/**
 * Deletes the candidate's most recent job-swipe, provided it did NOT create a match.
 * Returns the restored job (with employer info) so the UI can push it back onto the stack.
 */
export function undoLastSwipe(candidateId: string): JobWithEmployer | null {
  const db = getDb();

  const last = db
    .prepare(
      `SELECT id, target_id FROM swipes
       WHERE from_user_id = ? AND target_kind = 'job'
       ORDER BY created_at DESC LIMIT 1`
    )
    .get(candidateId) as { id: number; target_id: string } | undefined;

  if (!last) return null;

  // Don't allow undoing a swipe that created a match
  const matched = db
    .prepare("SELECT 1 FROM matches WHERE candidate_id = ? AND job_id = ?")
    .get(candidateId, last.target_id);
  if (matched) return null;

  const job = db
    .prepare(
      `SELECT j.*, e.company_name, e.logo_emoji
       FROM jobs j
       JOIN employers e ON e.user_id = j.employer_id
       WHERE j.id = ?`
    )
    .get(last.target_id) as JobWithEmployer | undefined;

  if (!job) return null;

  db.prepare("DELETE FROM swipes WHERE id = ?").run(last.id);
  return job;
}

// ---------- Swipe history ----------

export type SwipeHistoryItem = JobWithEmployer & {
  direction: "like" | "pass";
  swiped_at: number;
};

export function getSwipeHistoryForCandidate(
  candidateId: string,
  limit = 100
): SwipeHistoryItem[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT j.*, e.company_name, e.logo_emoji,
              s.direction, s.created_at AS swiped_at
       FROM swipes s
       JOIN jobs j ON j.id = s.target_id
       JOIN employers e ON e.user_id = j.employer_id
       WHERE s.from_user_id = ?
         AND s.target_kind = 'job'
       ORDER BY s.created_at DESC
       LIMIT ?`
    )
    .all(candidateId, limit) as SwipeHistoryItem[];
}

// ---------- Admin ----------

export type PlatformStats = {
  total_users: number;
  total_candidates: number;
  total_employers: number;
  total_jobs: number;
  active_jobs: number;
  total_swipes: number;
  total_matches: number;
  total_messages: number;
  open_reports: number;
  unverified_users: number;
};

export function getPlatformStats(): PlatformStats {
  const db = getDb();
  const u = db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
  const cands = db.prepare("SELECT COUNT(*) AS n FROM candidates").get() as { n: number };
  const emps = db.prepare("SELECT COUNT(*) AS n FROM employers").get() as { n: number };
  const jobs = db.prepare("SELECT COUNT(*) AS n FROM jobs").get() as { n: number };
  const activeJobs = db.prepare("SELECT COUNT(*) AS n FROM jobs WHERE is_active=1").get() as { n: number };
  const swipes = db.prepare("SELECT COUNT(*) AS n FROM swipes").get() as { n: number };
  const matches = db.prepare("SELECT COUNT(*) AS n FROM matches").get() as { n: number };
  const msgs = db.prepare("SELECT COUNT(*) AS n FROM messages").get() as { n: number };
  const reports = db.prepare("SELECT COUNT(*) AS n FROM reports WHERE status='open'").get() as { n: number };
  const unverified = db.prepare("SELECT COUNT(*) AS n FROM users WHERE email_verified_at IS NULL").get() as { n: number };

  return {
    total_users: u.n,
    total_candidates: cands.n,
    total_employers: emps.n,
    total_jobs: jobs.n,
    active_jobs: activeJobs.n,
    total_swipes: swipes.n,
    total_matches: matches.n,
    total_messages: msgs.n,
    open_reports: reports.n,
    unverified_users: unverified.n,
  };
}

export type AdminUserRow = {
  id: string;
  email: string;
  role: string;
  display_name: string;
  avatar_emoji: string;
  created_at: number;
  email_verified_at: number | null;
  is_disabled: number;
};

export function listUsersForAdmin(limit = 100, offset = 0): AdminUserRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT
         u.id, u.email, u.role, u.created_at, u.email_verified_at, u.is_disabled,
         COALESCE(c.full_name, e.company_name, u.email) AS display_name,
         COALESCE(c.avatar_emoji, e.logo_emoji, '👤') AS avatar_emoji
       FROM users u
       LEFT JOIN candidates c ON c.user_id = u.id
       LEFT JOIN employers e ON e.user_id = u.id
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(limit, offset) as AdminUserRow[];
}

export type AdminJobRow = JobRow & {
  company_name: string;
  logo_emoji: string;
  like_count: number;
  match_count: number;
};

export function listJobsForAdmin(limit = 100, offset = 0): AdminJobRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT
         j.*,
         e.company_name,
         e.logo_emoji,
         (SELECT COUNT(*) FROM swipes WHERE target_kind='job' AND target_id=j.id AND direction='like') AS like_count,
         (SELECT COUNT(*) FROM matches WHERE job_id=j.id) AS match_count
       FROM jobs j
       JOIN employers e ON e.user_id = j.employer_id
       ORDER BY j.created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(limit, offset) as AdminJobRow[];
}

export type AdminReportRow = ReportRow & {
  reporter_email: string;
  target_display: string;
};

export function listReportsForAdmin(
  status: "open" | "reviewed" | "dismissed" | "all" = "open",
  limit = 100
): AdminReportRow[] {
  const db = getDb();
  const sql = `SELECT
       r.*,
       u.email AS reporter_email,
       COALESCE(
         (SELECT full_name FROM candidates WHERE user_id = r.target_id),
         (SELECT company_name FROM employers WHERE user_id = r.target_id),
         (SELECT title FROM jobs WHERE id = r.target_id),
         r.target_id
       ) AS target_display
     FROM reports r
     JOIN users u ON u.id = r.reporter_id
     ${status === "all" ? "" : "WHERE r.status = ?"}
     ORDER BY r.created_at DESC
     LIMIT ?`;
  const params = status === "all" ? [limit] : [status, limit];
  return db.prepare(sql).all(...params) as AdminReportRow[];
}

export function updateReportStatus(
  reportId: number,
  status: "reviewed" | "dismissed"
): void {
  const db = getDb();
  db.prepare("UPDATE reports SET status=? WHERE id=?").run(status, reportId);
}

export function setUserDisabled(userId: string, disabled: boolean): void {
  const db = getDb();
  db.prepare("UPDATE users SET is_disabled=? WHERE id=?").run(
    disabled ? 1 : 0,
    userId
  );
}

/** Hard-delete a user and all their data (CASCADE handles relations). */
export function deleteUserAdmin(userId: string): void {
  const db = getDb();
  db.prepare("DELETE FROM users WHERE id=?").run(userId);
}

/** Self-service account deletion. */
export function deleteAccount(userId: string): void {
  const db = getDb();
  db.prepare("DELETE FROM users WHERE id=?").run(userId);
}
