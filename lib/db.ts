import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const DB_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const DB_PATH = path.join(DB_DIR, "jobswipe.db");

declare global {
  // eslint-disable-next-line no-var
  var __db: Database.Database | undefined;
}

function createDb() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  initSchema(db);
  migrateSchema(db);
  // Best-effort: purge rate-limit rows older than 48 h on startup
  try {
    db.prepare("DELETE FROM rate_limits WHERE window_start < ?").run(
      Date.now() - 48 * 60 * 60 * 1000
    );
  } catch { /* non-fatal */ }
  return db;
}

/** Safe column migrations — run after initSchema on every startup. */
function migrateSchema(db: Database.Database) {
  const userCols = db.pragma("table_info(users)") as Array<{ name: string }>;

  // Add email_verified_at to users (nullable; NULL = unverified).
  if (!userCols.some((c) => c.name === "email_verified_at")) {
    db.exec("ALTER TABLE users ADD COLUMN email_verified_at INTEGER");
  }

  // Add is_disabled flag (0 = active, 1 = disabled by admin).
  if (!userCols.some((c) => c.name === "is_disabled")) {
    db.exec("ALTER TABLE users ADD COLUMN is_disabled INTEGER NOT NULL DEFAULT 0");
  }
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('candidate','employer')),
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS candidates (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      age INTEGER,
      city TEXT,
      bio TEXT,
      experience_years INTEGER,
      min_hourly_wage INTEGER,
      available_immediately INTEGER DEFAULT 1,
      avatar_emoji TEXT DEFAULT '👤',
      skills_json TEXT DEFAULT '[]',
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS employers (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      company_name TEXT NOT NULL,
      contact_name TEXT,
      city TEXT,
      description TEXT,
      logo_emoji TEXT DEFAULT '🏢',
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      employer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      city TEXT NOT NULL,
      hourly_wage INTEGER,
      hours_per_week INTEGER,
      shift_type TEXT,
      description TEXT,
      requirements_json TEXT DEFAULT '[]',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(is_active);
    CREATE INDEX IF NOT EXISTS idx_jobs_city ON jobs(city);

    -- swipes: direction is 'like' or 'pass'
    -- from_user_id swipes on target_id (which is either a job_id or a candidate user_id)
    CREATE TABLE IF NOT EXISTS swipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      target_kind TEXT NOT NULL CHECK(target_kind IN ('job','candidate')),
      target_id TEXT NOT NULL,
      direction TEXT NOT NULL CHECK(direction IN ('like','pass')),
      created_at INTEGER NOT NULL,
      UNIQUE(from_user_id, target_kind, target_id)
    );

    CREATE INDEX IF NOT EXISTS idx_swipes_from ON swipes(from_user_id);
    CREATE INDEX IF NOT EXISTS idx_swipes_target ON swipes(target_kind, target_id);

    -- A match is created when both sides liked each other
    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      candidate_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      employer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL,
      UNIQUE(candidate_id, job_id)
    );

    CREATE INDEX IF NOT EXISTS idx_matches_candidate ON matches(candidate_id);
    CREATE INDEX IF NOT EXISTS idx_matches_employer ON matches(employer_id);

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(match_id, created_at);

    -- ---------- Safety: rate limits, reports, blocks ----------

    -- Token-bucket-style rate limiting keyed by (action, identifier).
    -- identifier is typically the userId, or the IP address for unauthenticated actions.
    CREATE TABLE IF NOT EXISTS rate_limits (
      action TEXT NOT NULL,
      identifier TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      window_start INTEGER NOT NULL,
      PRIMARY KEY (action, identifier)
    );

    -- A report can target either a user (candidate/employer) or a specific job.
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      target_kind TEXT NOT NULL CHECK(target_kind IN ('user','job')),
      target_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      details TEXT,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','reviewed','dismissed')),
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_kind, target_id);
    CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

    -- One-way block: blocker_id will not see / be seen by blocked_id in any feed.
    CREATE TABLE IF NOT EXISTS blocks (
      blocker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      blocked_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (blocker_id, blocked_id)
    );

    CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks(blocked_id);

    -- ---------- Email verification ----------
    -- One token per user; replaced on every resend.
    CREATE TABLE IF NOT EXISTS email_verifications (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      token   TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL
    );

    -- ---------- Web Push subscriptions ----------
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      endpoint   TEXT NOT NULL,
      p256dh     TEXT NOT NULL,
      auth       TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(user_id, endpoint)
    );

    CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id);
  `);
}

export function getDb(): Database.Database {
  if (!global.__db) {
    global.__db = createDb();
  }
  return global.__db;
}

export type Role = "candidate" | "employer";

export type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  role: Role;
  created_at: number;
  email_verified_at: number | null;
  is_disabled: number; // 0 = active, 1 = disabled by admin
};

export type CandidateRow = {
  user_id: string;
  full_name: string;
  age: number | null;
  city: string | null;
  bio: string | null;
  experience_years: number | null;
  min_hourly_wage: number | null;
  available_immediately: number;
  avatar_emoji: string;
  skills_json: string;
  updated_at: number;
};

export type EmployerRow = {
  user_id: string;
  company_name: string;
  contact_name: string | null;
  city: string | null;
  description: string | null;
  logo_emoji: string;
  updated_at: number;
};

export type JobRow = {
  id: string;
  employer_id: string;
  title: string;
  category: string;
  city: string;
  hourly_wage: number | null;
  hours_per_week: number | null;
  shift_type: string | null;
  description: string | null;
  requirements_json: string;
  is_active: number;
  created_at: number;
};

export type MatchRow = {
  id: string;
  candidate_id: string;
  employer_id: string;
  job_id: string;
  created_at: number;
};

export type MessageRow = {
  id: number;
  match_id: string;
  sender_id: string;
  body: string;
  created_at: number;
};

export type ReportRow = {
  id: number;
  reporter_id: string;
  target_kind: "user" | "job";
  target_id: string;
  reason: string;
  details: string | null;
  status: "open" | "reviewed" | "dismissed";
  created_at: number;
};

export type BlockRow = {
  blocker_id: string;
  blocked_id: string;
  created_at: number;
};

export type PushSubRow = {
  id: number;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: number;
};
