# syntax=docker/dockerfile:1.6
#
# Multi-stage build for JobSwipe. Produces a small image using Next.js'
# "standalone" output. SQLite DB lives on a mounted volume at /app/data.

# ---------- deps ----------
FROM node:20-bookworm-slim AS deps
WORKDIR /app

# better-sqlite3 needs a toolchain to build native bindings.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm ci

# ---------- builder ----------
FROM node:20-bookworm-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js 16 telemetry is opt-out; disable during build.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Compile the seed script to a portable CJS bundle (no tsx needed at runtime).
# better-sqlite3 stays external — the native binary is copied separately.
RUN node_modules/.bin/esbuild scripts/seed.ts \
      --bundle \
      --platform=node \
      --format=cjs \
      --external:better-sqlite3 \
      --outfile=scripts/seed.cjs

# ---------- runner ----------
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Copy only what the standalone server needs.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Native module for SQLite — copy the prebuilt binary from the builder.
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3

# Seed script bundle (runs on first boot if no DB exists).
RUN mkdir -p /app/scripts
COPY --from=builder /app/scripts/seed.cjs ./scripts/seed.cjs

# Startup wrapper: seeds DB on first run, then starts the server.
COPY scripts/start.sh /app/scripts/start.sh
RUN chmod +x /app/scripts/start.sh

# SQLite file lives under /app/data.
# Railway: add a Volume and mount it to /app/data in the Railway dashboard —
# do NOT use the VOLUME instruction here (Railway bans it).
# Run as root so the process can write to the Railway-mounted volume
# (Railway volumes are owned by root; container isolation provides the security boundary).
RUN mkdir -p /app/data

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:${PORT:-8080}/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["/bin/sh", "/app/scripts/start.sh"]
