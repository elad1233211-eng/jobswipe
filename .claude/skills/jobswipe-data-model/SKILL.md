---
name: jobswipe-data-model
description: Load this skill when working on JobSwipe business logic — matches, swipes, feeds, messaging, reports, blocks, rate limiting, moderation, or anything that reads/writes the SQLite schema. Covers the tables in lib/db.ts, the domain functions in lib/domain.ts, and the invariants that must hold (bilateral match, one-way block, rate-limit windows). Triggers include edits to lib/*.ts, scripts/seed.ts, or any server action.
---

# JobSwipe data model

DB file: `data/jobswipe.db` (WAL mode, `foreign_keys=ON`). Schema created at startup via `IF NOT EXISTS` in `lib/db.ts`.

## Tables (quick reference)

| Table | PK | Notes |
|---|---|---|
| `users` | id | `role IN ('candidate','employer')` |
| `candidates` | user_id → users | `skills_json` is a JSON array string |
| `employers` | user_id → users | |
| `jobs` | id | `requirements_json` is JSON; `is_active` 0/1 |
| `swipes` | (from_user_id, target_kind, target_id) UNIQUE | `target_kind IN ('job','candidate')`, `direction IN ('like','pass')` |
| `matches` | id, UNIQUE(candidate_id, job_id) | Created only when both sides liked |
| `messages` | autoincr int | Belongs to a match |
| `rate_limits` | (action, identifier) | Fixed-window counter |
| `reports` | autoincr int | `target_kind IN ('user','job')`, `status IN ('open','reviewed','dismissed')` |
| `blocks` | (blocker_id, blocked_id) | One-way |

All FK cascades are `ON DELETE CASCADE` so deleting a user cleans up cleanly.

## Row types

Exported from `lib/db.ts`: `UserRow`, `CandidateRow`, `EmployerRow`, `JobRow`, `MatchRow`, `MessageRow`, `ReportRow`, `BlockRow`. Always import the type — never redeclare.

## Business invariants

1. **Bilateral match**: a row is inserted into `matches` only after both `swipes` rows exist with `direction='like'`. The domain function `swipeJob` / `swipeCandidate` handles this atomically; never insert into `matches` manually.
2. **Feed exclusions**: `getFeedForCandidate` and `getFeedForEmployer` filter out both directions of the `blocks` table (candidate blocked employer OR employer blocked candidate). Keep this when modifying the feed query.
3. **One-way block**: `blockUser(A, B)` only inserts `(A → B)`. UI surfaces are always rendered from the blocker's side via `listBlockedUsers(blockerId)`.
4. **Rate limit window**: fixed window, not sliding. `rateLimit(action, identifier, limit, windowMs)` returns `{ ok, remaining, resetAt }`. Identifier is `userId` for authed flows, `getClientKey()` (x-forwarded-for / x-real-ip) for anon.
5. **Moderation**: all user-generated text (messages, job title, job description) goes through `lib/moderation.ts`. `moderateText` → `{ text, blocked, filtered }`. Blocked = refuse; filtered = saved with asterisks.

## Domain entry points (lib/domain.ts)

Profiles: `getCandidateProfile`, `upsertCandidateProfile`, `getEmployerProfile`, `upsertEmployerProfile`.

Jobs: `createJob`, `getJob`, `listJobsByEmployer`, `updateJob`, `deleteJob`, `setJobActive`, `getJobCategories`, `getJobCities`.

Feeds: `getFeedForCandidate(candidateId, filters)` with `FeedFilters = { city?, category?, minWage? }`, `getFeedForEmployer(employerId)`.

Swipes + matches: `swipeJob(candidateId, jobId, direction)`, `swipeCandidate(employerId, candidateId, jobId, direction)`, both return `SwipeResult = { matched: boolean, matchId?: string }`. `listMatchesForCandidate`, `listMatchesForEmployer`, `countUnseenMatches(userId)`, `getMatch(id, userId)`.

Messages: `getMessages(matchId)`, `sendMessage(matchId, senderId, body)`.

Safety: `createReport({reporterId, targetKind, targetId, reason, details?})`, `listOpenReports(limit)`, `blockUser(blocker, blocked)`, `unblockUser`, `isBlockedEitherWay(a, b)`, `listBlockedUsers(blockerId)`.

## Rate limit presets already in use

| Action | Limit | Window | Identifier |
|---|---|---|---|
| `signup` | 5 | 1h | IP |
| `login` | 10 | 15m | IP |
| `send_message` | 30 | 1m | userId |
| `report` | 20 | 24h | userId |

Add new ones sparingly; prefer tighter identifier (userId) over IP when the flow is authed.

## Rules when extending the schema

- Add new table in `initSchema(db)`, keep `CREATE TABLE IF NOT EXISTS`.
- Export a matching `Row` type from `lib/db.ts`.
- If the column is nullable, reflect it in the TS type with `| null`.
- SQLite stores booleans as 0/1 integers — convert with `!!row.col` when returning.
- All writes that touch multiple tables go through `db.transaction(...)` (see `swipeJob` in `domain.ts` for the pattern).

## Seed (scripts/seed.ts)

`npm run seed` inserts demo data but NEVER deletes existing rows. Use `npm run db:reset` to wipe the whole `data/` directory and reseed. The seed must keep working with the `lib/password.ts` helper (never import `lib/auth.ts` from a script — it pulls `next/headers`).
