---
name: jobswipe-orientation
description: Load this skill when the user asks anything about the JobSwipe project — status, architecture, where code lives, what's done, what's pending, or general "how does this app work" questions. Covers the Hebrew blue-collar-jobs Tinder-style MVP. Queries that should load this include סטטוס / מה המצב / מה עשית / how is the project / project overview / where is X / JobSwipe anything.
---

# JobSwipe — orientation

Hebrew RTL Tinder-style jobs platform for Israel (blue-collar first: waiters, delivery, cleaning, warehouse, cashiers). MVP only. No paid services — everything runs locally.

## Stack (important — read AGENTS.md; Next.js is version 16 with breaking changes)

- Next.js 16.2.4 App Router (Turbopack by default, React 19.2).
- TypeScript strict.
- Tailwind CSS 4 (`@theme inline` in `app/globals.css`).
- `better-sqlite3` — DB at `data/jobswipe.db`. **Must stay in `serverExternalPackages`**.
- `framer-motion` for swipe cards.
- `jose` + `bcryptjs` — JWT in httpOnly cookie `jobswipe_session`, 30-day TTL.
- `zod` for input validation.

## Directory layout (only what matters)

```
app/
├── (auth)/{login,signup}/        # role selector (candidate/employer)
├── (legal)/legal/{privacy,terms,accessibility}/
├── actions/                      # Server Actions
│   ├── auth.ts      — signup/login/logout (rate-limited)
│   ├── profile.ts   — candidate/employer upsert + job CRUD (moderated)
│   ├── swipe.ts     — swipe + sendMessage (rate-limited + moderated)
│   └── safety.ts    — report + block/unblock
├── api/health/route.ts           # DB-checked health endpoint
├── app/                          # authenticated area (layout enforces session + onboarding)
│   ├── feed/                     # candidate swipe feed + filters
│   ├── employer/                 # dashboard, job new/edit, candidate swipe per job
│   ├── matches/[id]/             # chat with report+block header buttons
│   └── profile/                  # profile + blocked list + legal links
├── components/
│   ├── ReportDialog.tsx          # modal for reporting user/job
│   └── BlockButton.tsx           # block/unblock with confirm-twice
├── onboarding/{candidate,employer}/
├── error.tsx / global-error.tsx  # use `unstable_retry`, NOT `reset`
├── not-found.tsx / loading.tsx
├── layout.tsx                    # <html lang="he" dir="rtl"> + Heebo
└── page.tsx                      # landing with footer legal links
lib/
├── db.ts           — SQLite schema + row types. Adds rate_limits, reports, blocks.
├── domain.ts       — ALL business logic (feeds, matches, swipes, messages, reports, blocks).
├── auth.ts         — sessions/JWT. Re-exports password helpers.
├── password.ts     — bcrypt wrappers (no Next deps; safe for scripts).
├── rate-limit.ts   — SQLite fixed-window rate limiter + getClientKey().
└── moderation.ts   — profanity filter + validateJobText/sanitizeMessage.
scripts/seed.ts     — demo data (pizzaria, market, cleaning, delivery + 4 candidates).
```

## Demo users (seeded via `npm run seed`; password for all: `demo1234`)

Employers: `pizzaria@demo.com`, `market@demo.com`, `cleaning@demo.com`, `delivery@demo.com`.

Candidates: `noa@demo.com` (pre-liked waiter job at pizzaria), `amit@demo.com` (pre-liked delivery), `maya@demo.com`, `daniel@demo.com` (pre-liked cleaning).

Fastest match demo: log in as `pizzaria@demo.com` → open the waiter job → Noa is waiting → like her → match dialog appears.

## What's done (high-level)

Core: signup/login/logout, onboarding for both roles, swipe feed with framer-motion, two-sided match logic, chat with optimistic updates, match badge in bottom nav, filters (city/category/minWage), employer job CRUD.

Launch-readiness (just added): privacy/terms/accessibility pages in Hebrew, footer links, `not-found`/`error`/`loading`/`global-error`, `/api/health`, SQLite rate limiting on signup/login/messages/reports, basic Hebrew+English profanity filter, report/block user with feed exclusion, `output: "standalone"` + Dockerfile + docker-compose + DEPLOYMENT.md, security headers in `next.config.ts`, strong `AUTH_SECRET` in `.env.local`.

## Conventions that bite

- Server Actions with multi-arg: use `.bind(null, id)` (see `updateJobAction`, `toggleJobActiveAction`).
- `useActionState` for form state; return values, don't throw.
- All `page.tsx` props are `PageProps<"/route">` type; `params` and `searchParams` are Promises — always `await` them.
- Error boundary signature: `{ error, unstable_retry }` — NOT `reset`.
- Never commit `.env.local`. Generate secret with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`.

## Related skills

- `jobswipe-data-model` — DB schema + domain function reference.
- `jobswipe-nextjs16` — specific Next 16 patterns used here.
- `jobswipe-ops` — run, seed, build, smoke-test, deploy.
