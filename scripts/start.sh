#!/bin/sh
# Startup wrapper for JobSwipe production container.
# Seeds the database with demo data on first run (DB file absent).

set -e

DB_FILE="/app/data/jobswipe.db"

if [ ! -f "$DB_FILE" ]; then
  echo "🌱 First run detected — seeding demo data..."
  node /app/scripts/seed.cjs && echo "✅ Demo data ready."
else
  echo "✅ Database exists — skipping seed."
fi

exec node server.js
