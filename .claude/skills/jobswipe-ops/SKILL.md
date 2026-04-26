---
name: jobswipe-ops
description: Load this skill when the user wants to run, smoke-test, reset, seed, build, or deploy JobSwipe. Covers local dev commands, Docker / docker-compose / DEPLOYMENT.md usage, health checks, backup strategy, and which URLs to hit for quick verification. Triggers include "how do I run", "show me the app", "איך מריצים", "סטטוס בדוק", deploy, docker, backup, smoke test, or anything about production readiness.
---

# JobSwipe — run, test, deploy

All commands run from `jobswipe/` directory. Only free tooling — no paid services.

## Local development

```bash
npm install                # one-time (already done)
npm run seed               # populate demo data (safe to re-run; additive)
npm run dev                # http://localhost:3000 (Turbopack)
npm run build              # production build; must pass before shipping
npm run start              # serve the production build on :3000
npm run db:reset           # wipe data/ and reseed from scratch
```

`.env.local` must exist with `AUTH_SECRET` (file is gitignored). Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

## URLs worth hitting when smoke-testing

| URL | What it proves |
|---|---|
| `/` | Landing page renders with legal footer |
| `/login`, `/signup` | Auth screens render with legal links |
| `/api/health` | JSON `{status: "ok", latencyMs, ...}` — DB is alive |
| `/legal/privacy`, `/legal/terms`, `/legal/accessibility` | Static legal pages |
| `/app/feed` (as candidate) | Swipe stack loads |
| `/app/employer` (as employer) | Job list + "+ new job" |
| `/app/matches` | List + badge in bottom nav |

One-shot smoke with curl:

```bash
for p in / /login /signup /legal/privacy /legal/terms /legal/accessibility /api/health; do
  printf '%-30s %s\n' "$p" "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000$p)"
done
```

## Demo users (password for all: `demo1234`)

- Employers: `pizzaria@demo.com`, `market@demo.com`, `cleaning@demo.com`, `delivery@demo.com`.
- Candidates: `noa@demo.com` (pre-liked waiter job), `amit@demo.com` (pre-liked delivery), `maya@demo.com`, `daniel@demo.com` (pre-liked cleaning).

**Fastest match demo**: log in as `pizzaria@demo.com` → click the waiter job → like Noa → match dialog pops → send a message.

## Build verification checklist

Before telling the user "done":

1. `npm run build` exits 0, shows expected route count (currently 18 routes).
2. No new TypeScript errors.
3. If a page/route was added or changed, hit it with curl against a running dev server.
4. If DB schema changed, `npm run db:reset` followed by `npm run seed` must succeed.

## Docker / production

Single-command deploy:

```bash
echo "AUTH_SECRET=$(node -e 'console.log(require(\"crypto\").randomBytes(48).toString(\"base64url\"))')" > .env
docker compose up -d --build
curl http://localhost:3000/api/health
```

The image uses Next.js `output: "standalone"`. SQLite persists in the `jobswipe_data` named volume. `HEALTHCHECK` polls `/api/health` every 30s inside the container.

Full deploy guide (Hebrew): `DEPLOYMENT.md` — covers Caddy + Let's Encrypt, SQLite backup with `VACUUM INTO`, Fly.io / Railway / Oracle Always-Free options.

## Backups

SQLite is a single file. For a hot backup without stopping the service:

```bash
docker compose exec app node -e "require('better-sqlite3')('/app/data/jobswipe.db').exec('VACUUM INTO \"/app/data/backup.db\"')"
docker compose cp app:/app/data/backup.db ./backups/jobswipe-$(date +%F).db
```

## Common failure modes

- **`npm run seed` fails with "cannot find module 'next/headers'"**: someone imported `lib/auth.ts` from the script. Import from `lib/password.ts` instead.
- **`npm run dev` exits immediately with port-in-use**: another dev server is already running on :3000. Use `lsof -i :3000` / kill it.
- **Build fails on `better-sqlite3`**: `serverExternalPackages: ["better-sqlite3"]` is missing from `next.config.ts`.
- **Rate limit never triggers locally**: `getClientKey()` returns `"local"` when no `x-forwarded-for` header is present. That's expected in dev — use a real proxy to test per-IP isolation.
