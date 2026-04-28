#!/bin/sh
# Startup wrapper for JobSwipe production container.
# Seeds the database only when no users exist yet (truly first run).
# Using user-count check (not just file existence) protects against
# accidental re-seed after a volume remount that preserves the file.

set -e

DB_FILE="/app/data/jobswipe.db"

should_seed() {
  # Returns 0 (true) if DB has zero users
  if [ ! -f "$DB_FILE" ]; then return 0; fi
  USER_COUNT=$(node -e "
    const db = require('better-sqlite3')('$DB_FILE');
    try { console.log(db.prepare('SELECT COUNT(*) AS n FROM users').get().n); }
    catch(e) { console.log(0); }
  " 2>/dev/null || echo 0)
  [ "$USER_COUNT" = "0" ]
}

if should_seed; then
  echo "🌱 First run detected — seeding demo data..."
  node /app/scripts/seed.cjs && echo "✅ Demo data ready."
else
  echo "✅ Database exists with users — skipping seed."
fi

exec node server.js
